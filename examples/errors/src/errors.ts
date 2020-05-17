import { STATUS_CODES } from 'http';
import { send, IncomingMessage, ServerResponse } from 'micri';
import { ErrorObject } from 'ajv';
import { parseAll } from '@hapi/accept';

export interface MyError {
	code: string;
	message: string;
	[x: string]: any;
};

/**
 * Send a standardized error to the HTTP client.
 * @param req is the incoming request.
 * @param res is the outgoing response.
 * @param error is an object describing the error condition.
 */
export function sendError(req: IncomingMessage, res: ServerResponse, statusCode: number, error: MyError) {
	let types = ['*/*'];

	if (!error.code) {
		throw new Error('Error "code" is missing');
	}

	if (!error.message) {
		throw new Error('Error "message" is missing');
	}

	try {
		const parsed = parseAll(req.headers);
		types = parsed.mediaTypes;
	} catch (err) {
		console.error(err);
	}

	if (types.includes('text/html')) {
		return send(res, statusCode, `
<html>
<h2>${STATUS_CODES[statusCode] || 'Internal Server Error'}</h2>
<p>${error.message}</p>
`);
	} else if (types.includes('*/*')) {
		return send(res, statusCode, {
			error
		});
	} else if (types.includes('text/plain')) {
		return send(res, statusCode, error.message)
	} else {
		return send(res, statusCode, {
			error
		});
	}
}

/**
 * Send a thing not found error.
 * @param req is the incoming request.
 * @param res is the outgoing response.
 * @param id is the id of the thing that was not found.
 */
export function sendThingNotFound(req: IncomingMessage, res: ServerResponse, id: string) {
	sendError(req, res, 404, {
		code: 'thing_not_found',
		message: `Thing not found: "${id}"`,
		id
	});
}

/**
 * Send bad request error.
 * @param req is the incoming request.
 * @param res is the outgoing response.
 */
export function sendBadRequest(req: IncomingMessage, res: ServerResponse) {
	sendError(req, res, 400, {
		code: 'bad_request',
		message: 'Invalid request method or path'
	});
}

/**
 * Send an Ajv based error on resource creation.
 * @param type is the resource type being created.
 */
export function sendAjvError(req: IncomingMessage, res: ServerResponse, type: string, errors: ErrorObject[]) {
	sendError(req, res, 400, {
		code: 'configuration_error',
		message: `There is an error in the ${type} configuration`,
		errors: errors.map(e => `"${e.dataPath}" ${e.message}`)
	});
}
