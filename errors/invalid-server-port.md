# Invalid Server Port

#### Why This Error Occurred

When the `micri` command was ran, you supplied the port flag although it is
not a valid number.


#### Possible Ways to Fix It

The port must be a valid number between 1 and 65535. Although, remember some are
reserved to the operating system and others not in userland (only accessible
with administrator access).
