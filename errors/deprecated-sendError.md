# 'sendError' is deprecated.

#### Why This Error Occurred

We are deprecating `sendError` function.

#### Possible Ways to Fix It

Basically, you have to use `res` to create the erroneous http response and return the result. Consider the following example to understand the error handling in `micro`:

```js
const { res } = require('micro');

module.exports = req => {
	if (req.method == 'GET') {
		return res('True', 200);
	} else {
		return res('False', 400);
	}
};
```

> Note that if your code throws an exception, `micro` will response with 500 and a default message "Internal Server Error".

You can also simply write an error handling filter and throw exceptions in your code:

```js
const { res } = require('micro');

const handleErrors = (fn) => (req) => {
	try {
		return await fn(req);
	} catch(err) {
		if (err.type === 42) {
			return res(err.message, 400);
		}
	}
};

module.exports = handleErrors((req) => {
	if (req.method == 'GET') {
		return res('True', 200);
	} else {
		const err = new Error('An error occured.');
		err.type = 42;
		throw err;
	}
});
```
