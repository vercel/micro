import { Server } from "http";

import { RequestHandler, run, send, serve, sendError, DEV } from "./micro";
import { buffer, json, text } from "./helpers";
import { res, Body, HttpResponse } from "./http-message";
import { createError, logError } from "./error";

type Fn = (...args: any[]) => any;
function deprecate<T extends Fn>(message: string, errorCode: string, fn: T) {
	if (!DEV) {
		return fn;
	}
	return ((...args: any[]) => {
		logError(message, errorCode);
		return fn(...args);
	}) as T;
}

const _send = deprecate(
	"'send' is deprecated. Consider returning response using 'res' function.",
	"deprecated-send",
	send
);
const _sendError = deprecate(
	"'sendError' is deprecated.",
	"deprecated-sendError",
	sendError
);

export interface Micro {
	(fn: RequestHandler): Server;
	send: typeof send;
	sendError: typeof sendError;
	createError: typeof createError;
	run: typeof run;
	buffer: typeof buffer;
	text: typeof text;
	json: typeof json;
	res: typeof res;
}

const micro: any = serve;
micro.send = _send;
micro.sendError = _sendError;
micro.createError = createError;
micro.run = run;
micro.buffer = buffer;
micro.text = text;
micro.json = json;
micro.res = res;

export default micro as Micro;
export {
	RequestHandler,
	run,
	_send as send,
	serve,
	_sendError as sendError,
	buffer,
	json,
	text,
	res,
	Body,
	HttpResponse,
	createError
};
module.exports = serve;
exports = serve;
