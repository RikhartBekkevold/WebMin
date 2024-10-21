const pp = require('./codeGenerator.js').prototype

pp.isValueEndingWithDelim = function(node) {
  // we dont consider dimension (px, rem etc) delim value. SHL and AI seem to indicate that it isnt ok to skip space between them.
  // check spec. so for now: 'margin:20px 10px;'
  return node.type === "Percentage"    ||
         node.type === "ListSeparator" ||
         node.type === "String"        ||
         node.type === "Function"      ||
         node.type === "QuotelessUrl"  ||
         node.type === "Condition"
         // mediafeature?
         // isValueDelim
}

// !index ||
pp.prevSiblingIsDelimValue = function(siblings, index) {
  // have isSiblings as own check. the req to do nospace? need to set "" default? or else add(val)
  return !hasSiblings(siblings) || index === 0 || isValueEndingWithDelim(siblings[index-1])
}

pp.selectorIsBehindDelimiter = function(node, idx) {
   return node.type === "ComplexSelector" ||
          // check index only if not inside complex
          idx === 0 ||
          node.selectors[idx-1].type === "Combinator" ||
          node.selectors[idx-1].type === "NamespacePrefixSeparator"
}

// firstSelectorOrBehindCombinator
pp.isFirstSelectorInPatternOrPrevSiblingIsCombinator = function(parent, index) {
  return index === 0 || parent.selectors[index-1].type === "Combinator" || parent.selectors[index-1].type === "NamespacePrefixSeparator"
}

pp.insideComplex = function(parent) {
  return parent.type === "ComplexSelector"
}

pp.isFirstSelectorAndNotInPageRule = function(ancestors, idx) {
  return (idx === 0 && ancestors[ancestors.length-4].type !== "PageRule")
}

pp.isFirstSelectorAndInPageRule = function(ancestors, idx) {
  return (idx === 0 && ancestors[ancestors.length-4].type === "PageRule")
}


pp.prevSiblingIsCombinator = function(parent, idx) {
  // if behind combinator, it cant be first? combinator HAS to be first?
  return (idx !== 0 && parent.selectors[idx-1].type === "Combinator") || parent.selectors[idx-1].type === "NamespacePrefixSeparator"
}


// isFontFeatureDelimValue
// prevSiblingIsCommaOrString(siblings, index)
//  && siblingsAreDelimValues(arr, index) - prevSiblingEndsWithDelimiter(siblings, index) - prevSiblingIsListSepOrString() prevSiblingDelimVal   fontfeatureDelim
pp.prevSiblingIsListSepOrString = function(siblings, index) {
  return index !== 0 && (siblings[index-1].type === "ListSeparator" || siblings[index-1].type === "String")
}

// lastSelectorPattern
pp.lastSibling = function(parent, node) {
  return parent.selectors.indexOf(node) === parent.selectors.length-1
}

pp.lastMediaQuery = function(parent) {
  return parent.queries.indexOf(node) === parent.queries.length-1
}

pp.isFontFeature = function(parent) {
  return parent.type === "FontFeatureValuesRule"
}

pp.isMediaFeatureProperty = function(parent) {
  return parent.type === "MediaFeature" && parent.prop === node
}

pp.isFunctionArgument = function(parent) {
  return parent.type === "Function"
}

pp.isImportUrl = function(parent) {
  return parent.type === "ImportRule"
}

pp.isNamespaceUrl = function(parent) {
  return parent.type === "NamespaceRule"
}

pp.isNamespacePrefix = function(parent, node) {
  return parent.type === "NamespaceRule" && node === parent.prefix
}

pp.hasSiblings = function(siblings) {
  return Array.isArray(siblings) && siblings.length > 0
}
