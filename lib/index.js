// Native
const server = require('http').Server;
const {Stream} = require('stream');

// Packages
const contentType = require('content-type');
const getRawBody = require('raw-body');

const {NODE_ENV} = process.env;
const DEV = NODE_ENV === 'development';

const serve = fn => server((req, res) => exports.run(req, res, fn));

module.exports = serve;
exports = serve;
exports.default = serve;

class MicriError extends Error {
	constructor(statusCode, code, message, originalError) {
		super(message);

		this.statusCode = statusCode;
		this.code = code;
		this.originalError = originalError;
	}
}

exports.MicriError = MicriError;

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
const readable = stream =>
	stream !== null &&
	typeof stream === 'object' &&
	typeof stream.pipe === 'function' &&
	stream.readable !== false &&
	typeof stream._read === 'function' &&
	typeof stream._readableState === 'object';

const send = (res, code, obj = null) => {
	res.statusCode = code;

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

	let str = obj;

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
};

function isAcceptJson(headers) {
	const {accept} = headers;
	let type = '*/*';

	try {
		const ct = contentType.parse(accept || type);
		type = ct.type || '*/*';
	} catch (err) {
		// NOP
	}

	return type === '*/*' || accept === 'application/json';
}

const sendError = (req, res, errorObj) => {
	const acceptJson = isAcceptJson(req.headers);
	let statusCode = 500;
	let body = acceptJson
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
				delete body.error.statusCode;
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

exports.send = send;
exports.sendError = sendError;

exports.run = (req, res, fn) =>
	new Promise(resolve => resolve(fn(req, res)))
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

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap();

const parseJSON = str => {
	try {
		return JSON.parse(str);
	} catch (err) {
		throw new MicriError(400, 'invalid_json', 'Invalid JSON', err);
	}
};

exports.buffer = (req, {limit = '1mb', encoding} = {}) =>
	Promise.resolve().then(() => {
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

		return getRawBody(req, {limit, length, encoding})
			.then(buf => {
				rawBodyMap.set(req, buf);
				return buf;
			})
			.catch(err => {
				if (err.type === 'entity.too.large') {
					throw new MicriError(413, 'request_entity_too_large', `Body exceeded ${limit} limit`, err);
				} else {
					throw new MicriError(400, 'invalid_body', 'Invalid body', err);
				}
			});
	});

exports.text = (req, {limit, encoding} = {}) =>
	exports.buffer(req, {limit, encoding}).then(body => body.toString(encoding));

exports.json = (req, opts) =>
	exports.text(req, opts).then(body => parseJSON(body));
