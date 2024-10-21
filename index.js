const { defaultConfig, internalParserConfig } = require("./src/config.js")
const compile = require('./src/index.js')

module.exports = function minify(css, userConfig) {
  const config = Object.assign(
    defaultConfig,
    userConfig,
    internalParserConfig
  )
  return compile(css, config)
}
