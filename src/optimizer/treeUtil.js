const {
  switchPos,
  removeDuplicateObjects,
  includesAll,
  propOverrides
} = require('./util.js')

const shorthandMap = require('./consts/shorthandMap.js')


function optimizeValueAmount(values) {
  // margin: 20px 20px; -> margin: 20px;
  if (values.length === 2 && sameValueExact(values[0], values[1]))
     values.splice(0, 1)

  // margin: 20px 30px 20px; -> margin: 20px 30px;
  // in BOTH the user-shorthand and our shortened-shorthand CSS is assuming the last (left) value is 30px! hence why safe to shorten.
  else if (values.length === 3 && sameValueExact(values[0], values[2]))
     values.splice(-1)

  // margin: 20px 20px 20px 20px; -> margin: 20px;
  else if (values.length === 4 && allPropertyValuesSame(values))
    values.splice(1, 3)

  // margin: 20px 30px 20px 30px; -> margin: 20px 30px;
  // having this below allPropertyValuesSame makes sure it will only match in cases where pairs match, but the 4 values are not all the same value
  else if (values.length === 4 && sameValueExact(values[0], values[2]) && sameValueExact(values[1], values[3]))
     values.splice(0, 2)

  // margin: 50px 30px 60px 30px; -> margin: 50px 30px 60px;
  else if (values.length === 4 && !sameValueExact(values[0], values[2]) && sameValueExact(values[1], values[3]))
      values.splice(-1)
}


// arranges declaration values in an order that minimizes the number of whitespaces needed to separate values,
// by using the values own delimiters. essentially makes sure no delims are next to eachother.
function optimizeValueOrder(parts) {
  var lastIndex = parts.length-1
  var lastValue = parts[lastIndex]

  var lastValueEndsWithDelimiter = lastValue.type === "Percentage" || lastValue.type === "Function"
  var firstValueStartsWithDelimiter = parts[0].type === "Hex"

  if (lastValueEndsWithDelimiter) {
    var index = parts.findIndex((value) => value.type !== "Percentage" && value.type !== "Function")
    if (index !== -1)
      switchPos(parts, index, lastIndex)
  }

  if (firstValueStartsWithDelimiter) {
    var index = parts.findIndex((value) => value.type !== "Hex")
    if (index !== -1)
      switchPos(parts, index, 0)
  }
}


function getExprParts(args) {
  var exprArray = []
  for (var arg of args)
    exprArray.push(arg.val)
  return exprArray
}


function getGrandparent(ancestors) {
  return ancestors[ancestors.length-3]
}


function removeOverridenDeclarations(node, declarations) {
  node.rules.declarations = removeDuplicateObjects(
    declarations.reverse(),
    "property",
    "type",
    "Comment"
  ).reverse()
  return declarations.length - node.rules.declarations.length
}


// removes shorthand after longhand. even if shorthand dont have the exact value of the longhand, becasuse the browser expands the shorthand to all 4 values always.
// so margin: 20px, will always override, margin-left.
function removeOverridenLonghands(node, declarations) {
  for (var key in shorthandMap) {
    var order = shorthandMap[key].order
    var { index: indexOfShorthand, declaration: shorthandProp } = getProperty(key, node.rules.declarations)
    var hasShorthandProp = shorthandProp !== null

    if (hasShorthandProp) {
      for (var i = 0; i < indexOfShorthand; i++) {
        if (order[node.rules.declarations[i].property]) {
          node.rules.declarations.splice(i, 1)
        }
      }
    }
  }
}

// maybe, attempt
// shorten properties   attemptShortemLonghandProperties
function shortenLongHands(node) {
  for (var key in shorthandMap) {
    var longhands = []
    var subProperties = shorthandMap[key].subProperties
    var order = shorthandMap[key].order

    var { index: indexOfShorthand, declaration: shorthandProp } = getProperty(key, node.rules.declarations)
    var hasShorthandProp = shorthandProp !== null

    // if has shorthand
    if (hasShorthandProp) {
      // function getAllLonghandsOfShorthand(declarations) { // regardless of pos - loop until?
        subProperties.forEach((prop, i) => { // getDeclarationByPropName
          var { declaration } = getProperty(prop, node.rules.declarations, indexOfShorthand) // +1
          if (declaration) longhands.push(declaration)
        })
      // }

      // only do if actually has at least one longhand after (to prevent expanding then deflating again)
      // and we have longhand

      // merge any longshands into the shorthand
      if (longhands.length) {
        // expand the values into what CSS sees:

        // createMargin - createShorthand? createProp
        if (isOrderDependantShorthandProp(shorthandProp.property)) {
          // given a prop of margin, border, padding - expand the current value(s) into 4 values (what draw engine does)
          // function unfoldShorthand(shorthandProp) {
          var parts = shorthandProp.value.parts
          if (parts.length === 1) parts.push(parts[0], parts[0], parts[0])
          if (parts.length === 2) parts.push(parts[0], parts[1])
          if (parts.length === 3) parts.push(parts[1])
          // }

          // wehther longhand after or before doenst matter?
          // how to shorten after?? run optimize shorthand?
          // add each longhand to its correct margin/shorthand position
          longhands.forEach((longhandProp) => {
            // do we know we saved space?
            // check length of each here before we remove/add?
            // is this the only place we cant be sure result is shorter?
            parts.splice(order[longhandProp.property], 1, longhandProp.value.parts[0]) // we know only one value in longhand.. hence [0]
            // remove the longhand AFTER margin
            node.rules.declarations.splice(node.rules.declarations.indexOf(longhandProp), 1)
          })
        }
        else if (isDatatypeDependantShorthandProp(shorthandProp.property)) {
          longhands.forEach((longhandProp) => {
            // just pushing is ok here, for border, but fails for animation|background|font?
            shorthandProp.value.parts.push(longhandProp.value.parts[0]) // we know only one value in longhand.. hencey [0] - assumes correct declaration format used, meaning only one value
            node.rules.declarations.splice(node.rules.declarations.indexOf(longhandProp), 1)
          })
        }
      }
    }
    // so: if ALL longhands (subprop) of a shorthand is present, it is safe to replace them with a shorthand.

    // if no shorthand, create it
    else if (!hasShorthandProp) { // any they are NOT dupli, which this implies by the way we find the longhands
      subProperties.forEach((prop, i) => { // foreach key? in?
        var { declaration } = getProperty(prop, node.rules.declarations)
        if (statement) longhands.push(statement)
      });

      var isAnyImportant = false

      for (var prop of longhands) {
        if (prop.important === true) {
          isAnyImportant = true
          break
        }
      }

      var allLonghandsPresent = longhands.length === subProperties.length && !isAnyImportant

      if (allLonghandsPresent) {
        var newNode = createStatementNode(key)

        longhands.forEach((longhandProp) => {
          // we looked for, and pushed in the same order we want to add to the new margin node - for border, order don't matter - for anim it does!
          newNode.value.parts.push(longhandProp.value.parts[0]) // longhand always just have one value
          node.rules.declarations.splice(longhandProp, 1)
        })

        // add a new "margin" node to the end of the selector declarations, using the 4 shorthand values
        node.rules.declarations.push(newNode)
      }
    }
  }

  // return node?
}


// true if two arrays with selector nodes, representing a selector pattern, have the same nodes in every position
function equalSelectorPatterns(a, b) {
  if (a.length !== b.length)
    return false

  for (var i = 0; i < a.length; i++) {
    if (!isEqualSelector(a[i], b[i])) return false
    // if true, b is also ComplexSelector, since prev line only passes if both are
    if (a[i].type === "ComplexSelector")
      // if both ComplexSelector call this function again to test nodes of its sub array against eachother
      if (!equalSelectorPatterns(a[i].selectors, b[i].selectors)) return false
  }

  return true
}


// true if a and b is the same selector node visually (e.g. #app and #app)
function isEqualSelector(a, b) {
  if (a.type === "ComplexSelector" || a.type === "UniversalSelector" || a.type === "NestingSelector")
    return b.type === a.type

  else if (a.type === "IdSelector"     ||
    a.type === "ClassSelector"         ||
    a.type === "TagSelector"           ||
    a.type === "PsuedoElementSelector" ||
    a.type === "PseudoClassSelector"   ||
    a.type === "Combinator")
      return b.type === a.type && b.name === a.name

  // in keyframes, a selector can be a percentage
  else if (a.type === "Percentage")
    a.type === b.type && a.val === b.val

  else if (a.type === "AttributeSelector")
    return a.type === b.type      &&
      a.name.name === b.name.name &&
      a.operator  === b.operator  &&
      a.value.val === b.value.val &&
      a.flag.name === b.flag.name

  // most likely caused by not adding an 'if' check for a node type that exists in our progam. or traverser complain. add check? so dont run traverse for it...
  throw new TypeError("Unknown type passed when comparing selector node equality in 'equalSelector'")
}

// add to map when . can be multi dupli? so map dont work?
// we avoid double loop if trigger in right visitor?
// we are merging the 'declarations', not 'selectors'? STYLERULE! not decl or sel
function mergeDuplicateSelectors(node, visitedSelectorPatterns, parent) {
  visitedSelectorPatterns.forEach((visitedPattern, idx) => {
    var currPattern = node.selectors
    var prevPattern = visitedPattern.selectorPattern.selectors

    // console.log(currPattern);
    if (equalSelectorPatterns(currPattern, prevPattern)) {
      var visitedNodeStatements = visitedPattern.styleRule.rules.declarations
      console.log(parent);
      var nodeStatements = parent.rules.declarations
      var allPropsOverridden = includesAll(visitedNodeStatements, nodeStatements, "property") // property not used for now
      var isPartOfList = isSelectorList(visitedPattern.styleRule) // use let? or just same, since only once?

      if (!isPartOfList && allPropsOverridden && visitedPattern.parentArr) { // or parent.type === "PageRule"
        let idx = visitedPattern.parentArr.indexOf(visitedPattern.styleRule) // removes entire keyFrames? we want only selector inside. so hardcoded ast.rules path dont work!
        var removed = visitedPattern.parentArr.splice(idx, 1)
        // return "delStyleRule"
        return 2
      }
      else if (!isPartOfList && !allPropsOverridden) {
        for (var i = 0; i < visitedNodeStatements.length; i++) {
          var statement = visitedNodeStatements[i]
          // not all declarations overriden, but find the ones that are, and delete them
          if (nodeStatements.findIndex(item => propOverrides(item, statement)) !== -1)
            visitedNodeStatements.splice(i--, 1)
        }
      }

      else if (isPartOfList && allPropsOverridden) {
        // we always in selpattern. and struct of stylerule is always same. hence why its OK to hardcode paths if we go DOWN?
        let idx = visitedPattern.styleRule.selectors.indexOf(visitedPattern.selectorPattern) // check index inside the ast. not in visitprpattenr. hence works.
        visitedPattern.styleRule.selectors.splice(idx, 1)
        return true
      }

      else if (isPartOfList && !allPropsOverridden) {
        var nonOverriddenProps = getUnique(visitedNodeStatements, nodeStatements, "property") // property not used for now
        var selectorLongerThanDeclarations = isLonger(visitedPattern.selectorPattern.selectors, nonOverriddenProps)

        if (selectorLongerThanDeclarations) {
          let idx = visitedPattern.styleRule.selectors.indexOf(visitedPattern.selectorPattern)
          visitedPattern.styleRule.selectors.splice(idx, 1)

          nonOverriddenProps.forEach((decl, i) => {
            nodeStatements.push(decl)
          })
        }

        return true
      }
    }
  })
}

// checks specific props. need to know val/unit/name/type props for all , should always keep them same anyway? so can assume?
// allows both type and unit as validators for legitimacy
// true if all nodes in arr is of one of the types in types
function nodesAreTypes(arr, ...types) {
  for (var item of arr) {
    if (!types.includes(item.type) && !types.includes(item.unit))
      return false
  }
  return true
}


function isSelectorList(stylerule) {
  return stylerule.selectors.length > 1
}


/**
 * Gets the predicted length of an
 * declaration node when printed minified.
 * this doenst factor in comments that migth be removd or preserved. or ws. or all nodes? eg delim?
 alt: loc data. ws/comment flag to preserve them.
 alt: add length prop in tokenizer to token/node
 */
 // need to understand the rule of the printer. even the optimizations of order. for diff decl.
function getDeclarationLen(decl) {
  // "property" + "!important" + ":" + ";"
  var len = decl.property.length + (decl.important ? 12 : 2)
  walk(decl.value.parts)

  function walk(parts, inFn) {
    parts.forEach((part, i, parts) => {
      // not first, nor in fn, nor prev percent or operator
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
      // delim? val.length
    })
  }

  return len
}

// --ident same syntax as any decl
// isLonger
function compareDeclAndFn(decl, fn) {
  // only want value + name/value
  return getDeclarationLen(decl) > getDeclarationValueLength(fn) // since fn
  // only want one value - make inner part its own fn - so can call for one - getDeclarationValueLength()
}



/**
 * Get the predicted length of several declarations
 * when minified.
 */
function getLengthOfAllDeclarations(declarations) {
  return declarations.reduce((len, decl) => len + getDeclarationLen(decl))
}



/**
 * Gets the length of a selector pattern
 * when printed as a optimized minified string.
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
      else if (sel.type === "NestingSelector")
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
      throw new Error("Unknown type when calling 'getSelectorLen'")
    })
  }

  return len
}


/**
 * a is longer than b if >= (larger or same size).
 */
function isLonger(a, b) {
  return getSelectorLen(a) > getLengthOfAllDeclarations(b)
}

// removes a node, regardless of its position in the ast (via key or index)
/**
 * Removes a node from the ast.
 * Whether it is in an object or array. (is an obj prop/stringed key, or in an array/indexed key, both are objects/always a obj node)
 * Lots of decisions are made each time we
 * remove a node, so inefficient algo.
 */
function removeNode(node, key, index) {
  Array.isArray(node[key])
    ? node[key].splice(index, 1)
    : delete node[key]
}


function getProperty(property, declarations, start) {
  for (var i = start || 0; i < declarations.length; i++)
    if (declarations[i].property === property)
      return { declaration: declarations[i], index: i }
  return { declaration: null, index: -1}
}


function allPropertyValuesSame(arr) {
  var type = arr[0].type
  // skip first, then compare all values to the first, they must all be the same
  for (var i = 1; i < arr.length; i++)
    if (!sameValueExact(arr[0], arr[i])) return false
  return true
}


// check if two nodes, representing css values, are equal.
// if the node type is not recognized, returns true.
function sameValueExact(a, b) {
  var type = a.type

  // after this point we can assume both a and b has same type
  if (a.type !== b.type) return false

  if (type === "Dimension") {
    if (a.val !== b.val || a.unit !== b.unit)
      return false
  }
  else if (type === "Number") {
    if (a.val !== b.val)
      return false
  }
  else if (type === "Percentage") {
    if (a.val !== b.val)
      return false
  }
  else if (type === "Function") {
    if (!isFunctionSame(a, b)) // correct a and b?
      return false
  }
  // keywords (e.g. auto) or variablename (e.g. --darkred) only valid as value/fn arg
  else if (type === "Identifier") {
    if (a.name !== b.name)
      return false
  }

  return true
}


// determines if two functions (calc(20px + 30px)) are exactly the same visually
function isFunctionSame(a, b) {
  // console.log(a, b);
  // validate name and length. validate length so a: calc(20px), b: calc(20px + 20px) isnt true below
  if (a.name !== b.name || a.arguments.length !== b.arguments.length) return false

  for (var i = 0; i < a.arguments.length; i++) {
    console.log(a.arguments[i].type, b.arguments[i].type);

    // if a is ListSeparator, b need to be too
    if (a.arguments[i].type === "ListSeparator" && a.arguments[i].type !== "ListSeparator") // use parser.ListSeparator? nodetypes.js to easily change for all occurences of use?
      return false

    // list is one val, but operator can be many, so need to check same val
    else if (a.arguments[i].type === "Operator" && (b.arguments[i].type !== "Operator" || a.arguments[i].val !== b.arguments[i].val))
      return false

    // is it arguments.value.parts?
    else if (!sameValueExact(a.arguments[i], b.arguments[i]))
      return false
  }

  return true
}


function hasAllLonghandProps(found) {
  if (found.length !== this.order.length) return false

  for (var prop of this.order) {
    if (!found.includes(prop))
      return false
  }
}


// gets the value of an rgb or rgba function
// rgb(2, 2, 2)
// rgb(2 2 2)
// rgb(2 2 2 / 50%)
// rgb(2, 2, 2, 50%)
function getRGBValues(args) { // fn
  var values = []
  for (arg of args) {
    if (arg.type === "Number" || arg.type === "Percent")
      values.push(Number(arg.val))
  }
  return values
}


// does not ws
function getDeclarationLen() {

}




function getAtomLength(atom) {
  var len = 0

  switch (atom.type) {
    case "ListSeperator":
        len += 1
      break;
    case "Identifier":
    case "Hex":
      val + 1
    case "Identifier":
        len += atom.name.length
      break;
    default:
      throw new TypeError("Unknown atom node")
  }
  // need to take the ws into account? not for selector len? if have , then yes?

  // if ws and loc, is accurate?
  return len
}


function getFunctionLength() {
  var paran = 2
  var len = node.name.length + paran

  for (var node of arguments) {
    len += getAtomLength()
  }

  return len
}



module.exports = {
  optimizeValueAmount,
  optimizeValueOrder,
  removeOverridenDeclarations,
  removeOverridenLonghands,
  shortenLongHands,
  mergeDuplicateSelectors,
  getExprParts,
  isSelectorList,
  isLonger,
  removeNode,
  getProperty,
  allPropertyValuesSame,
  sameValueExact,
  hasAllLonghandProps,
  nodesAreTypes,
  getRGBValues,
  getGrandparent
}
