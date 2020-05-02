import {ParsedUrlQuery} from 'querystring';
import Cookies from 'cookies';

export interface Opts {
	path: string;
	query: ParsedUrlQuery;
	cookies: Cookies;
	user?: {
		name: string;
		tenantId: string;
		accessToken: string;
	}
}
