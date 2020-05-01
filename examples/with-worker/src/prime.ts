export default function fn() {
	const limit = 3e5;
	let r;

	console.log('This is going to take a while...');

	for (let n = 2; n <= limit; n++) {
		let isPrime = true;
		for(let factor = 2; factor < n; factor++) {
			if(n % factor == 0) {
				isPrime = false;
				break;
			}
		}
		if(isPrime) {
			r = n;
		}
	}

	return r;
}
