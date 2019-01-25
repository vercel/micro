
# Parse JSON body example

## How to use

Download the example [or clone the repo](https://github.com/zeit/micro):

```bash
curl https://codeload.github.com/zeit/micro/tar.gz/master | tar -xz --strip=2 micro-master/examples/urlencoded-body-parsing
cd urlencoded-body-parsing
```

Install it and run:

```bash
npm install
npm run start
```

Test it:

```bash
curl --request GET \
  --url http://localhost:3000/ \
  --data 'name=micro&type=awesome'

# Expected curl result:
# Data logged to your console

# Log result:
# { name: 'micro', type: 'awesome' }
```

Deploy it to the cloud with [now](https://zeit.co/now) ([download](https://zeit.co/download))

```bash
now
```

## The idea behind the example

Shows how to get urlencoded (html form post) data posted to your microservice using async/await.
