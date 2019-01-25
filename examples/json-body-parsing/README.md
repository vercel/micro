
# Parse JSON body example

## How to use

Download the example [or clone the repo](https://github.com/zeit/micro):

```bash
curl https://codeload.github.com/zeit/micro/tar.gz/master | tar -xz --strip=2 micro-master/examples/json-body-parsing
cd json-body-parsing
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
  --data '{"userId":1,"id":1,"title":"delectus aut autem","completed":false}'

# Expected curl result:
# Data logged to your console

# Log result:
# { userId: 1,
#   id: 1,
#   title: 'delectus aut autem',
#   completed: false }
```

Deploy it to the cloud with [now](https://zeit.co/now) ([download](https://zeit.co/download))

```bash
now
```

## The idea behind the example

Shows how to get data posted to your microservice using async/await.
