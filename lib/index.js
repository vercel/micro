// Native
var server = require('http').Server;
var Stream = require('stream').Stream;
// Packages
var contentType = require('content-type');
var getRawBody = require('raw-body');
var readable = require('is-stream').readable;
var NODE_ENV = process.env.NODE_ENV;
var DEV = NODE_ENV === 'development';
var serve = function (fn) { return server(function (req, res) { return exports.run(req, res, fn); }); };
module.exports = serve;
exports = serve;
exports["default"] = serve;
var createError = function (code, message, original) {
    var err = new Error(message);
    err.statusCode = code;
    err.originalError = original;
    return err;
};
var send = function (res, code, obj) {
    if (obj === void 0) { obj = null; }
    res.statusCode = code;
    if (obj === null) {
        res.end();
        return;
    }
    if (Buffer.isBuffer(obj)) {
        if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        res.setHeader('Content-Length', obj.length);
        res.end(obj);
        return;
    }
    if (obj instanceof Stream || readable(obj)) {
        if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        obj.pipe(res);
        return;
    }
    var str = obj;
    if (typeof obj === 'object' || typeof obj === 'number') {
        // We stringify before setting the header
        // in case `JSON.stringify` throws and a
        // 500 has to be sent instead
        // the `JSON.stringify` call is split into
        // two cases as `JSON.stringify` is optimized
        // in V8 if called with only one argument
        if (DEV) {
            str = JSON.stringify(obj, null, 2);
        }
        else {
            str = JSON.stringify(obj);
        }
        if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
    }
    res.setHeader('Content-Length', Buffer.byteLength(str));
    res.end(str);
};
var sendError = function (req, res, errorObj) {
    var statusCode = errorObj.statusCode || errorObj.status;
    var message = statusCode ? errorObj.message : 'Internal Server Error';
    send(res, statusCode || 500, DEV ? errorObj.stack : message);
    if (errorObj instanceof Error) {
        console.error(errorObj.stack);
    }
    else {
        console.warn('thrown error must be an instance Error');
    }
};
exports.send = send;
exports.sendError = sendError;
exports.createError = createError;
exports.run = function (req, res, fn) {
    return new Promise(function (resolve) { return resolve(fn(req, res)); })
        .then(function (val) {
        if (val === null) {
            send(res, 204, null);
            return;
        }
        // Send value if it is not undefined, otherwise assume res.end
        // will be called later
        // eslint-disable-next-line no-undefined
        if (val !== undefined) {
            send(res, res.statusCode || 200, val);
        }
    })["catch"](function (err) { return sendError(req, res, err); });
};
// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
var rawBodyMap = new WeakMap();
var parseJSON = function (str) {
    try {
        return JSON.parse(str);
    }
    catch (err) {
        throw createError(400, 'Invalid JSON', err);
    }
};
exports.buffer = function (req, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.limit, limit = _c === void 0 ? '1mb' : _c, encoding = _b.encoding;
    return Promise.resolve().then(function () {
        var type = req.headers['content-type'] || 'text/plain';
        var length = req.headers['content-length'];
        // eslint-disable-next-line no-undefined
        if (encoding === undefined) {
            encoding = contentType.parse(type).parameters.charset;
        }
        var body = rawBodyMap.get(req);
        if (body) {
            return body;
        }
        return getRawBody(req, { limit: limit, length: length, encoding: encoding })
            .then(function (buf) {
            rawBodyMap.set(req, buf);
            return buf;
        })["catch"](function (err) {
            if (err.type === 'entity.too.large') {
                throw createError(413, "Body exceeded " + limit + " limit", err);
            }
            else {
                throw createError(400, 'Invalid body', err);
            }
        });
    });
};
exports.text = function (req, _a) {
    var _b = _a === void 0 ? {} : _a, limit = _b.limit, encoding = _b.encoding;
    return exports.buffer(req, { limit: limit, encoding: encoding }).then(function (body) { return body.toString(encoding); });
};
exports.json = function (req, opts) {
    return exports.text(req, opts).then(function (body) { return parseJSON(body); });
};
