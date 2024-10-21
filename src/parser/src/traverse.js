function traverseParent(ast, visitors) {
  var visitedSelectorPatterns = []
  var ancestors = []

  traverse(ast, null)
  function traverse(node, parent, idx, arr, parentArr) {
    ancestors.push(node)

    if (visitors && visitors[node.type] && visitors[node.type].enter) {
      var hasRemoved = visitors[node.type].enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors)
      if (hasRemoved === true)
        return ancestors.pop(node), hasRemoved
    }

    if (traversers[node.type])
      var action = traversers[node.type](node, traverse, arr)

    if (visitors && visitors[node.type] && visitors[node.type].exit) {
      var hasRemoved = visitors[node.type].exit(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors)

      if (node.type === "StyleRule" && action && hasRemoved === true)
        return ancestors.pop(node), action + 1
      if (node.type === "StyleRule" && action)
        return ancestors.pop(node), action
      if (hasRemoved === true)
        return ancestors.pop(node), hasRemoved
    }

    if (node.type === "SelectorPattern" && hasRemoved === 2)
      return ancestors.pop(node), true

    ancestors.pop(node)
  }
}


function traverseTree(ast, visitors, caller) {
  traverse(ast, null)

  function traverse(node, parent, idx, arr, parentArr) {
    if (visitors && visitors[node.type] && visitors[node.type].enter)
      visitors[node.type].enter.call(caller, node, parent, idx, arr, parentArr)

    if (traversers[node.type])
      traversers[node.type](node, traverse, arr)
  }
}


var traversers = {
  Stylesheet(node, callback, parentArr) {
    for (var i = 0; i < node.rules.length; i++) {
      let hasRemoved = callback(node.rules[i], node, i, node.rules, parentArr)
      if (hasRemoved === true) i--

      if (typeof hasRemoved === "number")
        i -= hasRemoved
    }
  },

  StyleRule(node, callback, parentArr) {
    for (var i = 0; i < node.selectors.length; i++) {
      let hasRemoved = callback(node.selectors[i], node, i, node.selectors, parentArr)
      if (hasRemoved === true) i--
      if (typeof hasRemoved === "number")
        i -= hasRemoved
    }
    callback(node.rules, node)
  },

  SelectorPattern(node, callback, parArr) {
    for (var i = 0; i < node.selectors.length; i++) {
      var hasRemoved = callback(node.selectors[i], node, i, node.selectors, parArr)
      if (hasRemoved === true) i--
    }
  },

  CharsetRule(node, callback) {
    callback(node.encoding, node)
  },

  NamespaceRule(node, callback) {
    if (node.prefix) callback(node.prefix, node)
    callback(node.url, node)
  },

  ImportRule(node, callback) {
    callback(node.url, node)
    if (node.media)
      for (var i = 0; i < node.media.length; i++){
        var hasRemoved = callback(node.media[i], node, i, node.media)
        if (hasRemoved) i--
      }
  },

  Block(node, callback) {
    for (var i = 0; i < node.declarations.length; i++) {
      var hasRemoved = callback(node.declarations[i], node, i, node.declarations)
      if (hasRemoved) i--
    }
  },

  Declaration(node, callback) {
    callback(node.value, node)
  },

  Value(node, callback) {
    for (var i = 0; i < node.parts.length; i++) {
      var hasRemoved = callback(node.parts[i], node, i, node.parts)
      if (hasRemoved) i--
    }
  },

  MediaQueryList(node, callback) {
    for (var i = 0; i < node.queries.length; i++) {
      let hasRemoved = callback(node.queries[i], node, i, node.queries)
      if (hasRemoved) i--
    }
    for (var j = 0; j < node.selectors.length; j++) {

      let hasRemoved = callback(node.selectors[j], node, j, node.selectors)
      if (hasRemoved) j--
    }
  },

  MediaRule(node, callback) {
    for (var i = 0; i < node.def.length; i++) {
      let hasRemoved = callback(node.def[i], node, i, node.def)
      if (hasRemoved) i--
    }
  },

  MediaFeature(node, callback) {
    callback(node.prop, node)
    callback(node.val, node)
  },

  KeyframesRule(node, callback) {
    for (var i = 0; i < node.arguments.length; i++) {
      let hasRemoved = callback(node.arguments[i], node, i, node.arguments)
      if (hasRemoved) i--
    }
  },

  ComplexSelector(node, callback) {
    for (var i = 0; i < node.selectors.length; i++) {
      var selector = node.selectors[i]
      var hasRemoved = callback(selector, node, i, node.selectors)
      if (hasRemoved) i--
    }
  },

  Function(node, callback) {
    for (var i = 0; i < node.arguments.length; i++) {
      var hasRemoved = callback(node.arguments[i], node, i, node.arguments)
      if (hasRemoved) i--
    }
  },

  AttributeSelector(node, callback) {
    callback(node.name, node)
    if (node.value !== null) callback(node.value, node)
    if (node.flag !== null) callback(node.flag, node)
  },

  CounterStyleRule(node, callback) {
    if (node.name !== null) callback(node.name, node)
    if (node.declarations !== null) callback(node.declarations, node)
  },

  ViewportRule(node, callback) {
    if (node.declarations !== null) callback(node.declarations, node)
  },

  ColorProfileRule(node, callback) {
    if (node.name !== null) callback(node.name, node)
    if (node.rules !== null) callback(node.rules, node)
  },

  PropertyRule(node, callback) {
    if (node.name !== null) callback(node.name, node)
    if (node.rules !== null) callback(node.rules, node)
  },

  FontPaletteValuesRule(node, callback) {
    if (node.name !== null) callback(node.name, node)
    if (node.rules !== null) callback(node.rules, node)
  },

  FontFaceRule(node, callback) {
    if (node.rules !== null) callback(node.rules, node)
  },

  LayerRule(node, callback) {
    for (var i = 0; i < node.names.length; i++) {
      callback(node.names[i], node, i, node.names)
    }

    for (var i = 0; i < node.rules.length; i++) {
      callback(node.rules[i], node, i, node.rules)
    }
  },

  ScopeRule(node, callback) {
    for (let i = 0; i < node.scopes.length; i++) {
      callback(node.scopes[i], node, i, node.scopes)
    }
    for (let i = 0; i < node.rules.length; i++) {
      callback(node.rules[i], node, i, node.rules)
    }
  },

  Scope(node, callback) {
    for (let i = 0; i < node.selectors.length; i++) {
      callback(node.selectors[i], node, i, node.selectors)
    }
  },

  DocumentRule(node, callback) {
    for (var i = 0; i < node.functions.length; i++) {
      var hasRemoved = callback(node.functions[i], node, i, node.functions)
      if (hasRemoved) i--
    }
    if (node.selectors !== null) callback(node.selectors, node)
  },

  FontFeatureValuesRule(node, callback) {
    for (var i = 0; i < node.familyNames.length; i++) {
      var hasRemoved = callback(node.familyNames[i], node, i, node.familyNames)
      if (hasRemoved) i--
    }
    if (node.features !== null) callback(node.features, node)
  },

  Feature(node, callback) {
    if (node.declarations !== null) callback(node.declarations, node)
  },

  PageRule(node, callback) {
    if (node.styleRule !== null) callback(node.styleRule, node)
  },

  SupportsRule(node, callback) {
    for (var i = 0; i < node.queries.length; i++) {
      let hasRemoved = callback(node.queries[i], node, i, node.queries)
      if (hasRemoved) i--
    }
    for (var j = 0; j < node.selectors.length; j++) {
      let hasRemoved = callback(node.selectors[j], node, j, node.selectors)
      if (hasRemoved) j--
    }
  },

  StartingStyleRule(node, callback) {
    for (var j = 0; j < node.rules.length; j++) {
      let hasRemoved = callback(node.rules[j], node, j, node.rules)
      if (hasRemoved) j--
    }
  },

  ContainerRule(node, callback) {
    for (var j = 0; j < node.conditions.length; j++) {
      let hasRemoved = callback(node.conditions[j], node, j, node.conditions)
      if (hasRemoved) j--
    }
    if (node.rules !== null) callback(node.rules, node)
  },

  ContainerCondition(node, callback) {
    if (node.prop !== null) callback(node.prop, node)
    if (node.operator !== null) callback(node.operator, node)
    if (node.val !== null) callback(node.val, node)
  }
}

module.exports = {
  traverseParent,
  traverseTree
}
