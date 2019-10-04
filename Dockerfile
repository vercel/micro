FROM mhart/alpine-node:9.11.1
WORKDIR /src
COPY package.json ./
RUN yarn
COPY . ./
RUN yarn test
