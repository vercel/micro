/// <reference types="node" />
/// <reference types="node" />
import type { IncomingMessage, ServerResponse, RequestListener } from 'http';
export declare type RequestHandler = (req: IncomingMessage, res: ServerResponse) => unknown;
declare type Serve = (fn: RequestHandler) => RequestListener;
export declare const serve: Serve;
export declare class HttpError extends Error {
    constructor(message: string);
    statusCode?: number;
    originalError?: Error;
}
export declare const createError: (code: number, message: string, original: Error) => HttpError;
export declare const send: (res: ServerResponse, code: number, obj?: unknown) => void;
export declare const sendError: (req: IncomingMessage, res: ServerResponse, errorObj: Error | HttpError) => void;
export declare const run: (req: IncomingMessage, res: ServerResponse, fn: RequestHandler) => Promise<void>;
export interface BufferInfo {
    limit?: string | number | undefined;
    encoding?: BufferEncoding;
}
export declare const buffer: (req: IncomingMessage, { limit, encoding }?: BufferInfo) => Promise<Buffer>;
export declare const text: (req: IncomingMessage, { limit, encoding }?: BufferInfo) => Promise<string>;
export declare const json: (req: IncomingMessage, opts?: BufferInfo) => Promise<unknown>;
export {};
//# sourceMappingURL=index.d.ts.map