// Native
import { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http';

export type MicriHandler<OptsType = any> = (req: IncomingMessage, res: ServerResponse, opts?: OptsType) => any;
export { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server };
export interface IncomingOpts {
	limit?: string | number;
	encoding?: string | null;
}

// The following type is borrowed from raw-body to avoid depending on the whole
// library twice just for proper typing.
export interface RawBodyError extends Error {
	/**
	 * The limit in bytes.
	 */
	limit?: number;
	/**
	 * The expected length of the stream.
	 */
	length?: number;
	expected?: number;
	/**
	 * The received bytes.
	 */
	received?: number;
	/**
	 * The encoding.
	 */
	encoding?: string;
	/**
	 * The corresponding status code for the error.
	 */
	status: number;
	statusCode: number;
	/**
	 * The error type.
	 */
	type: string;
}
