const fetch = require('node-fetch');

module.exports = async () => {
	const response = await fetch('https://api.example.com');
	const json = await response.json();

	return json;
};
