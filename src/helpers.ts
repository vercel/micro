import contentType from "content-type";
import getRawBody from "raw-body";

import { createError } from "./error";
import { IncomingMessage } from "http";

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap<IncomingMessage, Buffer | string>();

export async function buffer(
	req: IncomingMessage,
	{
		limit = "1mb",
		encoding
	}: { limit?: number | string; encoding?: string } = {}
): Promise<Buffer | string> {
	const type = req.headers["content-type"] || "text/plain";
	const length = req.headers["content-length"];

	// eslint-disable-next-line no-undefined
	if (encoding === undefined) {
		encoding = contentType.parse(type).parameters.charset;
	}

	const body = rawBodyMap.get(req);

	if (body) {
		return body;
	}

	return getRawBody(req, { limit, length, encoding })
		.then(buf => {
			rawBodyMap.set(req, buf);
			return buf;
		})
		.catch(err => {
			if (err.type === "entity.too.large") {
				throw createError(413, `Body exceeded ${limit} limit`, err);
			} else {
				throw createError(400, "Invalid body", err);
			}
		});
}

export async function text(
	req: IncomingMessage,
	{
		limit,
		encoding
	}: { limit?: string | number; encoding?: string } = {}
): Promise<string> {
	const body = await buffer(req, { limit, encoding });
	return body.toString(encoding);
}

function parseJSON(str: string) {
	try {
		return JSON.parse(str);
	} catch (error) {
		throw createError(400, "Invalid JSON", error);
	}
}

export async function json(
	req: IncomingMessage,
	opts: { limit?: string | number; encoding?: string } = {}
) {
	return text(req, opts).then(body => parseJSON(body));
}
