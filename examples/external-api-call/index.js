const fetch = require('node-fetch');

module.exports = async () => {
	const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
	const json = await response.json();

	return json;
};
