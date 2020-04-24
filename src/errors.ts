// Packages
import bytes from 'bytes';
import { RawBodyError } from './types';

export class MicriError extends Error {
	statusCode: number;
	code: string;
	originalError: Error | null;

	constructor(statusCode: number, code: string, message: string, originalError?: Error) {
		super(message);

		this.statusCode = statusCode;
		this.code = code;
		this.originalError = originalError || null;
	}
}

export class MicriBodyError extends MicriError {
	constructor(err: RawBodyError, limit: string | number) {
		let statusCode = 400;
		let code = 'invalid_body';
		let message = 'Invalid body';

		if (err.type === 'entity.too.large') {
			statusCode = 413;
			code = 'request_entity_too_large';
			message = `Body exceeded ${typeof limit === 'string' ? limit : bytes(limit)} limit`;
		}

		super(statusCode, code, message, err);
	}
}
