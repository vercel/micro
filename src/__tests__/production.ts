// Packages
import request from "request-promise";
import listen from "test-listen";

process.env.NODE_ENV = 'production';
import { micro, HttpHandler } from "..";

const getUrl = (fn: HttpHandler) => listen(micro(fn));

test('errors are printed in console in production', async () => {
	let logged = false;
	const _error = console.error;
	console.error = () => {
		logged = true;
	};

	const fn = () => {
		throw new Error('Bang');
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		expect(logged).toBeTruthy();
		expect(err.statusCode).toBe(500);
		console.error = _error;
	}
});
