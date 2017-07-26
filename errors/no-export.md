# No Export

#### Why This Error Occurred

When `micro` tried to ran your microservice, it noticed that your code didn't export anything that could be run.

#### Possible Ways to Fix It

You need to ensure that the entry file you passed to the `micro` command contains an export - like this one:

```js
module.exports = (req, res) => {
  res.end('test')
}
```

### Useful Links

- [List of examples](https://github.com/zeit/micro/tree/master/examples)
- [Usage information](https://github.com/zeit/micro#usage)
