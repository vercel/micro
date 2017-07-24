module.exports = (message, errorCode) => {
  console.log(`micro: ${message}`)

  if (errorCode) {
    console.log(`micro: https://err.sh/micro/${errorCode}`)
  }
}
