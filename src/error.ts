export function logError(message: string, errorCode: string): void {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
}

export interface Exception extends Error {
	originalError?: Error;
}

export function createError(message: string, originalError: Error): Exception {
	const err: Exception = new Error(message);
	err.originalError = originalError;

	return err;
}
