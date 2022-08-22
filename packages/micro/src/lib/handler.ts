// Utilities
import { logError } from './error';

export const handle = async (file: string) => {
  let mod: unknown;

  try {
    mod = await import(file);

    mod = await (mod as { default: unknown }).default; // use ES6 module's default export
  } catch (err: unknown) {
    if (isErrorObject(err) && err.stack) {
      logError(`Error when importing ${file}: ${err.stack}`, 'invalid-entry');
    }
    process.exit(1);
  }

  if (typeof mod !== 'function') {
    logError(`The file "${file}" does not export a function.`, 'no-export');
    process.exit(1);
  }

  return mod;
};

function isErrorObject(error: unknown): error is Error {
  return (error as Error).stack !== undefined;
}
