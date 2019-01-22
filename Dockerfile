FROM mhart/alpine-node:10
WORKDIR /src
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn test --detectOpenHandles
