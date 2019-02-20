import { OutgoingHttpHeaders } from "http";
import { Readable } from "stream";

export type Body =
	| string
	| number
	| null
	| undefined
	| object
	| Readable
	| Buffer;

export class HttpResponse {
	public constructor(
		private readonly body: Body,
		private readonly statusCode: number = 200,
		private readonly headers: OutgoingHttpHeaders = {}
	) {}

	public setHeaders(headers: OutgoingHttpHeaders) {
		const newHeaders = { ...this.headers, ...headers };
		return new HttpResponse(this.body, this.statusCode, newHeaders);
	}

	public getHeaders() {
		return this.headers;
	}

	public setStatus(statusCode: number) {
		return new HttpResponse(this.body, statusCode, this.headers);
	}

	public getStatus() {
		return this.statusCode;
	}

	public setBody(body: Body) {
		return new HttpResponse(body, this.statusCode, this.headers);
	}

	public getBody() {
		return this.body;
	}
}

export function res(
	body: Body,
	statusCode?: number,
	headers?: OutgoingHttpHeaders
) {
	return new HttpResponse(body, statusCode, headers);
}
