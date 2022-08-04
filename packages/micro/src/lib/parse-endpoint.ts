export function parseEndpoint(endpoint: string) {
  const url = new URL(endpoint);

  switch (url.protocol) {
    case 'pipe:': {
      // some special handling
      const cutStr = endpoint.replace(/^pipe:/, '');
      if (!cutStr.startsWith('\\\\.\\')) {
        throw new Error(`Invalid Windows named pipe endpoint: ${endpoint}`);
      }
      return [cutStr];
    }
    case 'unix:':
      if (!url.pathname) {
        throw new Error(`Invalid UNIX domain socket endpoint: ${endpoint}`);
      }
      return [url.pathname];
    case 'tcp:':
      url.port = url.port || '3000';
      return [parseInt(url.port, 10).toString(), url.hostname];
    default:
      throw new Error(
        `Unknown --listen endpoint scheme (protocol): ${url.protocol}`,
      );
  }
}
