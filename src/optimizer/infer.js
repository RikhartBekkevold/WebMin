const { traverseTree } = require('../parser/src/traverse.js')
const { createNameGenerator, makeMangledNameMap } = require("./mangle.js")
const VariableManager = require('./var.js') // varMap - table
const visitors = require('./visitors.js')

module.exports = class Inferrer {
  constructor(ast, config) {
    this.ast = ast
    this.config = config
    this.varManager = new VariableManager()

    this.mangledCustomProps = Object.create(null)
    this.getUniqueVariableName = createNameGenerator()

    this.mangledNamespaceMap = Object.create(null)
    this.getUniqueNamespaceName = createNameGenerator()

    this.mangledKeyframesMap = Object.create(null)
    this.getUniqueKeyframeName = createNameGenerator()

    this.visitors = visitors
  }

  infer() {
    traverseTree(this.ast, this.visitors, this)
    // remove after traverse, so deletetion is not a problem
    this.varManager.removeSafeDeclarations()

    return {
      varManager: this.varManager,
      mangledCustomProps: this.mangledCustomProps,
      mangledNamespaceMap: this.mangledNamespaceMap,
      mangledKeyframesMap: this.mangledKeyframesMap
    }
  }
}
