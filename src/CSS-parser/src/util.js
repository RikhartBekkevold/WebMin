function createNameGenerator() {
  var i = 0
  var nameLength = 0
  var prependStrLen = 0
  var prependStr = ""
  var identChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  var charLen = identChar.length

  return function getNextIdent() {
    if (i >= identChar.length) {
      i = 0
      prependStr = identChar[nameLength++]
    }
    if (nameLength >= identChar.length) {
      nameLength = 0
      prependStr += identChar[prependStrLen++]
    }
    return prependStr + identChar[i++]
  }
}


var { mangleName, hasMangledNameBefore } = (function makeMangledNameMap() {
  var mangledNames = Object.create(null)
  var getNextIdent = createNameGenerator()
  return {
    mangleName(selNode) {
      if (mangledNames[selNode.type + "_" + selNode.name]) {
        selNode.name = mangledNames[selNode.type + "_" + selNode.name]
      }
      else if (!mangledNames[selNode.name]) {
        var newName = getNextIdent()
        mangledNames[selNode.type + "_" + selNode.name] = newName
        selNode.name = newName
      }
    },
    hasMangledNameBefore(type, name) {
      return mangledNames[type + "_" + name]
    }
  }
})()


function hasHigherSpec(node1, node2) {
  var diff = null
  for (var i = 0; i < node1.specificity.length; i++) {
    diff = node1.specificity[i] - node2.specificity[i]
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}


function hasHigherOrder(idx, idx2) {
  return idx > idx2 // .order
  // selectors.indexOf(node)?
}



exports.hasHigherPrecedence = function(node1, node2) {
  if (hasHigherSpec(node1, node2) === 1) return true
  if (hasHigherSpec(node1, node2) === -1) return false
  if (hasHigherSpec(node1, node2) === 0) return true
}

// all same?
exports.includesAll = function(arr, searchArr, prop) {
  for (var obj of arr)  // includesAll(visitPattern.styleRule.rules.statements, parent.rules.statements, "property")
    if (!searchArr.some(el => propOverrides(obj, el))) // obj[prop] === el[prop] && obj.value.parts.length === el.value.parts.length && (el.isImportant || !obj.isImportant)
      return false
  return true
  // need the number of? and push, or return idx of those not in? or ref to?
}


exports.getUnique = function(arr, searchArr, prop) {
  var outArr = []
  for (var obj of arr)
    if (!searchArr.some(el => propOverrides(obj, el))) //  obj[prop] === el[prop] && obj.value.parts.length === el.value.parts.length && (el.isImportant || !obj.isImportant)
      outArr.push(obj) // push the node|obj not found
    // if (!searchArr.includes(obj[prop])) // make map perfect for this?
  return outArr
}


function propOverrides(src, compare) {
  return (
    src.property === compare.property &&
    src.value.parts.length === compare.value.parts.length
    // && (compare.isImportant || !src.isImportant)
    // && (item.isImportant || !statement.isImportant)
  )
}


function copyMissing(arr, searchArr, prop) {
  for (var obj of arr)
  // some()- includes dont work with props
    if (!searchArr.includes(obj[prop])) // make map perfect for this?
      searchArr.push(obj[prop]) // push the node|obj not found
  return searchArr // return new search
}


function makeMap(str, separator, expectsLowerCase) {
  var map = Object.create(null); // also used for non letters by vue? special chars? auto escpaed by [] syntax? we can exsapc tht names after to see if worked
  var list = separator ? str.split(separator) : str.split(',')

  for (var i = 0; i < list.length; i++) {
    map[list[i].trim()] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()] }
    : function (val) { return map[val] || false }
}


var isUnit = makeMap("vmax,vmin,vh,vw,rem,ch,em,ex,%,px,cm,mm,in,pt,pc")
var isHex = /[0-9A-Za-z]/ // validate 3 or 6/length
var isKeyword = makeMap("inherit,initial,auto")


// return true or 0 - converted to false
function isOdd(n) {
  return !!(n % 2 && n !== 0)
}


function toHex(n) {
  var hex = n.toString(16)
  while (hex.length < 2) hex = "0" + hex
  return hex
}


/**
 * Strings will save prefix 000. We dont want these,
 * nor do we want 0.1 when CSS can execute it as .1
 * 000.09100 -> .091
 * 00030 -> 30
 (can this be applied for ALL values?) - is it safe to remove 0 in 0.3 for ALL values in every context?
 */
exports.trimRedundantZeros = function(strNum) {
  strNum = parseFloat(strNum).toString()
  if (strNum[0] === "0" && strNum.length !== 1) // we know its only one 0 left
    strNum = strNum.slice(1)
  return strNum
}


exports.removeProp = function removeProp(prop, object) {
  var prop = prop
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if (key === prop) delete object[key]
      else if (typeof object[key] === "object")
        removeProp(prop, object[key])
    }
  }
}


exports.isString = function(val) {
  return typeof val === "string"
}


exports.def = function(val) {
  return val !== undefined && val !== null
}


exports.removeDuplicates = function(arr, key) { // key can now be "undefined" since ecma convert. obj.undefined is legal prop too!
  var seen = Object.create(null) // makes map live! not first! even more eff. and only that works.
  return arr.filter(function(item) { // filter is converted? we can require a specific node version. so for node lib/mods/pkgs dont care for browsr support!
    return seen[item[key]] ? false : (seen[item[key]] = true)
    // && !node.important
    // pass the pred?
    // (isShorthand(item) && len) || (not shirthand) && seen[item[key]]
  })
}


exports.everySame = function(input) {
  return input.split('').every(char => char === input[0]); // every replcemnt/wrapper for loop with if? need to split thouhg
}


exports.everySecondSame = function(str) {
  if (str[0] === str[2] && str[0] === str[4] // dont comapre to prev, compare to same [0]
   && str[1] === str[3] && str[1] === str[5])
    return true
  return false
}


/* uses white even thouhg fff is smaller */
/* if i pass white, it will use that, not #fff, because it will check against #ffffff */
exports.replaceHexValueWithColorNameIfShorter = function(hex) {
  const hexMap = require('./hexValues.js'); // assumes wdir, and assumes ext js? only that maeks sense? can req json?
  if (hexMap[hex.toLowerCase()] === undefined) return hex.toLowerCase() // only done once, even if reapeted code, wont do both - in exrp rest. ten no
  hex = "#"+hex.toLowerCase() // assign to new named var? so i can return non lowercased? so dont need to do extra lowercase externally: opti.
  return hex.length < hexMap[hex].length // we switch only if smaller, not if equal, then we keep user choice
          ? hex.slice(1)
          : hexMap[hex] //.slice(1) // minus #
}

// doenst convert to 3hex shorthand - we can convert manually in map?
exports.replaceColorNameWithHexIfShorter = function(color) {
  // cached on second call? use closure. then we call only once, and only if needed! aka we ecnounter color hex or ident.
  const colorNames = require('./colorNames.js'); // assumes wdir, and assumes ext js? only that maeks sense? can req json?
  if (colorNames[color.toLowerCase()] === undefined) return color.toLowerCase()
  color = color.toLowerCase() // assign to new named var? so i can return non lowercased? so dont need to do extra lowercase externally: opti.
  return color.length < colorNames[color].length
          ? color
          : colorNames[color].slice(1) // minus #
}


/**
 * A hex can be shortened if pairs match only.
 * eg: 000000 or ff7722
 */
exports.canShortenHex = function(hex) {
  if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5])
    return true
  return false
}


/**
 * Converts an RGB value to hex.
 * Should be no loss of info.
 */
exports.RGBToHex = function(r, g, b) {
  return toHex(r)+toHex(g)+toHex(b)
}

exports.createNameGenerator = createNameGenerator
exports.mangleName = mangleName
exports.hasMangledNameBefore = hasMangledNameBefore
exports.propOverrides = propOverrides


// node.values.splice(node[node.values.length-1])  splice / remove by value or pred
// a gets bs pos, and b gets a
function switchPos(arr, i, j) { // index and value (first ref, indexOf)
  var temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}
exports.switchPos = switchPos
