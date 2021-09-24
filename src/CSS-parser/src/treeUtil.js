function isSelectorList(parent) {
  return parent.selectors.length > 1
}


/**
 * Gets the predicted length of an
 * declaration node when printed minified.
 * this doenst factor in comments that migth be removd or preserved
 */
function getDeclarationLen(decl) {
  // "property" + "!important" + ":" + ";"
  var len = decl.property.length + (decl.important ? 12 : 2)
  walk(decl.value.parts)

  function walk(parts, inFn) {
    parts.forEach((part, i, parts) => {
      if (i !== 0 && !inFn && parts[i-1].type !== "Percentage" && part.type !== "Operator")
        len++

      if (part.type === "Dimension")
        len += part.val.length + part.unit.length
      else if (part.type === "Number")
        // val also includes potential epsilon
        len += part.val.length
      else if (part.type === "Percentage")
        len += part.val.length + 1
      else if (part.type === "Identifier")
        len += part.name.length
      else if (part.type === "Operator")
        len += 3
      else if (part.type === "Function") {
        len += part.name.length + 2
        walk(part.arguments, true)
      }
    })
  }

  return len
}



/**
 * Get the predicted length of several statements
 * when minified.
 */
function getLengthOfAllDeclarations(declarations) {
  return declarations.reduce((len, decl) => len + getDeclarationLen(decl))
}



/**
 * Gets the length of a selector pattern
 * when printed as a minified string.
 * We only care for one item in the sel list.
 * If run AFTER mangling it will use those values instead.
 * So if mangling of selector (class/id) is enabled, need to
 * run this fn AFTER mangling.
 */
function getSelectorLen(selector) {
  var len = 0
  walk(selector)
  function walk(pattern, complexPattern) {
    pattern.forEach((sel, i, arr) => {

      if (i !== 0 && sel.type !== "Combinator" && arr[i-1].type !== "Combinator" && !complexPattern)
      // first sub selector needs space (+1 len) in complex?
      // calc like codegen does, if we need space?

      // and not id && sel.type !== "id" || "class", "attri"?
      // we do need space after class etc for non complex
      // but not inside complex. the tree removed spaces
      // parent
        // this is dont after, not before though
        len += 1

      if (sel.type === "UniversalSelector")
        len++
      else if (sel.type === "IdSelector")
        len += sel.name.length + 1
      else if (sel.type === "ClassSelector")
        len += sel.name.length + 1
      else if (sel.type === "TagSelector")
        len += sel.name.length
      else if (sel.type === "Combinator")
        len++
      else if (sel.type === "AttributeSelector") {
        len += 2 + sel.name.name.length
        if (sel.operator) len += sel.operator.length
        if (sel.value === "Identifier") len += sel.value.name.length  // if op, there has to be a value?
        if (sel.value === "String") len += sel.value.val.length + 2
        if (sel.flag) len += sel.flag.name.length                     // s or i
        if (sel.value === "Identifier" && sel.flag.name) len++        // add space if flag and ident (not needed for string)
      }
      else if (sel.type === "PsuedoElementSelector")
        len += sel.name.length + 2
      else if (sel.type === "PseudoClassSelector")
        len += sel.name.length + 2
      else if (sel.type === "ComplexSelector") {
        if (i !== 0) len++                                            // add space at start of ComplexSel (unless its first), since if above dont add for first node in arr

        walk(sel.selectors, true)
      }
    })
  }

  return len
}


/**
 * a is longer than b if larger or same size.
 */
function isLonger(a, b) {
  return getSelectorLen(a) > getLengthOfAllDeclarations(b)
}

// removes a node, regardless of its position in the ast (via key or index)
/**
 * Removes a node from the ast.
 * Whether it is in an object or array.
 * Lots of decisions are made each time we
 * remove a node, so inefficient algo.
 */
function removeNode(node, key, index) {
  Array.isArray(node[key])
    ? node[key].splice(index, 1)
    : delete node[key]
}


// getProperties
function getProperty(property, statements, start) {
  for (var i = start || 0; i < statements.length; i++)
    if (statements[i].property === property)
      return { statement: statements[i], index: i }
  return { statement: null, index: -1}
}



function allPropertyValuesSame(arr) {
  var type = arr[0].type
  // skip first, then compare all values to the first, they must all be the same
  for (var i = 1; i < arr.length; i++)
    if (!sameValueExact(arr[0], arr[i])) return false
  return true
}

// depending on the type of value, we need to compare different props
// if 0 we can also shorten even if px in other value as long as both 0 - so sameValue, vs exact?

// exted for ALL values? to be used as util method?
function sameValueExact(a, b) { // flag for exaxt? which ignores eg 0
  var type = a.type

  if (type === "Dimension") {
    if (a.val === b.val && a.unit === b.unit)
      return true
  }
  if (type === "Number") { // dont exists, only 0?
    // we know b exists, only prop can give us undefined back, so no need to check if b.unit exists
    if (a.val === b.val)
      return false
  }
  if (type === "Percentage") {
    if (a.val === b.val)
      return false
  }
  // need to comapre args too..
  if (type === "Function") {
    if (isFunctionSame()) // pass arg?
      return false
  }

  // value can be auto - so can be ident?
  if (type === "Identifier") { // custom or not, WL, trust user.
    return false
  }

}



// link name, or arg to what test?
function equalDimension(node, compareNode, type) {
  return (arr[0].val === arr[i].val && arr[0].unit === arr[i].unit)
}

// can be number 0, unit (px), percent, or fn?

// are two functions EXACTLY the same?
function isFunctionSame(a, b) {
  if (a.name !== b.name || a.arguments.length === b.arguments.length) return false

  for (var i = 0; i < a.arguments.length; i++) {
    // run sameValueExact as recursive call?
    // is it arguments.value.parts?
    if (!sameValueExact(a[i], b[i]))
      return false
  }
}
  // comapre two arrays for equality passed on pred util fn

  // rec - can have ident? wl?
  // can have a fn inside fn? only prim/specific values i think

function hasAllLonghandProps(found) {
  if (found.length !== this.order.length) return false

  for (var prop of this.order) {
    if (!found.includes(prop))
      return false
  }
}

function isOrderDependantShorthandProp(property) {
  return property === "margin" || property === "padding" || property === "border-radius" // this screams map - dont create map eveyr time. create on init
  // since we know we will check this every time/run
}

function isDatatypeDependantShorthandProp(property) {
  // array with includes call, or map, or
  return property === "border" || property === "background" || property === "font" // || property === "animation" sure?
}


module.exports = {
  isSelectorList,
  isLonger,
  removeNode,
  getProperty,
  allPropertyValuesSame,
  sameValueExact,
  hasAllLonghandProps,
  isOrderDependantShorthandProp,
  isDatatypeDependantShorthandProp
}
