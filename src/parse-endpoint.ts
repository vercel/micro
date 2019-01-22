import { URL } from "url";
import { ListenOptions } from "net";

export function parseEndpoint(str: string): ListenOptions {
	const url = new URL(str);

	switch (url.protocol) {
		case "pipe:": {
			// some special handling
			const cutStr = str.replace(/^pipe:/, "");
			if (cutStr.slice(0, 4) !== "\\\\.\\") {
				throw new Error(`Invalid Windows named pipe endpoint: ${str}`);
			}
			return {path: cutStr};
		}
		case "unix:":
			if (!url.pathname) {
				throw new Error(`Invalid UNIX domain socket endpoint: ${str}`);
			}
			return {path: url.pathname};
		case "tcp:":
			url.port = url.port || "3000";
			return {port: parseInt(url.port, 10), host: url.hostname};
		default:
			throw new Error(
				`Unknown --listen endpoint scheme (protocol): ${url.protocol}`
			);
	}
}
