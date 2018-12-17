module.exports = function (message, errorCode) {
    console.error("micro: " + message);
    console.error("micro: https://err.sh/micro/" + errorCode);
};
