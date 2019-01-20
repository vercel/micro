import stream from "stream";

declare module "resumer" {
	export interface ResumerStream extends stream.Transform {
		autoDestroy: boolean;
		queue(data: any): ResumerStream;
		end(): ResumerStream;
	}

	export default function resumer(
		write?: (data: any) => void,
		end?: () => void,
		opts?: {
			autoDestroy: boolean;
		}
	): ResumerStream;
}
