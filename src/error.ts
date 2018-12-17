export default (message, errorCode) => {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
};

export class HttpError extends Error {
	constructor(public statusCode: boolean, public message: string, public originalError: Error) {
		super();
		// TODO: originalError is not needed probably because HttpError is now inherited Error
	}
}
