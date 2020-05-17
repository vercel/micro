const {serve, json} = require('micri');

const server = serve(async req => {
	const data = await json(req);
	console.log(data);

	return 'Data logged to your console';
});

server.listen(3000);
