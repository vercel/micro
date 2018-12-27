import contentType from "content-type";
import getRawBody from "raw-body";

import { HttpRequest } from "./http-message";
import { createError } from "./error";

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap<HttpRequest, string | Buffer>();

export async function buffer(
	req: HttpRequest,
	{ limit = "1mb", encoding }: { limit?: string | number; encoding?: string } = {} // TODO: fix the typing of encoding.
) {
	const type = req.headers["content-type"] || "text/plain";
	const length = req.headers["content-length"];

	if (encoding === undefined) {
		encoding = contentType.parse(type).parameters.charset; // TODO: We should fix the typing of content-type lib. charset is actually string | undefined
	}

	const body = rawBodyMap.get(req);

	if (body) {
		return body;
	}

	return await getRawBody(req, {
		limit,
		length,
		encoding
	}) // TODO: Investigate on the case wherer the body is string.
		.then((buf: string | Buffer) => {
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
	{ limit, encoding }: { limit?: string | number; encoding?: string } = {}
) {
	return (await buffer(req, { limit, encoding })).toString(encoding);
}

function parseJSON(str: string) {
	try {
		return JSON.parse(str);
	} catch (err) {
		throw createError(400, "Invalid JSON", err);
	}
}

export async function json(
	req: HttpRequest,
	opts: { limit?: string | number; encoding?: string } = {}
) {
	return parseJSON(await text(req, opts));
}
