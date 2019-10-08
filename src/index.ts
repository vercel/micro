#!/usr/bin/env node

// Native
import path from 'path';
import { existsSync } from 'fs';

// Packages
import arg from 'arg';

// Utilities
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package');
import handle from './handler';
import logError from './log-error';
import parseEndpoint from './parse-endpoint';
import usage from './usage';
import { MicriHandler } from './types';
import { serve } from './serve';

export default serve;
export * from './body';
export * from './serve';
export * from './types';
export { MicriError } from './errors';

if (require.main === module) {
	// Check if the user defined any options
	const args = arg({
		'--listen': [parseEndpoint],
		'-l': '--listen',

		'--help': Boolean,

		'--version': Boolean,
		'-v': '--version'
	});
	args['--listen'] = args['--listen'] || [];

	// When `-h` or `--help` are used, print out
	// the usage information
	if (args['--help']) {
		usage();
	}

	// Print out the package's version when
	// `--version` or `-v` are used
	if (args['--version']) {
		console.log(version);
		process.exit();
	}

	if (args['--listen'].length === 0) {
		// default endpoint
		args['--listen'].push([3000]);
	}

	let file = args._[0];

	if (!file) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const packageJson = require(path.resolve(process.cwd(), 'package.json'));
			file = packageJson.main || 'index.js';
		} catch (err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
				logError(`Could not read \`package.json\`: ${err.message}`, 'invalid-package-json');
				process.exit(1);
			}
		}
	}

	if (!file) {
		logError('Please supply a file!', 'path-missing');
		process.exit(1);
	}

	if (file[0] !== '/') {
		file = path.resolve(process.cwd(), file);
	}

	if (!existsSync(file)) {
		logError(`The file or directory "${path.basename(file)}" doesn't exist!`, 'path-not-existent');
		process.exit(1);
	}

	const registerShutdown = (fn: () => void) => {
		let run = false;

		const wrapper = () => {
			if (!run) {
				run = true;
				fn();
			}
		};

		process.on('SIGINT', wrapper);
		process.on('SIGTERM', wrapper);
		process.on('exit', wrapper);
	};

	const startEndpoint = (module: MicriHandler, endpoint: (string | number)[]) => {
		const server = serve(module);

		server.on('error', err => {
			console.error('micri:', err.stack);
			process.exit(1);
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore TODO The typing is pretty weird here
		server.listen(...endpoint, () => {
			const details = server.address();

			registerShutdown(() => {
				server.close();
				process.exit();
			});

			// `micri` is designed to run only in production, so
			// this message is perfectly for prod
			if (typeof details === 'string') {
				console.log(`micri: Accepting connections on ${details}`);
			} else if (details && typeof details === 'object' && details.port) {
				console.log(`micri: Accepting connections on port ${details.port}`);
			} else {
				console.log('micri: Accepting connections');
			}
		});
	};

	const start = async () => {
		const loadedModule = await handle(file);
		const endpoints = args['--listen'] || [];

		for (const endpoint of endpoints) {
			startEndpoint(loadedModule, endpoint);
		}

		registerShutdown(() => console.log('micri: Gracefully shutting down. Please wait...'));
	};

	start();
}
