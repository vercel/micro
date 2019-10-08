// Native
import { IncomingMessage } from 'http';

// Packages
import contentType from 'content-type';
import getRawBody from 'raw-body';

// Utilities
import { IncomingOpts } from './types';
import { MicriError, MicriBodyError } from './errors';

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap();

export async function buffer(
	req: IncomingMessage,
	{ limit = '1mb' }: IncomingOpts = { limit: '1mb' }
): Promise<Buffer> {
	const length = req.headers['content-length'];

	const body = rawBodyMap.get(req);
	if (body) {
		return body;
	}

	try {
		const buf = await getRawBody(req, { limit, length });
		rawBodyMap.set(req, buf);

		return buf;
	} catch (err) {
		throw new MicriBodyError(err, limit);
	}
}

export async function text(
	req: IncomingMessage,
	{ limit = '1mb', encoding }: IncomingOpts = { limit: '1mb' }
): Promise<string> {
	const type = req.headers['content-type'] || 'text/plain';
	const length = req.headers['content-length'];

	const body = rawBodyMap.get(req);
	if (body) {
		return body;
	}

	// eslint-disable-next-line no-undefined
	if (encoding === undefined) {
		encoding = contentType.parse(type).parameters.charset;
	}

	try {
		const buf = await getRawBody(req, { limit, length, encoding });
		rawBodyMap.set(req, buf);

		// toString() shouldn't be needed here but it doesn't hurt
		return buf.toString();
	} catch (err) {
		throw new MicriBodyError(err, limit);
	}
}

function parseJSON(str: string) {
	try {
		return JSON.parse(str);
	} catch (err) {
		throw new MicriError(400, 'invalid_json', 'Invalid JSON', err);
	}
}

export function json(req: IncomingMessage, opts?: IncomingOpts): Promise<any> {
	return text(req, opts).then(body => parseJSON(body));
}
