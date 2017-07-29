module.exports = (message, errorCode) => {
  console.error(`micro: ${message}`)

  if (errorCode) {
    console.error(`micro: https://err.sh/micro/${errorCode}`)
  }
}
