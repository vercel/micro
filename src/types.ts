// Native
import { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http';

export type MicriHandler = (req: IncomingMessage, res: ServerResponse) => any;
export { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server };
export interface IncomingOpts {
	limit?: string | number;
	encoding?: string | null;
}
