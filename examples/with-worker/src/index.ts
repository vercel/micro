import path from 'path'
import { parse } from 'url';
import micri, {
	IncomingMessage,
	ServerResponse,
	MicriHandler,
	Router,
	send,
	withWorker
} from 'micri';
import prime  from './prime';

const { router, on, otherwise } = Router;

const parsePath = (req: IncomingMessage): string => parse(req.url || '/').path || '/';
const withCustomOpts = (hndl: MicriHandler): MicriHandler =>
	(req: IncomingMessage, res: ServerResponse) =>
		hndl(req, res, { optX: 'Hello world!' });

micri(router(
	on.get((req: IncomingMessage) => parsePath(req) === '/main', prime),
	on.get((req: IncomingMessage) => parsePath(req) === '/worker', withWorker(path.join(__dirname, './prime.js'))),
	on.get((req: IncomingMessage) => parsePath(req) === '/stream', withWorker(path.join(__dirname, './stream.js'))),
	on.get((req: IncomingMessage) => parsePath(req) === '/opts', withCustomOpts(withWorker(path.join(__dirname, './opts.js')))),
	otherwise((_req: IncomingMessage, res: ServerResponse) => send(res, 400, 'Method Not Accepted'))))
	.listen(3000);
