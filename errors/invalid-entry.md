# Invalid Entry File

#### Why This Error Occurred

When the `micro` command was ran, you passed a path to a file or directory that contains invalid code. This code might either not be syntactically correct or throw an error on execution.

#### Possible Ways to Fix It

The only way to avoid this error is to ensure that the entry file to your microservice (the one passed to the `micro`) command contains code that doesn't contain any syntax errors and doesn't throw an error when executed.

### Useful Links

- [JSLint](http://www.jslint.com) - Validate the code of your entry file
