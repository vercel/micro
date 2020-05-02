export const clientId = '12345678-1234-1234-1234-1234567890ab';
export const clientSecret = 'verysecret';
export const authorityHostUrl = 'https://login.windows.net';
export const tenant = '12345678-1234-1234-1234-1234567890ab';
export const authorityUrl = authorityHostUrl + '/' + tenant;
export const redirectUri = 'http://localhost:3000/token';
export const resource = 'https://graph.microsoft.com';
export const authCookieName = 'access_token';
export const jwtSecret = 'secret'; // Should be more secure than this IRL
export const useSecureCookies = process.env.NODE_ENV === 'production';
