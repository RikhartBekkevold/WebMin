module.exports = function minify(css, userConfig) {
  var config = require("./src/config.js")
  Object.assign(config, userConfig)

  const compile = require('./src/index.js')
  return compile(css, config)
}
