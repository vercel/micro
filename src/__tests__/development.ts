// Packages
import request from "request-promise";
import listen from "test-listen";

process.env.NODE_ENV = "development";
import micro, { RequestHandler } from "..";

const getUrl = (fn: RequestHandler) => listen(micro(fn));

test("send(200, <Object>) is pretty-printed", async () => {
	const fn = () => ({ woot: "yes" });

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toEqual(`{\n  "woot": "yes"\n}`);
});

test("sendError shows stack in development without statusCode", async () => {
	const fn = () => {
		throw new Error("Custom");
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.message.indexOf("at fn (") !== -1).toBeTruthy();
	}
});

test("sendError shows stack in development with statusCode", async () => {
	const fn = () => {
		const err = new Error("Custom");
		throw err;
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.message.indexOf("at fn (") !== -1).toBeTruthy();
	}
});
