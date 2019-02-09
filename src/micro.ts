import { Server, ServerResponse, IncomingMessage } from "http";
import { Stream } from "stream";

import { readable } from "is-stream";

import { Body, HttpResponse } from "./http-message";
import { HttpError } from "./error";

export type RequestHanderResult = HttpResponse | Body | void | ServerResponse;

export type RequestHandler = (
	req: IncomingMessage,
	res: ServerResponse
) => Promise<RequestHanderResult> | RequestHanderResult;

const { NODE_ENV } = process.env;
export const DEV = NODE_ENV === "development";

export const serve = (fn: RequestHandler) =>
	new Server((req, res) => run(req, res, fn));

export const send = (res: ServerResponse, code: number, obj: any = null) => {
	res.statusCode = code;

	if (obj === null) {
		res.end();
		return;
	}

	if (Buffer.isBuffer(obj)) {
		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/octet-stream");
		}

		res.setHeader("Content-Length", obj.length);
		res.end(obj);
		return;
	}

	if (obj instanceof Stream || readable(obj)) {
		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/octet-stream");
		}

		obj.pipe(res);
		return;
	}

	let str = obj;

	if (typeof obj === "object" || typeof obj === "number") {
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

		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/json; charset=utf-8");
		}
	}

	res.setHeader("Content-Length", Buffer.byteLength(str));
	res.end(str);
};

export const sendError = (
	req: IncomingMessage,
	res: ServerResponse,
	errorObj: HttpError
) => {
	const statusCode = errorObj.statusCode || errorObj.status;
	const message = statusCode ? errorObj.message : "Internal Server Error";
	send(res, statusCode || 500, DEV ? errorObj.stack : message);
	if (errorObj instanceof Error) {
		console.error(errorObj.stack);
	} else {
		console.warn("thrown error must be an instance Error");
	}
};

export const run = (
	req: IncomingMessage,
	res: ServerResponse,
	fn: RequestHandler
) =>
	new Promise<RequestHanderResult>(resolve => resolve(fn(req, res)))
		.then(val => {
			if (val === null) {
				send(res, 204, null);
				return;
			}

			// Send value if it is not undefined, otherwise assume res.end
			// will be called later
			// eslint-disable-next-line no-undefined
			if (val !== undefined) {
				if (isHttpResponse(val)) {
					res.statusCode = val.getStatus();
					Object.entries(val.getHeaders()).forEach(header => {
						res.setHeader(header[0], header[1] || "");
					});
					const body = val.getBody();

					send(res, res.statusCode, body);
				} else {
					send(res, res.statusCode || 200, val);
				}
			}
		})
		.catch(err => sendError(req, res, err));

const isHttpResponse = (obj: any): obj is HttpResponse =>
	obj instanceof HttpResponse;
