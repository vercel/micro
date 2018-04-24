// Packages
const test = require('ava');

// Utilities
const generateHelp = require('../lib/help');

test('generate help', t => {
	t.snapshot(generateHelp());
});
