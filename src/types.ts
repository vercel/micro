// Native
import { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http';

export type MicriHandler<OptsType = any> = (req: IncomingMessage, res: ServerResponse, opts?: OptsType) => any;
export { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server };
export interface IncomingOpts {
	limit?: string | number;
	encoding?: string | null;
}
