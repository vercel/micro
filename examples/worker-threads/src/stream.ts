import { IncomingMessage, ServerResponse } from "http";

function getNumber() {
	return new Promise((resolve) => {
		setTimeout(() => {
			const x = Math.round(Math.random() * 100);

			resolve(x);
		}, 300);
	});
}

export default async function wrkStream(_req: IncomingMessage, res: ServerResponse) {
	res.writeHead(200, {
		'X-Custom-Header': "I'm a header"
	});

	for (let i = 0; i < 30; i++) {
		const x = await getNumber();
		res.write(`${x}\n`);
	}
	res.end();
}
