import micri, {
	IncomingMessage,
	ServerResponse,
	Router,
} from 'micri';
import {sendBadRequest, sendThingNotFound} from './errors';

const { router, on, otherwise } = Router;

micri(router(
	on.get(() => true, (req: IncomingMessage, res: ServerResponse) => sendThingNotFound(req, res, req.url || '')),
	otherwise((req: IncomingMessage, res: ServerResponse) => sendBadRequest(req, res))))
	.listen(3000);
