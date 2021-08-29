const parse  = require('./css-parser/index.js')
const transformAST = require('./transform.js')
const generateCode = require('./codeGenerator.js')

module.exports = function compile(css, config) { 
  var ast     =   parse(css, false, config)
  var modAst  =   transformAST(ast, config)
  var code    =   generateCode(modAst, config)
  return code
}
