const {json} = require('micro');

module.exports = async function (req, res) {
	const data = await json(req);
	console.log(data);

	return 'Data logged to your console';
};
