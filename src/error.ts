export function logError(message: string, errorCode: string): void {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
}

export interface HttpError extends Error {
	statusCode?: number;
	originalError?: Error;
}

export function createError(
	statusCode: number,
	message: string,
	originalError: Error
): HttpError {
	const err: HttpError = new Error(message);
	err.statusCode = statusCode;
	err.originalError = originalError;

	return err;
}
