export function logError(message: string, errorCode: string): void {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
}

export class HttpError extends Error {
	constructor(
		message?: string,
		public readonly originalError?: Error,
		public readonly statusCode: number = 500
	) {
		super(message);
	}
}

export function err(
	message?: string,
	originalError?: Error,
	statusCode?: number
): HttpError {
	return new HttpError(message, originalError, statusCode);
}

// export interface Exception extends Error {
// 	originalError?: Error;
// }

// export function createError(message: string, originalError: Error): Exception {
// 	const err: Exception = new Error(message);
// 	err.originalError = originalError;

// 	return err;
// }
