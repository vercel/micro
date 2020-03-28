import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { buffer } from './body';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	SHARE_ENV,
	Worker,
	isMainThread,
} from 'worker_threads';

export interface WorkerResponseHeader {
	statusCode: number;
	statusMessage?: string;
	headers: {
		[index: string]: string | string[] | undefined;
	};
}

export default function withWorker<OptsType = any>(
	handlerPath: string,
	workerOpts?: {
		eval?: boolean; // eval handlerPath as code
		limit?: string; // limit the body size
	}
) {
	if (!isMainThread) {
		throw new Error('withWorker() can be only used in the main thread');
	}

	const trampoline = workerOpts?.eval
		? `require('${path.join(__dirname, './worker-wrapper')}')(${handlerPath})`
		: `const p=require('${handlerPath}'); require('${path.join(__dirname, './worker-wrapper')}')(p.default || p)`;

	return async (req: IncomingMessage, res: ServerResponse, opts: OptsType) => {
		const body = await buffer(req, { limit: workerOpts?.limit ?? undefined });

		return new Promise((resolve, reject) => {
			const worker = new Worker(trampoline, {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				env: SHARE_ENV,
				eval: true,
				workerData: {
					req: {
						method: req.method,
						url: req.url,
						headers: req.headers,
						// Trailers not supported
					},
					opts,
				},
			});
			let writeFn = (msg: WorkerResponseHeader) => {
				res.writeHead(msg.statusCode, msg.headers);
				if (msg.statusMessage) {
					res.statusMessage = msg.statusMessage;
				}

				// Switch to writing the response body after the headers have
				// been received.
				writeFn = (msg) => {
					res.write(Buffer.from(msg));
				};
			};
			worker.on('message', (chunk: any) => {
				writeFn(chunk);
			});
			worker.on('error', reject);
			worker.on('exit', (code: number) => {
				if (code !== 0) {
					reject(new Error(`Worker stopped with exit code ${code}`));
				} else {
					res.end();
					resolve();
				}
			});
			worker.postMessage(body);
		});
	};
}
