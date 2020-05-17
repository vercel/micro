Micro app with HTTPS
====================

Shows how to make use of HTTPS requests with micro.

How to Use
----------

Install it and run:

```bash
npm install
npm run start
```

Optionally, create a new self-signed certificate:

```
$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 999999 -nodes
Generating a RSA private key
...+++++
........................................................+++++
writing new private key to 'key.pem'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:
State or Province Name (full name) []:
Locality Name (eg, city) [Default City]:
Organization Name (eg, company) [Default Company Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (eg, your name or your server's hostname) []:
Email Address []:
```
