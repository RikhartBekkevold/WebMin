function traverseParent(ast, visitors) {
  var visitedSelectorPatterns = []
  var ancestors = []

  traverse(ast, null)
  function traverse(node, parent, idx, arr, parentArr) {
    ancestors.push(node)
    if (visitors && visitors[node.type] && visitors[node.type].enter) {
      var hasRemoved = visitors[node.type].enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors)
      if (hasRemoved === true) return ancestors.pop(node), hasRemoved
    }
    if (base[node.type]) var action = base[node.type](node, traverse, arr)
    if (visitors && visitors[node.type] && visitors[node.type].exit) {
      var hasRemoved = visitors[node.type].exit(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors)
      if (node.type === "StyleRule" && action && hasRemoved === true) return ancestors.pop(node), action + 1
      if (node.type === "StyleRule" && action) return ancestors.pop(node), action
      if (hasRemoved === true) return ancestors.pop(node), hasRemoved
    }
    if (node.type === "SelectorPattern" && hasRemoved === 2) return ancestors.pop(node), true
    ancestors.pop(node)
  }
}


var base = {}

base.Stylesheet = function (node, callback, parentArr) {
  for (var i = 0; i < node.rules.length; i++) {
    let hasRemoved = callback(node.rules[i], node, i, node.rules, parentArr)
    if (hasRemoved === true) i--

    if (typeof hasRemoved === "number")
      i -= hasRemoved
  }
}

base.StyleRule = function (node, callback, parentArr) {
  var deletedStyleRules = 0
  for (var i = 0; i < node.selectors.length; i++) {
    let hasRem = callback(node.selectors[i], node, i, node.selectors, parentArr)
    if (hasRem === true) i--
    if (hasRem === 2) deletedStyleRules++
  }
  callback(node.rules, node)
  if (deletedStyleRules) return deletedStyleRules
}


base.SelectorPattern = function (node, callback, parArr) {
  for (var i = 0; i < node.selectors.length; i++) {
    var hasRemoved = callback(node.selectors[i], node, i, node.selectors, parArr)
    if (hasRemoved === true) i--
  }
}

base.CharsetRule = function (node, callback) {
  callback(node.encoding, node)
}

base.NamespaceRule = function (node, callback) {
  if (node.prefix) callback(node.prefix, node)
  callback(node.url, node)
}

base.ImportRule = function (node, callback) {
  callback(node.url, node)
  if (node.media)
    for (var i = 0; i < node.media.length; i++){
      var hasRemoved = callback(node.media[i], node, i, node.media)
      if (hasRemoved) i--
    }
}

base.Block = function (node, callback) {
  for (var i = 0; i < node.statements.length; i++) {
    var hasRemoved = callback(node.statements[i], node, i, node.statements)
    if (hasRemoved) i--
  }
}

base.Statement = function (node, callback) {
  callback(node.value, node)
}

base.Value = function (node, callback) {
  for (var i = 0; i < node.parts.length; i++) {
    var hasRemoved = callback(node.parts[i], node, i, node.parts)
    if (hasRemoved) i--
  }
}

base.MediaQueryList = function (node, callback) {
  for (var i = 0; i < node.queries.length; i++) {
    let hasRemoved = callback(node.queries[i], node, i, node.queries)
    if (hasRemoved) i--
  }
  for (var j = 0; j < node.selectors.length; j++) {

    let hasRemoved = callback(node.selectors[j], node, j, node.selectors)
    if (hasRemoved) j--
  }
}

base.MediaRule = function (node, callback) {
  for (var i = 0; i < node.def.length; i++) {
    let hasRemoved = callback(node.def[i], node, i, node.def)
    if (hasRemoved) i--
  }
}

base.MediaFeature = function (node, callback) {
  callback(node.prop, node)
  callback(node.val, node)
}

base.KeyframesRule = function (node, callback) {
  for (var i = 0; i < node.arguments.length; i++) {
    let hasRemoved = callback(node.arguments[i], node, i, node.arguments)
    if (hasRemoved) i--
  }
}

base.ComplexSelector = function (node, callback) {
  for (var i = 0; i < node.selectors.length; i++) {
    var selector = node.selectors[i]
    var hasRemoved = callback(selector, node, i, node.selectors)
    if (hasRemoved) i--
  }
}

base.Function = function (node, callback) {
  for (var i = 0; i < node.arguments.length; i++) {
    var hasRemoved = callback(node.arguments[i], node, i, node.arguments)
    if (hasRemoved) i--
  }
}

base.AttributeSelector = function (node, callback) {
  callback(node.name, node)
  if (node.value !== null) callback(node.value, node)
  if (node.flag !== null) callback(node.flag, node)
}

base.CounterStyleRule = function (node, callback) {
  if (node.name !== null) callback(node.name, node)
  if (node.statements !== null) callback(node.statements, node)
}

base.ViewportRule = function (node, callback) {
  if (node.statements !== null) callback(node.statements, node)
}

base.ColorProfileRule = function (node, callback) {
  if (node.name !== null) callback(node.name, node)
  if (node.rules !== null) callback(node.rules, node)
}

base.PropertyRule = function (node, callback) {
  if (node.name !== null) callback(node.name, node)
  if (node.rules !== null) callback(node.rules, node)
}

base.DocumentRule = function (node, callback) {
  for (var i = 0; i < node.functions.length; i++) {
    var hasRemoved = callback(node.functions[i], node, i, node.functions)
    if (hasRemoved) i--
  }
  if (node.selectors !== null) callback(node.selectors, node)
}

base.FontFeatureValuesRule = function (node, callback) {
  for (var i = 0; i < node.familyNames.length; i++) {
    var hasRemoved = callback(node.familyNames[i], node, i, node.familyNames)
    if (hasRemoved) i--
  }
  if (node.features !== null) callback(node.features, node)
}

base.Feature = function (node, callback) {
  if (node.declarations !== null) callback(node.declarations, node)
}

base.PageRule = function (node, callback) {
  if (node.styleRule !== null) callback(node.styleRule, node)
}

base.SupportsRule = function (node, callback) {
  for (var i = 0; i < node.queries.length; i++) {
    let hasRemoved = callback(node.queries[i], node, i, node.queries)
    if (hasRemoved) i--
  }
  for (var j = 0; j < node.selectors.length; j++) {
    let hasRemoved = callback(node.selectors[j], node, j, node.selectors)
    if (hasRemoved) j--
  }
}


module.exports = {
  traverseParent
}
