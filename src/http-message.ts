import { OutgoingHttpHeaders, IncomingMessage } from "http";
import { Readable } from "stream";

export type Body = string | number | null | object | Readable | Buffer; // TODO: is ReadStream enough?

export type HttpRequest = IncomingMessage

export class HttpResponse {
	constructor(
		private body: Body,
		private statusCode: number,
		private headers: OutgoingHttpHeaders
	) {}

	setHeaders(headers: OutgoingHttpHeaders) {
		const newHeaders = { ...this.headers, ...headers };
		return new HttpResponse(this.body, this.statusCode, newHeaders);
	}

	getHeaders() {
		return this.headers;
	}

	setStatus(statusCode: number) {
		return new HttpResponse(this.body, statusCode, this.headers);
	}

	getStatus() {
		return this.statusCode;
	}

	setBody(body: Body) {
		return new HttpResponse(body, this.statusCode, this.headers);
	}

	getBody() {
		return this.body;
	}
}

export function res(
	body: Body,
	statusCode?: number,
	headers?: OutgoingHttpHeaders
) {
	let status = statusCode;
	if (!status) {
		if (body === null) { // TODO: what about undefined?
			status = 204;
		} else {
			status = 200;
		}
	}

	return new HttpResponse(body, status, headers || {});
}
