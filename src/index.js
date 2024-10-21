const parse    = require('./parser/index.js')
const optimize = require('./optimizer/optimize.js')
const print    = require('./codegen/codeGenerator.js')

module.exports = function compile(css, config) {
  const ast  = parse(css, config)
  const opti = optimize(ast, config)
  const min  = print(opti.ast, config)

  return {
    css: min,
    map: opti.map
  }
}
