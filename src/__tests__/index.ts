import request from "request-promise";
import resumer from "resumer";
import listen from "test-listen";
import { sleep } from "./_utils";

import micro, { RequestHandler, res } from "../index";
import { ServerResponse, IncomingMessage } from "http";
import { HttpError } from "../error";
const { send, sendError, buffer, json, text } = micro;

const getUrl = (fn: RequestHandler) => listen(micro(fn));

test("send(<String>, 200)", async () => {
	const fn: RequestHandler = async (req, res) => {
		send(res, 200, "woot");
	};

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toEqual("woot");
});

test("send(<Object>, 200)", async () => {
	const fn: RequestHandler = async (req, res) => {
		send(res, 200, { a: "b" });
	};

	const url = await getUrl(fn);

	const resp = await request(url, {
		json: true
	});

	expect(resp).toEqual({ a: "b" });
});

test("send(<Number>, 200)", async () => {
	const fn: RequestHandler = async (req, res) => {
		// Chosen by fair dice roll. guaranteed to be random.
		send(res, 200, 4);
	};

	const url = await getUrl(fn);
	const resp = await request(url, { json: true });

	expect(resp).toBe(4);
});

test("send(200, <Buffer>)", async () => {
	const fn: RequestHandler = async (req, res) => {
		send(res, 200, Buffer.from("muscle"));
	};

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("muscle");
});

test("send(200, <Stream>)", async () => {
	const fn: RequestHandler = async (req, res) => {
		send(res, 200, "waterfall");
	};

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("waterfall");
});

test("send(<Number>)", async () => {
	const fn: RequestHandler = async (req, res) => {
		send(res, 404);
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(404);
	}
});

test("return <String>", async () => {
	const fn = async () => "woot";

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("woot");
});

test("return <Promise>", async () => {
	const fn = async () =>
		new Promise(async resolve => {
			await sleep(100);
			resolve("I Promise");
		});

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("I Promise");
});

test("sync return <String>", async () => {
	const fn = () => "argon";

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("argon");
});

test("return empty string", async () => {
	const fn = async () => "";

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("");
});

test("return <Object>", async () => {
	const fn = async () => ({
		a: "b"
	});

	const url = await getUrl(fn);
	const res = await request(url, {
		json: true
	});

	expect(res).toEqual({
		a: "b"
	});
});

test("return <Number>", async () => {
	const fn = async () =>
		// Chosen by fair dice roll. guaranteed to be random.
		4;

	const url = await getUrl(fn);
	const res = await request(url, {
		json: true
	});

	expect(res).toBe(4);
});

test("return <Buffer>", async () => {
	const fn = async () => Buffer.from("Hammer");

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("Hammer");
});

test("return <Stream>", async () => {
	const fn = async () =>
		resumer()
			.queue("River")
			.end();

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("River");
});

test("return <null>", async () => {
	const fn = async () => null;

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.statusCode).toBe(204);
	expect(res.body).toBe("");
});

test("return <null> calls res.end once", async () => {
	const fn = async () => null;

	let i = 0;
	await micro.run(
		{} as IncomingMessage,
		{ end: () => i++ } as any, // TODO: Fix type
		fn
	);

	expect(i).toBe(1);
});

test("throw with code", async () => {
	const fn = async () => {
		await sleep(100);
		const err: HttpError = new Error("Error from test (expected)");
		err.statusCode = 402;
		throw err;
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(402);
	}
});

test("throw (500)", async () => {
	const fn = async () => {
		throw new Error("500 from test (expected)");
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
});

test("throw (500) sync", async () => {
	const fn = () => {
		throw new Error("500 from test (expected)");
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
});

test("send(200, <Stream>) with error on same tick", async () => {
	const fn: RequestHandler = async (req, res) => {
		const stream = resumer().queue("error-stream");
		send(res, 200, stream);

		stream.emit("error", new Error("500 from test (expected)"));
		stream.end();
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
	expect.assertions(1);
});

test("custom error", async () => {
	const fn = () => {
		sleep(50);
		throw new Error("500 from test (expected)");
	};

	const handleErrors = (ofn: RequestHandler) => (
		req: IncomingMessage,
		res: ServerResponse
	) => {
		try {
			return ofn(req, res);
		} catch (err) {
			send(res, 200, "My custom error!");
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await request(url);

	expect(res).toBe("My custom error!");
});

test("custom async error", async () => {
	const fn = async () => {
		sleep(50);
		throw new Error("500 from test (expected)");
	};

	const handleErrors = (ofn: RequestHandler) => async (
		req: IncomingMessage,
		res: ServerResponse
	) => {
		try {
			return await ofn(req, res);
		} catch (err) {
			send(res, 200, "My custom error!");
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await request(url);

	expect(res).toBe("My custom error!");
});

test("json parse error", async () => {
	const fn: RequestHandler = async (req, res) => {
		const body = await json(req);
		send(res, 200, body.woot);
	};

	const url = await getUrl(fn);

	try {
		await request(url, {
			method: "POST",
			// tslint:disable-next-line:quotemark
			body: '{ "bad json" }',
			headers: {
				"Content-Type": "application/json"
			}
		});
	} catch (err) {
		expect(err.statusCode).toBe(400);
	}
});

test("json", async () => {
	const fn: RequestHandler = async (req, res) => {
		const body = await json(req);

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);

	const body = await request(url, {
		method: "POST",
		body: {
			some: {
				cool: "json"
			}
		},
		json: true
	});

	expect(body.response).toBe("json");
});

test("json limit (below)", async () => {
	const fn: RequestHandler = async (req, res) => {
		const body = await json(req, {
			limit: 100
		});

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);

	const body = await request(url, {
		method: "POST",
		body: {
			some: {
				cool: "json"
			}
		},
		json: true
	});

	expect(body.response).toBe("json");
});

test("json limit (over)", async () => {
	const fn: RequestHandler = async (req, res) => {
		try {
			await json(req, {
				limit: 3
			});
		} catch (err) {
			expect(err.statusCode).toBe(413);
		}

		send(res, 200, "ok");
	};

	const url = await getUrl(fn);
	await request(url, {
		method: "POST",
		body: {
			some: {
				cool: "json"
			}
		},
		json: true
	});
});

test("json circular", async () => {
	const fn: RequestHandler = async (req, res) => {
		const obj: any = {
			circular: true
		};

		obj.obj = obj;
		send(res, 200, obj);
	};

	const url = await getUrl(fn);

	try {
		await request(url, {
			json: true
		});
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
});

test("no async", async () => {
	const fn: RequestHandler = (req, res) => {
		send(res, 200, {
			a: "b"
		});
	};

	const url = await getUrl(fn);
	const obj = await request(url, {
		json: true
	});

	expect(obj.a).toBe("b");
});

test("limit included in error", async () => {
	const fn: RequestHandler = async (req, res) => {
		let body;

		try {
			body = await json(req, {
				limit: 3
			});
		} catch (err) {
			expect(/exceeded 3 limit/.test(err.message)).toBeTruthy();
		}

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);
	try {
		await request(url, {
			method: "POST",
			body: {
				some: {
					cool: "json"
				}
			},
			json: true
		});
	} catch (error) {
		expect(error).toBeDefined();
	}
	expect.assertions(2);
});

test("support for status fallback in errors", async () => {
	const fn: RequestHandler = (req, res) => {
		const err: HttpError = new Error("Custom");
		err.status = 403;
		sendError(req, res, err);
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(403);
	}
});

test("support for non-Error errors", async () => {
	const fn: RequestHandler = (req, res) => {
		const err = "String error";
		sendError(req, res, err as any); // todo: fix type
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
});

test("json from rawBodyMap works", async () => {
	const fn: RequestHandler = async (req, res) => {
		const bodyOne = await json(req);
		const bodyTwo = await json(req);

		expect(bodyOne).toEqual(bodyTwo);

		send(res, 200, {
			response: bodyOne.some.cool
		});
	};

	const url = await getUrl(fn);
	const body = await request(url, {
		method: "POST",
		body: {
			some: {
				cool: "json"
			}
		},
		json: true
	});

	expect(body.response).toBe("json");
});

test("statusCode defaults to 200", async () => {
	const fn: RequestHandler = (req, res) => {
		// eslint-disable-next-line no-undefined
		res.statusCode = undefined as any;
		return "woot";
	};

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });
	expect(res.body).toBe("woot");
	expect(res.statusCode).toBe(200);
});

test("statusCode on response works", async () => {
	const fn: RequestHandler = async (req, res) => {
		res.statusCode = 400;
		return "woot";
	};

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(400);
	}
});

test("Content-Type header is preserved on string", async () => {
	const fn: RequestHandler = async (req, res) => {
		res.setHeader("Content-Type", "text/html");
		return "<blink>woot</blink>";
	};

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on stream", async () => {
	const fn: RequestHandler = async (req, res) => {
		res.setHeader("Content-Type", "text/html");
		return resumer()
			.queue("River")
			.end();
	};

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on buffer", async () => {
	const fn: RequestHandler = async (req, res) => {
		res.setHeader("Content-Type", "text/html");
		return Buffer.from("hello");
	};

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on object", async () => {
	const fn: RequestHandler = async (req, res) => {
		res.setHeader("Content-Type", "text/html");
		return {};
	};

	const url = await getUrl(fn);
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.headers["content-type"]).toBe("text/html");
});

test("res.end is working", async () => {
	const fn: RequestHandler = (req, res) => {
		setTimeout(() => res.end("woot"), 100);
	};

	const url = await getUrl(fn);
	const res = await request(url);

	expect(res).toBe("woot");
});

test("json should throw 400 on empty body with no headers", async () => {
	const fn: RequestHandler = async (req: IncomingMessage) => json(req);

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		// tslint:disable-next-line:quotemark
		expect(err.message).toBe('400 - "Invalid JSON"');
		expect(err.statusCode).toBe(400);
	}
});

test("text should use request headers to decode request body if no params provided", async () => {
	const fn: RequestHandler = async (req: IncomingMessage) => {
		const body = await text(req);
		expect(body).toBe("❤️");
		return body;
	};
	const url = await getUrl(fn);
	await request(url, {
		method: "POST",
		body: "❤️"
	});
	expect.assertions(1);
});

test("buffer should throw 400 on invalid encoding", async () => {
	const fn = async (req: IncomingMessage) => buffer(req, { encoding: "lol" });

	const url = await getUrl(fn);

	try {
		await request(url, {
			method: "POST",
			body: "❤️"
		});
	} catch (err) {
		// tslint:disable-next-line:quotemark
		expect(err.message).toBe('400 - "Invalid body"');
		expect(err.statusCode).toBe(400);
	}
});

test("buffer works", async () => {
	const fn = async (req: IncomingMessage) => buffer(req);
	const url = await getUrl(fn);
	expect(await request(url, { body: "❤️" })).toBe("❤️");
});

test("Content-Type header for JSON is set", async () => {
	const url = await getUrl(() => ({}));
	const res = await request(url, { resolveWithFullResponse: true });

	expect(res.headers["content-type"]).toBe("application/json; charset=utf-8");
});

test("res should work to create responses", async () => {
	const fn = () =>
		res({ some: "json" }, 201, { "Custom-Header": "Custom-Value" });

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["custom-header"]).toEqual("Custom-Value");
	expect(resp.statusCode).toBe(201);
	expect(JSON.parse(resp.body)).toEqual({ some: "json" });
});

test("res should return by 200 if statusCode is not specified", async () => {
	const fn = () => res({ some: "json" });

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.statusCode).toBe(200);
});

test("res should create empty string for empty header values", async () => {
	const fn = () => res({}, 200, { "test-header": undefined });

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["test-header"]).toBe("");
});

test("res should return immutable response object with some helper functions", async () => {
	const fn = () =>
		res({})
			.setStatus(201)
			.setBody({ some: "json" });

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.statusCode).toBe(201);
	expect(JSON.parse(resp.body)).toEqual({ some: "json" });
});
