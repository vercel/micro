// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */
export function logError(message: string, errorCode: string) {
  console.error(`micro: ${message}`);
  console.error(`micro: https://err.sh/micro/${errorCode}`);
}
