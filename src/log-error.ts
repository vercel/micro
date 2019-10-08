export default function logError(message: string, errorCode: string): void {
	console.error(`micri: ${message}`);
	console.error(`micri: https://github.com/OlliV/micri/blob/master/errors/${errorCode}.md`);
}
