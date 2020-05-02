import crypto from 'crypto';
import { promisify } from 'util';
import { IncomingMessage, ServerResponse } from 'http';
import { send } from 'micri';
// MSAL doesn't yet support server side auth so we use ADAL for now
import { AuthenticationContext, TokenResponse } from 'adal-node';
import jwt from 'jsonwebtoken';
import {
	clientId,
	clientSecret,
	authorityUrl,
	redirectUri,
	resource,
	jwtSecret,
	authCookieName,
	useSecureCookies
} from './config';
import {Opts} from './types';


const randomBytes = promisify(crypto.randomBytes);
const createAuthorizationUrl = (state: string) =>
`${authorityUrl}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&resource=${resource}`;

// Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD.
// There they will authenticate and give their consent to allow this app access to
// some resource they own.
export async function auth(_req: IncomingMessage, res: ServerResponse, opts: Opts) {
	const buf = await randomBytes(48);
	const token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
	const maxAge = 60 * 60 * 1000;

	opts.cookies.set('authstate', token, { maxAge, httpOnly: true, secure: useSecureCookies, sameSite: 'strict' });
    var authorizationUrl = createAuthorizationUrl(token);

	res.statusCode = 307;
	res.setHeader('Location', authorizationUrl);
	res.end();
};

// After consent is granted AAD redirects here.  The ADAL library is invoked via the
// AuthenticationContext and retrieves an access token that can be used to access the
// user owned resource.
export async function getAToken(_req: IncomingMessage, res: ServerResponse, opts: Opts) {
	const { query } = opts;
	const authstate = opts.cookies.get('authstate');

	// TODO parse query
	if (authstate !== query.state) {
		// TODO send proper error
		return send(res, 200, 'error: state does not match');
	}

	const authenticationContext = new AuthenticationContext(authorityUrl);

	const code = Array.isArray(query.code) ? query.code[0] : query.code;
	authenticationContext.acquireTokenWithAuthorizationCode(
		code,
		redirectUri,
		resource,
		clientId,
		clientSecret,
		(err, response) => {
			if (err) {
				console.error(err);
				return send(res, 500);
			}
			if (response.error) {
				return send(res, 400);
			}

			const { accessToken, tenantId, userId, givenName, expiresIn } = response as TokenResponse;
			const token = jwt.sign({
				sub: userId,
				name: givenName,
				my_accessToken: accessToken,
				my_tenant: tenantId
			}, jwtSecret, {
				expiresIn
			});
			const expires = new Date(Date.now() + expiresIn * 1000);
			opts.cookies.set(authCookieName, token, { expires, httpOnly: true, secure: useSecureCookies, sameSite: 'strict' });

			// To avoid a pointless redirect you could also start serving directly from here
			res.statusCode = 307;
			res.setHeader('Location', '/');
			res.end();
		});
};
