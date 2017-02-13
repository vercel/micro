// Packages
const read = require('fs').readFileSync
const rewriteAsync = require('rewrite-async')
const rewriteModule = require('rewrite-module')

module.exports = ({file, data}) => {
  data = rewriteAsync(data || read(file, 'utf8'))
  return rewriteModule({file, data})
}
