const error = (message: string, errorCode: number) => {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
};

class HttpError extends Error {
	constructor(public statusCode: number, public message: string, public originalError: Error) {
		super();
		// TODO: originalError is not needed probably because HttpError is now inherited from Error
	}
}

error.HttpError = HttpError;

export = error;
