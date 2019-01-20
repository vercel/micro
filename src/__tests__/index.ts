import request from "request-promise";
import resumer from "resumer";
import listen from "test-listen";
import sleep from "then-sleep";
import { HttpHandler, micro } from "..";
import { HttpError } from "../error";
import { buffer, json, text } from "../helpers";
import { res } from "../http-message";

const getUrl = (fn: HttpHandler) => listen(micro(fn));

test("send(200, <String>)", async () => {
	const fn = async () => res("woot", 200);

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toEqual("woot");
});

test("send(200, <Object>)", async () => {
	const fn = async () => res({ a: "b" }, 200);

	const url = await getUrl(fn);

	const resp = await request(url, {
		json: true
	});

	expect(resp).toEqual({ a: "b" });
});

test("send(200, <Number>)", async () => {
	const fn = async () =>
		// Chosen by fair dice roll. guaranteed to be random.
		res(4, 200);

	const url = await getUrl(fn);
	const resp = await request(url, {
		json: true
	});

	expect(resp).toBe(4);
});

test("send(200, <Buffer>)", async () => {
	const fn = async () => res(Buffer.from("muscle"), 200);

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toBe("muscle");
});

test("send(200, <Stream>)", async () => {
	const fn = async () => res("waterfall", 200);

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toBe("waterfall");
});

test("send(<Number>)", async () => {
	const fn = async () => res(null, 404);

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
	const resp = await request(url);

	expect(resp).toBe("woot");
});

test("return <Promise>", async () => {
	const fn = async () =>
		new Promise(async resolve => {
			await sleep(100);
			resolve("I Promise");
		});

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toBe("I Promise");
});

test("sync return <String>", async () => {
	const fn = () => "argon";

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toBe("argon");
});

test("return empty string", async () => {
	const fn = async () => "";

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toBe("");
});

test("return <Object>", async () => {
	const fn = async () => ({
		a: "b"
	});

	const url = await getUrl(fn);
	const resp = await request(url, {
		json: true
	});

	expect(resp).toEqual({
		a: "b"
	});
});

test("return <Number>", async () => {
	const fn = async () =>
		// Chosen by fair dice roll. guaranteed to be random.
		4;

	const url = await getUrl(fn);
	const resp = await request(url, {
		json: true
	});

	expect(resp).toBe(4);
});

test("return <Buffer>", async () => {
	const fn = async () => Buffer.from("Hammer");

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toEqual("Hammer");
});

test("return <Stream>", async () => {
	const fn = async () =>
		resumer()
			.queue("River")
			.end();

	const url = await getUrl(fn);
	const resp = await request(url);

	expect(resp).toEqual("River");
});

test("return <null>", async () => {
	const fn = async () => null;

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.statusCode).toBe(204);
	expect(resp.body).toEqual("");
});

// test('return <null> calls res.end once', async () => {
// 	const fn = async () => null;

// 	let i = 0;
// 	await micro.run({}, {end: () => i++}, fn);

// 	t.is(i, 1);
// });

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

// TODO: How to write this test?
// test("send(200, <Stream>) with error on same tick", async () => {
// 	const fn = async () => {
// 		const stream = resumer().queue("error-stream");
// 		send(res, 200, stream);

// 		stream.emit("error", new Error("500 from test (expected)"));
// 		stream.end();
// 	};

// 	const url = await getUrl(fn);

// 	try {
// 		await request(url);
// 		t.fail();
// 	} catch (err) {
// 		t.deepEqual(err.statusCode, 500);
// 	}
// });

test("custom error", async () => {
	const fn = () => {
		sleep(50);
		throw new Error("500 from test (expected)");
	};

	const handleErrors = ofn => req => {
		try {
			return ofn(req);
		} catch (err) {
			return res("My custom error!", 200);
		}
	};

	const url = await getUrl(handleErrors(fn));
	const resp = await request(url);

	expect(resp).toEqual("My custom error!");
});

test("custom async error", async () => {
	const fn = async () => {
		sleep(50);
		throw new Error("500 from test (expected)");
	};

	const handleErrors = ofn => async req => {
		try {
			return await ofn(req);
		} catch (err) {
			return res("My custom error!", 200);
		}
	};

	const url = await getUrl(handleErrors(fn));
	const resp = await request(url);

	expect(resp).toEqual("My custom error!");
});

test("json parse error", async () => {
	const fn = async req => {
		const body = await json(req);
		return res(body.woot, 200);
	};

	const url = await getUrl(fn);

	try {
		await request(url, {
			method: "POST",
			body: "{ \"bad json\" }",
			headers: {
				"Content-Type": "application/json"
			}
		});
	} catch (err) {
		expect(err.statusCode).toBe(400);
	}
});

test("json", async () => {
	const fn = async req => {
		const body = await json(req);

		return res({ response: body.some.cool }, 200);
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

	expect(body.response).toEqual("json");
});

test("json limit (below)", async () => {
	const fn = async req => {
		const body = await json(req, {
			limit: 100
		});

		return res({ response: body.some.cool }, 200);
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

	expect(body.response).toEqual("json");
});

test("json limit (over)", async () => {
	const fn = async req => {
		try {
			await json(req, { limit: 3 });
		} catch (err) {
			expect(err.statusCode).toBe(413);
		}

		return res("ok", 200);
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
	const fn = async req => {
		const obj: any = { circular: true };

		obj.obj = obj;
		return res(obj, 200);
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
	const fn = () => res({ a: "b" }, 200);

	const url = await getUrl(fn);
	const obj = await request(url, {
		json: true
	});

	expect(obj.a).toBe("b");
});

test("limit included in error", async () => {
	const fn = async req => {
		let body;

		try {
			body = await json(req, { limit: 3 });
		} catch (err) {
			expect(/exceeded 3 limit/.test(err.message)).toBeTruthy();
		}

		return res({ response: body.some.cool }, 200);
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
		expect(error).toBeInstanceOf(Error);
	}
});

test("support for status fallback in errors", async () => {
	const fn = req => {
		const err: HttpError = new Error("Custom");
		err.status = 403;
		throw err;
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(403);
	}
});

test("support for non-Error errors", async () => {
	const fn = req => {
		const err = "String error";
		throw err;
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(500);
	}
});

test("json from rawBodyMap works", async () => {
	const fn = async req => {
		const bodyOne = await json(req);
		const bodyTwo = await json(req);

		expect(bodyOne).toEqual(bodyTwo);

		return res({ response: bodyOne.some.cool }, 200);
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
	const fn = req => res("woot", undefined);

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });
	expect(resp.body).toBe("woot");
	expect(resp.statusCode).toBe(200);
});

test("returning <undefined> should behave the same as returning <null>", async () => {
	const fn = () => undefined;

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.statusCode).toBe(204);
	expect(resp.body).toEqual("");
});

test("statusCode on response works", async () => {
	const fn = async req => res("woot", 400);

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.statusCode).toBe(400);
	}
});

test("Content-Type header is preserved on string", async () => {
	const fn = async req =>
		res("<blink>woot</blink>", 200, { "Content-Type": "text/html" });

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on stream", async () => {
	const fn = async req =>
		res(
			resumer()
				.queue("River")
				.end(),
			200,
			{ "Content-Type": "text/html" }
		);

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on buffer", async () => {
	const fn = async req => {
		return res(Buffer.from("hello"), 200, { "Content-Type": "text/html" });
	};

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["content-type"]).toBe("text/html");
});

test("Content-Type header is preserved on object", async () => {
	const fn = async req => {
		return res({}, 200, { "Content-Type": "text/html" });
	};

	const url = await getUrl(fn);
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["content-type"]).toBe("text/html");
});

// TODO: this test doesn't make sense anymore
// test('res.end is working', async () => {
// 	const fn = (req, res) => {
// 		setTimeout(() => res.end('woot'), 100);
// 	};

// 	const url = await getUrl(fn);
// 	const resp =  await request(url);

// 	expect(resp).toEqual('woot');
// });

test("json should throw 400 on empty body with no headers", async () => {
	const fn = async req => json(req);

	const url = await getUrl(fn);

	try {
		await request(url);
	} catch (err) {
		expect(err.message).toBe("400 - \"Invalid JSON\"");
		expect(err.statusCode).toBe(400);
	}
});

test("text should throw 400 on invalid encoding", async () => {
	const fn = async req => text(req, { encoding: "lol" });

	const url = await getUrl(fn);

	try {
		await request(url, {
			method: "POST",
			body: "❤️"
		});
	} catch (err) {
		expect(err.message).toBe("400 - \"Invalid encoding\"");
		expect(err.statusCode).toBe(400);
	}
});

test("buffer works", async () => {
	const fn = async req => buffer(req);
	const url = await getUrl(fn);
	expect(await request(url, { body: "❤️" })).toBe("❤️");
});

test("Content-Type header for JSON is set", async () => {
	const url = await getUrl(() => ({}));
	const resp = await request(url, { resolveWithFullResponse: true });

	expect(resp.headers["content-type"]).toBe(
		"application/json; charset=utf-8"
	);
});

test("buffer returns Buffer - utf8", async () => {
	const fn = async req => {
		const resp = await buffer(req);
		expect(resp instanceof Buffer).toBeTruthy();
		return resp;
	};
	const url = await getUrl(fn);

	await request(url, { body: "❤️", headers: { "content-type": "text/plain; charset=utf-8" } });
});
