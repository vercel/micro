// Native
import { METHODS } from 'http';

// Utilities
import { MicriHandler, IncomingMessage, ServerResponse } from './types';

type Predicate = (req: IncomingMessage, res: ServerResponse, opts?: object) => boolean;

const router = (...rest: [Predicate, MicriHandler][]): MicriHandler => (
	req: IncomingMessage,
	res: ServerResponse,
	opts?: object
): any =>
	(rest.find(route => route[0](req, res, opts)) || [
		null,
		() => {
			throw Error('No matching route was found');
		}
	])[1](req, res, opts);

const on = METHODS.map(method => [
	method.toLowerCase(),
	(pred: Predicate, fn: MicriHandler): [Predicate, MicriHandler] => [
		(req, res, opts) => req.method === method && pred(req, res, opts),
		fn
	]
]).reduce((acc: any, curr: any) => ({ ...acc, ...{ [curr[0]]: curr[1] } }), {});
const otherwise = (fn: MicriHandler): [Predicate, MicriHandler] => [() => true, fn];

export { Predicate, router, on, otherwise };
