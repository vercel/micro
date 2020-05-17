const {serve} = require('micri');
const parse = require('urlencoded-body-parser');

serve(async req => {
	const data = await parse(req);
	console.log(data);

	return 'Data logged to your console';
}).listen(3000);
