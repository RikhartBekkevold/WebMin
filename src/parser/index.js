const Tokenizer   = require('./src/tokenize.js').Tokenizer
const Parser      = require('./src/parser.js').Parser
require('./src/predicates.js')
require('./src/parse.js')
const { isString, defined, isEmpty, mergeConfig } = require('./src/util.js')
var config = require('./config.js')

module.exports = function (input, userConfig) {
  if (!defined(input))  throw new Error("Input not defined")
  if (!isString(input)) throw new Error("Input must be string")
  if (isEmpty(input))   throw new Error("Input file/string is empty")

  Object.assign(config, userConfig)

  const tokenizer =   new Tokenizer(input, config)
  const tokens    =   tokenizer.tokenize()
  const parser    =   new Parser(tokens, config)
  const ast       =   parser.parse()

  return ast
}
