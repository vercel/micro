# micro

HTTP Microservice tools for Node.JS.

## Features

* **Easy**. Designed for usage with `async` and `await`.
* **Fast**. Ultra high performance (even JSON parsing is opt-in).
* **Micro**. `micro` is just 100 lines of code.
* **Agile**. Super easy deployment and containerization.
* **Simple**. Oriented for single purpose modules (function).
* **Explicit**. No middleware. Modules declare all dependencies.
* **Standard**. Just HTTP :)

## Example

The following example `subscribe.js` will trigger a
subscription to Mailchimp using its API.

```js
import { json, send } from 'micro';
import fetch from 'request-promise';
export default async function(req, res){
  const body = await json(req);
  const resp = await request({
    url: 'http://us2.api.mailchimp.com/1.3/?method=listSubscribe',
    method: 'POST',
    body: {/* … */}
  });
  if (200 !== resp.statusCode) throw new Error('Mailchimp error');
  send(res, 200, { message: 'Subscription complete' });
});
```

To run the microservice, use the `micro` command.

```bash
$ micro -p 3000 subscribe.js
```

then simply go to `http://localhost:3000`

## Documentation

### API

- `micro(fn, { onError = null })`
  When you `import micro`.

### Error handling
### Development mode
### Testing
### Deployment

The `package.json` for the example above:

```json
{
  "name": "my-app-subscribe",
  "dependencies": {
    "micro": "x.y.z"
  },
  "scripts": {
    "start": "micro -p 3000 subscribe.js"
  }
}
```

Then your `Dockerfile` can look like this:

```
FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
EXPOSE 3000
CMD [ "npm", "start" ]
```
