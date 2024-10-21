function convertExprToRPN(expression) {
  var tokens = expression
  var outputQueue = []
  var operatorStack = []
  var precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2
  }

  function getPrecedence(operator) {
    return precedence[operator] || 0
  }

  for (var token of tokens) {
    if (!isNaN(token)) {
      outputQueue.push(token)
    } else if (token === '(') {
      operatorStack.push(token)
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop())
      }
      if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
        throw new Error('Mismatched parentheses')
      }
      operatorStack.pop()
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        getPrecedence(token) <= getPrecedence(operatorStack[operatorStack.length - 1])
      ) {
        outputQueue.push(operatorStack.pop())
      }
      operatorStack.push(token)
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop())
  }

  return outputQueue
}


function evaluateBinaryExpression(left, operator, right) {
  if (operator === "*") return left * right
  if (operator === "+") return left + right
  if (operator === "/") return left / right
  if (operator === "-") return left - right
}


function evaluateVariableLengthExpression(exprArr) {
  var operandStack = []

  for (var token of exprArr) {
    if (!isNaN(token)) {
      operandStack.push(parseFloat(token))
    } else if ('+-*/'.includes(token)) {
      var right = operandStack.pop()
      var left = operandStack.pop()
      var result = evaluateBinaryExpression(left, token, right)
      operandStack.push(result)
    }
  }

  return operandStack[0]
}


// extend to consider important
function propOverrides(src, compare) {
  return (
    src.property === compare.property &&
    src.value.parts.length === compare.value.parts.length
  )
}


// extend to consider important
function includesAll(arr, searchArr, prop) {
  for (var obj of arr)
    if (!searchArr.some(el => propOverrides(obj, el)))
      return false
  return true
}


/**
 * Strings will save prefix 000. We dont want these,
 * nor do we want 0.1 when CSS can execute it as .1
 * 000.09100 -> .091
 * 00030 -> 30
 */
function trimRedundantZeros(strNum) {
  strNum = parseFloat(strNum).toString()
  if (strNum[0] === "0" && strNum.length !== 1)
    strNum = strNum.slice(1)
  return strNum
}


/**
 * Removes excess objects with same 'key' value,
 * keeps objects with 'ignoreKey' and 'ignoreVal'.
 */
function removeDuplicateObjects(arr, key, ignoreKey, ignoreVal) {
  var seen = Object.create(null)

  return arr.filter(function(obj) {
    if (obj[ignoreKey] === ignoreVal) return true
    return seen[obj[key]] ? false : (seen[obj[key]] = true)
  })
}


function attemptMakeColorName(hex) {
  var hexMap = require('./consts/hex.js');
  var colorname = hexMap["#"+hex.toLowerCase()]
  return colorname || hex
}


function attemptMakeHex(color) {
  var colorNames = require('./consts/colornames.js');
  var hex = colorNames[color.toLowerCase()]
  return hex ? hex.slice(1) : color
}


// a hex can only be shortened if pairs match,
// eg: 000000 or ff7722
function canShortenHex(hex) {
  return (
    hex.length === 6  &&
    hex[0] === hex[1] &&
    hex[2] === hex[3] &&
    hex[4] === hex[5]
  )
}


// attempt to shorten if 6 char hex.
// if alpha, cant be shortened.
function attemptShortenHex(hex) {
  return canShortenHex(hex)
    ? hex[0] + hex[2] + hex[4]
    : hex
}


function toHex(n) {
  var hex = n.toString(16)
  while (hex.length < 2) hex = "0" + hex
  return hex
}


function RGBToHex(r, g, b, a) {
  return a
    ? toHex(r)+toHex(g)+toHex(b)+toHex(Math.round(parseFloat(a) * 255))
    : toHex(r)+toHex(g)+toHex(b)
}


function switchPos(arr, i, j) {
  var temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}


function replaceNodeAt(arr, index, newNode) {
  return Array.isArray(newNode) ?
    (arr.splice(index, 1, ...newNode), newNode) :
    (arr.splice(index, 1, newNode), newNode)
}


function removeNodeAt(arr, index) {
  return arr.splice(index, 1)
}


function shallowCopy(objects) {
  return objects.map((obj) => Object.assign({}, obj))
}


function makeMultiKeyMap() {
  var vals = Object.create(null)

  return {
    add(key, val) {
      vals[key]
      ? vals[key].push(val)
      : vals[key] = [val]
    },
    get(key) {
      return this.hasMulti(key)
        ? vals[key]
        : vals[key][0]
    },
    exists(key) {
      return vals[key]
    },
    hasMulti(key) {
      return !!(this.exists(key) && vals[key].length > 1)
    },
    keys(key) {
      return vals
    },
    getAllSingle() {
      var arr = []
      for (var key in vals)
        if (vals[key].length === 1)
          arr.push(vals[key][0]) 
      return arr
    },
    getAllMulti() {
      var arr = []
      for (var key in vals)
        if (vals[key].length > 1)
          arr.push(vals[key])
      return arr
    }
  }
}

module.exports = {
  convertExprToRPN,
  evaluateVariableLengthExpression,
  removeNodeAt,
  replaceNodeAt,
  switchPos,
  RGBToHex,
  canShortenHex,
  attemptMakeHex,
  attemptShortenHex,
  attemptMakeColorName,
  removeDuplicateObjects,
  trimRedundantZeros,
  includesAll,
  propOverrides,
  shallowCopy,
  makeMultiKeyMap
}
