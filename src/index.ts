import { Server } from "http";

import { HttpHandler, run, send, serve, sendError } from "./micro";
import { buffer, json, text } from "./helpers";
export { res, Body, HttpRequest, HttpResponse } from "./http-message";
import { createError } from "./error";

export { HttpHandler };

export interface Micro {
	(fn: HttpHandler): Server;
	send: typeof send;
	sendError: typeof sendError;
	createError: typeof createError;
	run: typeof run;
	buffer: typeof buffer;
	text: typeof text;
	json: typeof json;
}

const micro: any = serve;
micro.send = send;
micro.sendError = sendError;
micro.createError = createError;
micro.run = run;
micro.buffer = buffer;
micro.text = text;
micro.json = json;

export default micro as Micro;
