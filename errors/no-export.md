# No Export

#### Why This Error Occurred

When `micri` tried to ran your microservice, it noticed that your code
didn't export anything that could be run.

#### Possible Ways to Fix It

You need to ensure that the entry file you passed to the `micri` command
contains an export - like this one:

```js
module.exports = (req, res) => {
  res.end('test')
}
```

### Useful Links

- [Usage information](https://github.com/zeit/micri#usage)
