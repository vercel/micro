import { parse } from 'url';
import { promisify } from 'util';
import micri, {
	IncomingMessage,
	ServerResponse,
	MicriHandler,
	Router,
	send
} from 'micri';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';
import { auth, getAToken } from './auth';
import { Opts } from './types';
import {jwtSecret, useSecureCookies, authCookieName } from './config';

const { router, on, otherwise } = Router;
const jwtVerify = promisify(jwt.verify);

function logout(_req: IncomingMessage, res: ServerResponse, opts: Opts) {
	const expires = new Date(0);

	// Clear cookies
	opts.cookies.set('authstate', '', { expires, secure: useSecureCookies, sameSite: 'strict' });
	opts.cookies.set(authCookieName, '', { expires, secure: useSecureCookies, sameSite: 'strict' })

	res.statusCode = 307;
	res.setHeader('Location', '/');
	res.end();
}

const authReq = (hndl: MicriHandler): MicriHandler =>
	async (req: IncomingMessage, res: ServerResponse, opts: Opts) => {
		if (['/auth', '/token'].includes(opts.path)) {
			return hndl(req, res, opts);
		}

		try {
			const token = opts.cookies.get(authCookieName);

			if (!token) {
				// Not authenticated so redirect to auth on server-side.
				return auth(req, res, opts);
			}

			const decoded = await jwtVerify(token, jwtSecret) as {name: string, my_tenant: string, my_accessToken: string };

			if (typeof decoded.name !== 'string' ||
				typeof decoded.my_tenant !== 'string' ||
				typeof decoded.my_accessToken !== 'string') {
				throw new Error('Bail out');
			}

			return hndl(req, res, {
				...opts,
				user: {
					name: decoded.name,
					tenantId: decoded.my_tenant,
					accessToken: decoded.my_accessToken
				}
			});
		} catch (err) {
			console.error(err);
			return send(res, 400, 'Stop hacking');
		}
	};

const parsePath = (hndl: MicriHandler): MicriHandler =>
	(req: IncomingMessage, res: ServerResponse, opts: Opts) => {
		const url = parse(req.url || '/', true);

		return hndl(req, res, {
			...(opts || {}),
			path: url.pathname || '/',
			query: url.query,
			cookies: new Cookies(req, res)
		});
	};

micri<Opts>(parsePath(authReq(router<Opts>(
	on.get((_req: IncomingMessage, _res: ServerResponse, opts: Opts) => opts.path === '/auth', auth),
	on.get((_req: IncomingMessage, _res: ServerResponse, opts: Opts) => opts.path === '/token', getAToken),
	on.get((_req: IncomingMessage, _res: ServerResponse, opts: Opts) => opts.path === '/logout', logout),
	on.get(() => true, (_req: IncomingMessage, _res: ServerResponse, opts: Opts) => `Hello ${opts.user?.name}`),
	otherwise((_req: IncomingMessage, res: ServerResponse) => send(res, 400, 'Method Not Accepted'))))))
	.listen(3000);
