# GraphQL Request example

## How to use

Download the example [or clone the repo](https://github.com/zeit/micro):

```bash
curl https://codeload.github.com/zeit/micro/tar.gz/master | tar -xz --strip=2 micro-master/examples/with-graphql-request
cd with-graphql-request
```

Install it and run:

```bash
$ yarn install # (or `$ npm install`)
$ yarn run start # (or `$ npm run start`)
```

Test it:
```bash
curl --request GET \
  --url http://localhost:3000/

# Expected curl result:
# {"releaseDate":"2010-08-28T20:00:00.000Z","actors":[{"name":"Leonardo DiCaprio"},{"name":"Ellen Page"},{"name":"Tom Hardy"},{"name":"Joseph Gordon-Levitt"},{"name":"Marion Cotillard"}]}
```

Deploy it to the cloud with [now](https://zeit.co/now) ([download](https://zeit.co/download))

```bash
$ now
```

## The idea behind the example

Shows how to get data from a GraphQL endpoint using [GraphQL Request](https://github.com/graphcool/graphql-request).
This example relies on [graph.cool](https://www.graph.cool) for its GraphQL backend.
