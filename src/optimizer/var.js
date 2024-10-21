const {
  replaceNodeAt,
  removeNodeAt,
  shallowCopy,
  makeMultiKeyMap
} = require('./util.js')


module.exports = class VariableManager {
  constructor() {
    this.customProperties = makeMultiKeyMap()
    this.propertyAtRules  = makeMultiKeyMap()
  }

  addPropertyRule(node, siblings, index) {
    this.propertyAtRules.add(
      node.name.name,
      { node, siblings, index }
    )
  }

  addNormalDeclaration(node, siblings, index) {
    this.customProperties.add(
      node.property,
      { node, siblings, index },
    )
  }

  removeSafeDeclarations() {
    this.propertyAtRules.getAllMulti().forEach((nodes, i) => {
      for (var i = 0; i < nodes.length-1; i++) {
        removeNodeAt(nodes[i].siblings, nodes[i].index-i)
      }
    })

    var array = this.customProperties.getAllSingle()
    for (var i = 0; i < array.length; i++)
      removeNodeAt(array[i].siblings, array[i].index-i)
  }

  hasDeclaration(node) {
    return this.customProperties.exists(node.arguments[0].name)
  }

  resolveSafeRef(node, parent, var_ref_index) {
    var var_ref_name = node.arguments[0].name

    if (this.customProperties.hasMulti(var_ref_name))
      return false

    replaceNodeAt(
      parent.parts,
      var_ref_index,
      shallowCopy(this.customProperties.get(var_ref_name).node.value.parts)
    )

    return true
  }
}
