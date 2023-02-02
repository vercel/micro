# External API call example

## How to use

Download the example [or clone the repo](https://github.com/vercel/micro):

```bash
curl https://codeload.github.com/vercel/micro/tar.gz/master | tar -xz --strip=2 micro-master/examples/external-api-call
cd external-api-call
```

Install it and run:

```bash
npm install
npm run start
```

> **Note** `node-fetch` is limited to the v2.x release when using [CommonJS](https://github.com/node-fetch/node-fetch#commonjs), v3.x and above is ESM-only.

## The idea behind the example

Shows how to get data from an external api using async/await.
