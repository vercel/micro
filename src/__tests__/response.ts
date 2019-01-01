import { createReadStream } from "fs";
import { join } from "path";
import { res } from "../http-message";

test("Respond with 404", () => {
	const resp = res("Not Found", 404);

	expect(resp).toEqual({
		body: "Not Found",
		statusCode: 404,
		headers: {}
	});
});

test("Respond with a JSON body", () => {
	const body = { hi: "there" };
	const resp = res(body);

	expect(resp).toEqual({
		body,
		statusCode: 200,
		headers: {}
	});
});

test("Respond with a stream", () => {
	const stream = createReadStream(join(__dirname, "response.ts"));
	const resp = res(stream);

	expect(resp).toEqual({
		body: stream,
		statusCode: 200,
		headers: {}
	});
});

test("Respond with JSON and headers", () => {
	const body = { error: "not_found" };
	const headers = {
		"Access-Allow-Control-Origin": "*"
	};

	const resp = res(body, 404, headers);

	expect(resp).toEqual({
		body,
		statusCode: 404,
		headers
	});
});

test("header composition", () => {
	const resp1 = res("body", 200, { "Content-Type": "text/plain" });
	const resp2 = resp1.setHeaders({ "Access-Allow-Control-Origin": "*" });

	expect(resp1).not.toBe(resp2);
	expect(resp2.getHeaders()).toEqual({
		"Content-Type": "text/plain",
		"Access-Allow-Control-Origin": "*"
	});
});
