adal-node
=========

This example shows how you can integrate `micri` with Microsoft Azure AD
authentication using `adal-node`.

In this example the application and AD configuration is located in
`src/config.ts`. In a production deployment you might want to consider some
other way of storing the configuration.

See Microsoft's [Node.js example](https://github.com/microsoftgraph/nodejs-security-sample/)
for how to setup a new application  in Microsoft Azure AD. In brief it needs to
be a Web API application with at least a *Redirect URI* to `/auth`$, an
*API Permission* to do `User.read`, and finally you'll need an API secret.

This example enforces and verifies authentication on all URLs. To make things
faster and more flexible, it uses [JWT](https://jwt.io/) to verify that the
user is authenticated. The JWT token is stored in a cookie (`Secure`,
`HTTPOnly`, `SameSite`).

| Path      | Description                                   |
|-----------|-----------------------------------------------|
| `/`       | The front page that says hello to the user.   |
| `/auth`   | Authentication starts from here.              |
| `/token`  | This endpoint refreshes the authentication.   |
