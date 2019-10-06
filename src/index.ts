// Native
const server = require('http').Server;
import { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http';
import { Stream } from 'stream';
import bytes from 'bytes';

// Packages
import contentType from 'content-type';
import getRawBody, { RawBodyError } from 'raw-body';

export { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server };
export interface IncomingOpts {
	limit?: string | number;
	encoding?: string | null;
}
export type MicriHandler = (req: IncomingMessage, res: ServerResponse) => any;

const { NODE_ENV } = process.env;
const DEV = NODE_ENV === 'development';

export class MicriError extends Error {
	statusCode: number;
	code: string;
	originalError: Error | null;

	constructor(statusCode: number, code: string, message: string, originalError?: Error) {
		super(message);

		this.statusCode = statusCode;
		this.code = code;
		this.originalError = originalError || null;
	}
}

class MicriBodyError extends MicriError {
	constructor(err: RawBodyError, limit: string | number) {
		let statusCode = 400;
		let code = 'invalid_body';
		let message = 'Invalid body';

		if (err.type === 'entity.too.large') {
			statusCode = 413;
			code = 'request_entity_too_large';
			message = `Body exceeded ${typeof limit === 'string' ? limit : bytes(limit)} limit`;
		}

		super(statusCode, code, message, err);
	}
}

// Returns a `boolean` for whether the argument is a `stream.Readable`.
//
// MIT License
//
// Copyright (c) Olli Vanhoja <olli.vanhoja@gmail.com>
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
const readable = (stream: any) =>
	stream !== null &&
	typeof stream === 'object' &&
	typeof stream.pipe === 'function' &&
	stream.readable !== false &&
	typeof stream._read === 'function' &&
	typeof stream._readableState === 'object';

export function send(res: ServerResponse, statusCode: number, obj: any = null) {
	res.statusCode = statusCode;

	if (obj === null) {
		res.end();
		return;
	}

	if (Buffer.isBuffer(obj)) {
		if (!res.getHeader('Content-Type')) {
			res.setHeader('Content-Type', 'application/octet-stream');
		}

		res.setHeader('Content-Length', obj.length);
		res.end(obj);
		return;
	}

	if (obj instanceof Stream || readable(obj)) {
		if (!res.getHeader('Content-Type')) {
			res.setHeader('Content-Type', 'application/octet-stream');
		}

		obj.pipe(res);
		return;
	}

	let str: string = obj;

	if (typeof obj === 'object' || typeof obj === 'number') {
		// We stringify before setting the header
		// in case `JSON.stringify` throws and a
		// 500 has to be sent instead

		// the `JSON.stringify` call is split into
		// two cases as `JSON.stringify` is optimized
		// in V8 if called with only one argument
		if (DEV) {
			str = JSON.stringify(obj, null, 2);
		} else {
			str = JSON.stringify(obj);
		}

		if (!res.getHeader('Content-Type')) {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
		}
	}

	res.setHeader('Content-Length', Buffer.byteLength(str));
	res.end(str);
}

function isAcceptJson(headers: IncomingHttpHeaders) {
	const { accept } = headers;
	let type = '*/*';

	try {
		const ct = contentType.parse(accept || type);
		type = ct.type || '*/*';
	} catch (err) {
		// NOP
	}

	return type === '*/*' || accept === 'application/json';
}

export const sendError = (req: IncomingMessage, res: ServerResponse, errorObj: MicriError | Error) => {
	const acceptJson = isAcceptJson(req.headers);
	let statusCode = 500;
	let body: any = acceptJson
		? {
				error: {
					code: 'internal_server_error',
					message: 'Internal Server Error'
				}
		  }
		: 'Internal Server Error';

	if (errorObj instanceof MicriError) {
		statusCode = errorObj.statusCode || 500;
		const code = errorObj.code || 'internal_server_error';

		if (acceptJson) {
			if (DEV) {
				body = {
					error: {
						code,
						message: errorObj.message,
						stack: errorObj.stack,
						originalError: errorObj.originalError || null
					}
				};
			} else {
				const message = errorObj.message || 'Internal Server Error';

				body = {
					error: {
						code,
						message
					}
				};
			}
		} else {
			const message = errorObj.message || 'Internal Server Error';

			body = DEV ? errorObj.stack : message;
		}
	} else if (errorObj instanceof Error) {
		console.error(errorObj);
	} else {
		console.warn('thrown error must be an instance Error');
	}

	send(res, statusCode, body);
};

export function run(req: IncomingMessage, res: ServerResponse, fn: MicriHandler) {
	return new Promise(resolve => resolve(fn(req, res)))
		.then(val => {
			if (val === null) {
				send(res, 204, null);
				return;
			}

			// Send value if it is not undefined, otherwise assume res.end
			// will be called later
			// eslint-disable-next-line no-undefined
			if (val !== undefined) {
				send(res, res.statusCode || 200, val);
			}
		})
		.catch(err => sendError(req, res, err));
}

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap();

const parseJSON = (str: string) => {
	try {
		return JSON.parse(str);
	} catch (err) {
		throw new MicriError(400, 'invalid_json', 'Invalid JSON', err);
	}
};

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

	// eslint-disable-next-line no-undefined
	if (encoding === undefined) {
		encoding = contentType.parse(type).parameters.charset;
	}

	const body = rawBodyMap.get(req);
	if (body) {
		return body;
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

export function json(req: IncomingMessage, opts?: IncomingOpts): Promise<any> {
	return text(req, opts).then(body => parseJSON(body));
}

export const serve = (fn: MicriHandler): Server =>
	server((req: IncomingMessage, res: ServerResponse) => run(req, res, fn));
export default serve;
