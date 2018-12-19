const error = (message: string, errorCode: number) => {
	console.error(`micro: ${message}`);
	console.error(`micro: https://err.sh/micro/${errorCode}`);
};

export = error;
