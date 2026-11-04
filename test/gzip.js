// Native
const http = require('http');
const zlib = require('zlib');

// Packages
const test = require('ava');
const listen = require('test-listen');
const micro = require('../packages/micro/lib');

const {buffer, json, text} = micro;

const payload = JSON.stringify({
	name: 'my-app',
	files: Array.from({length: 100}, (_, i) => ({file: `src/file-${i}.js`, sha: 'a'.repeat(40)}))
});

const bom = Buffer.from([0xef, 0xbb, 0xbf]);
const corruptGzip = Buffer.concat([Buffer.from([0x1f, 0x8b]), Buffer.from(payload)]);

const getUrl = fn => {
	const srv = new http.Server(micro(fn));
	return listen(srv);
};

const post = (url, body, headers = {}) => new Promise((resolve, reject) => {
	const req = http.request(url, {
		method: 'POST',
		headers: Object.assign({'content-length': String(body.length)}, headers)
	}, res => {
		const chunks = [];
		res.on('data', chunk => chunks.push(chunk));
		res.on('end', () => resolve({status: res.statusCode, body: Buffer.concat(chunks).toString()}));
	});
	req.on('error', reject);
	req.end(body);
});

const readText = req => text(req, {limit: '64kb'});

test('json() decodes a gzip body', async t => {
	const url = await getUrl(req => json(req));
	const res = await post(url, zlib.gzipSync(payload), {
		'content-type': 'application/json',
		'content-encoding': 'gzip'
	});

	t.is(res.status, 200);
	t.deepEqual(JSON.parse(res.body), JSON.parse(payload));
});

test('content-encoding is matched case-insensitively and trimmed', async t => {
	const url = await getUrl(readText);

	t.is((await post(url, zlib.gzipSync(payload), {'content-encoding': 'GZIP'})).body, payload);
	t.is((await post(url, zlib.gzipSync(payload), {'content-encoding': ' x-gzip '})).body, payload);
});

const parity = [
	['no charset', 'application/json', Buffer.from(payload)],
	['charset=utf-8 and a BOM', 'application/json; charset=utf-8', Buffer.concat([bom, Buffer.from(payload)])],
	['no charset and a BOM', 'application/json', Buffer.concat([bom, Buffer.from(payload)])],
	['charset=utf-16le', 'application/json; charset=utf-16le', Buffer.from(payload, 'utf16le')],
	['an unsupported charset', 'text/plain; charset=nope', Buffer.from(payload)]
];

for (const [name, contentType, body] of parity) {
	test(`a gzip body with ${name} reads like the uncompressed body`, async t => {
		const url = await getUrl(readText);
		const plain = await post(url, body, {'content-type': contentType});
		const gzipped = await post(url, zlib.gzipSync(body), {
			'content-type': contentType,
			'content-encoding': 'gzip'
		});

		t.deepEqual(gzipped, plain);
	});
}

test('other content encodings are left untouched', async t => {
	const url = await getUrl(async req => (await buffer(req)).toString('hex'));
	const gzipped = zlib.gzipSync(payload);

	for (const encoding of ['identity', 'br', 'deflate', 'gzip, zstd', 'utf-8']) {
		const res = await post(url, gzipped, {'content-encoding': encoding});
		t.is(res.body, gzipped.toString('hex'));
	}
});

test('a plain body labelled gzip is read like before', async t => {
	const url = await getUrl(readText);

	t.is((await post(url, Buffer.from(payload), {'content-encoding': 'gzip'})).body, payload);
	t.is((await post(url, Buffer.alloc(0), {'content-encoding': 'gzip'})).body, '');
});

test('the limit applies to the decoded body', async t => {
	const url = await getUrl(readText);
	const res = await post(url, zlib.gzipSync(Buffer.alloc(1024 * 1024)), {'content-encoding': 'gzip'});

	t.is(res.status, 413);
});

test('the limit applies to the compressed body', async t => {
	const url = await getUrl(readText);
	const emptyMember = zlib.gzipSync(Buffer.alloc(0));
	const body = Buffer.concat(Array.from({length: 5000}, () => emptyMember));
	const res = await post(url, body, {'content-encoding': 'gzip'});

	t.is(res.status, 413);
});

for (const [name, contentType] of [['no charset', 'application/json'], ['an unsupported charset', 'text/plain; charset=nope']]) {
	test(`a gzip body that fails to decode with ${name} returns 400 and the server keeps serving`, async t => {
		const url = await getUrl(readText);
		const res = await post(url, corruptGzip, {'content-type': contentType, 'content-encoding': 'gzip'});
		await new Promise(resolve => setTimeout(resolve, 50));
		const next = await post(url, zlib.gzipSync(payload), {'content-encoding': 'gzip'});

		t.is(res.status, 400);
		t.is(next.body, payload);
	});
}

test('a decoded body is cached for repeated reads', async t => {
	const url = await getUrl(async req => {
		await json(req);
		return json(req);
	});
	const res = await post(url, zlib.gzipSync(payload), {
		'content-type': 'application/json',
		'content-encoding': 'gzip'
	});

	t.deepEqual(JSON.parse(res.body), JSON.parse(payload));
});
