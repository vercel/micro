import { IncomingMessage, Router } from '../src';

const { router, on, otherwise } = Router;

class Message extends IncomingMessage {
	method: string;
	url: string;


	constructor(method: string, url: string) {
		// @ts-ignore We don't need to care
		super(null);

		this.method = method;
		this.url = url;
	}
}

test('predicate is called and truthy return value selects the route', () => {
	const msg = new Message('GET', '/');
	const opts = {};
	const predicate = jest.fn(() => true);
	const getHandler = jest.fn(() => 'hello');
	const r = router(on.get(predicate, getHandler));

	// @ts-ignore the other args are not consumed
	const body = r(msg, null, opts);

	expect(predicate).toHaveBeenCalledWith(msg, null, opts);
	expect(getHandler).toHaveBeenCalledWith(msg, null, opts);
	expect(getHandler).toHaveBeenCalledTimes(1);
	expect(body).toBe('hello');
});

test('predicate is called and falsy return value skips the route', () => {
	const msg = new Message('GET', '/');
	const opts = {};
	const predicate = jest.fn(() => false);
	const getHandler = jest.fn(() => 'hello');
	const otherwiseHandler = jest.fn(() => 'hi');
	const r = router(
		on.get(predicate, getHandler),
		otherwise(otherwiseHandler));

	// @ts-ignore the other args are not consumed
	const body = r(msg, null, opts);

	expect(predicate).toHaveBeenCalledWith(msg, null, opts);
	expect(getHandler).toHaveBeenCalledTimes(0);
	expect(otherwiseHandler).toHaveBeenCalledWith(msg, null, opts);
	expect(otherwiseHandler).toHaveBeenCalledTimes(1);
	expect(body).toBe('hi');
});

test('throws if nothing matches', () => {
	const msg = new Message('GET', '/');
	const opts = {};
	const predicate1 = jest.fn(() => false);
	const predicate2 = jest.fn((req: IncomingMessage) => req.url === '/lol');
	const getHandler = jest.fn(() => 'hello');
	const r = router(
		on.get(predicate1, getHandler),
		on.get(predicate2, getHandler));

	// @ts-ignore the other args are not consumed
	expect(() => r(msg, null, opts)).toThrow();
});
