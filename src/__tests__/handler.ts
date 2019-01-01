import path from "path";

import * as error from "../error";
import { handle } from "../handler";

const processExit = jest.spyOn(process, "exit").mockImplementation(() => {
	throw new Error("");
});
const logErrorSpy = jest.spyOn(error, "logError");

beforeEach(() => {
	logErrorSpy.mockReset();
});

describe("handler", () => {
	test("handle a PromiseInstance", async () => {
		const file = path.resolve("src/fixtures/native-promise-export");
		const result = await handle(file);
		expect(typeof result).toBe("function");
	});

	test("handle an object that holds a PromiseInstance", async () => {
		const file = path.resolve("src/fixtures/babel-promise-export");
		const result = await handle(file);
		expect(typeof result).toBe("function");
	});

	test("process.exit when handling an invalid object", async () => {
		const file = path.resolve("src/fixtures/regular-object");
		try {
			await handle(file);
		} catch {
		} finally {
			expect(logErrorSpy).toBeCalledTimes(1);
			expect(processExit).toBeCalledWith(1);
		}
	});

	test("process.exit when handling and inexisting file", async () => {
		const file = path.resolve("foo/bar");
		try {
			await handle(file);
		} catch {
		} finally {
			expect(logErrorSpy).toBeCalledTimes(1);
			expect(processExit).toBeCalledWith(1);
		}
	});

	test("log and process.exit when node version is below 8", async () => {
		Object.defineProperty(process, "versions", {
			writable: true,
			value: { node: "7.12" }
		});
		const file = path.resolve("src/fixtures/syntax-error");
		try {
			await handle(file);
		} catch {
		} finally {
			expect(logErrorSpy).toBeCalledTimes(2);
			expect(processExit).toBeCalledWith(1);
		}
	});
});
