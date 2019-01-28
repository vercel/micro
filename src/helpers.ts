import contentType from "content-type";
import getRawBody from "raw-body";

import { createError } from "./error";
import { HttpRequest } from "./http-message";

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap<HttpRequest, Buffer | string>();

export async function buffer(
	req: HttpRequest,
	{
		limit = "1mb",
		encoding
	}: { limit?: number | string | null; encoding?: string } = {}
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
	req: HttpRequest,
	{
		limit,
		encoding
	}: { limit?: string | number | null; encoding?: string } = {}
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
	req: HttpRequest,
	opts: { limit?: string | number | null; encoding?: string } = {}
) {
	return text(req, opts).then(body => parseJSON(body));
}
