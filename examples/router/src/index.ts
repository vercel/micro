import { parse } from 'url';
import micri, {
	MicriHandler,
	IncomingMessage,
	ServerResponse,
	Router,
	send,
	text
} from 'micri';

const { router, on, otherwise } = Router;

const parsePath = (req: IncomingMessage): string => parse(req.url || '/').path || '/';
const auth = (accept: MicriHandler) => (req: IncomingMessage, res: ServerResponse, opts?: object) =>
	req.headers.authorization === 'Bearer xyz' ? accept(req, res, { ...(opts || {}), user: 'hbp' }) : send(res, 403, 'Forbidden');

micri(auth(router(
	on.get((req: IncomingMessage) => parsePath(req) === '/pepe', (_req: IncomingMessage, _res: ServerResponse, {user}: {user?: string} = { user: 'Unknown'}) => `Hello ${user}`),
	on.post((req: IncomingMessage) => parsePath(req) === '/pepe', (req: IncomingMessage) => text(req)),
	otherwise((_req: IncomingMessage, res: ServerResponse) => send(res, 400, 'Method Not Accepted')))))
	.listen(3000);
