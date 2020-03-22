// Native
import { METHODS } from 'http';

// Utilities
import { MicriHandler, IncomingMessage, ServerResponse } from './types';

type Predicate<OptsType> = (req: IncomingMessage, res: ServerResponse, opts?: OptsType) => boolean;
type OnFunction<OptsType> = (
	pred: Predicate<OptsType>,
	hndl: MicriHandler<OptsType>
) => [Predicate<OptsType>, MicriHandler<OptsType>];

const router = <OptsType = any>(...rest: [Predicate<OptsType>, MicriHandler<OptsType>][]): MicriHandler<OptsType> => (
	req: IncomingMessage,
	res: ServerResponse,
	opts?: OptsType
): any =>
	(rest.find((route) => route[0](req, res, opts)) || [
		null,
		(): void => {
			throw Error('No matching route was found');
		},
	])[1](req, res, opts);

const onInit: { [index: string]: OnFunction<any> } = {};
const on = METHODS.map((method) => [
	method.toLowerCase(),
	(pred: Predicate<any>, fn: MicriHandler<any>): [Predicate<any>, MicriHandler<any>] => [
		(req, res, opts): boolean => req.method === method && pred(req, res, opts),
		fn,
	],
]).reduce((acc: { [index: string]: OnFunction<any> }, curr: any) => ({ ...acc, ...{ [curr[0]]: curr[1] } }), onInit);
const otherwise = <OptsType = any>(fn: MicriHandler<OptsType>): [Predicate<OptsType>, MicriHandler<OptsType>] => [
	(): boolean => true,
	fn,
];

function everyPredicate<OptsType = any>(...t: Predicate<OptsType>[]): Predicate<OptsType> {
	return (req: IncomingMessage, res: ServerResponse, opts?: OptsType): boolean =>
		t.every((f): boolean => f(req, res, opts));
}

export { Predicate, router, on, otherwise, everyPredicate };
