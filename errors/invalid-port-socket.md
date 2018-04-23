# Port and socket provided

#### Why This Error Occurred

When the `micro` command was ran, you passed both a port and a socket. Node.js can only listen to either a port or a socket, not both.

#### Possible Ways to Fix It

Only provide one of the arguments. If both are needed you can start 2 instances of micro with different arguments.
