const parse = require('urlencoded-body-parser');

module.exports = async req => {
	const data = await parse(req);
	console.log(data);

	return 'Data logged to your console';
};
