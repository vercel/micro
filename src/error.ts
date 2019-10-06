export default function logError(message: string, errorCode: string) {
	console.error(`micri: ${message}`);
	console.error(`micri: https://github.com/OlliV/micri/blob/master/errors/${errorCode}.md`);
}
