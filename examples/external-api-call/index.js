const fetch = require('@turist/fetch').default();
const { serve } = require('micri');

serve(async () => {
	const response = await fetch('https://api.example.com');
	const json = await response.json();

	return json;
}).listen(3000);
