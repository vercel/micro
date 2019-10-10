const micri = require('micri').default;
const {json} = require('micri');

const server = micri(async req => {
	const data = await json(req);
	console.log(data);

	return 'Data logged to your console';
});

server.listen(3000);
