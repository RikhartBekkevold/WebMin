function createNameGenerator(useSpecialChar) {
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


/**
 * Mangling of selectors can be done in one pass because
 * selectors are not declared and used separately.
 */
function makeMangledNameMap(map) {
  var mangledNames = map || Object.create(null)
  var getNextIdent = createNameGenerator()

  return {
    mangleName(selNode, externalMap) {
      // second (and third etc) encounter of selector we reuse name
      if (mangledNames[selNode.type + "_" + selNode.name]) {
        selNode.name = mangledNames[selNode.type + "_" + selNode.name]
      }
      // first encounter we both mangle name and assign name to node
      else if (!mangledNames[selNode.name]) {
        var newName = getNextIdent()
        mangledNames[selNode.type + "_" + selNode.name] = newName
        selNode.name = newName
      }
    },
    // hasMangledNameBefore(type, name) {
    //   return !!mangledNames[type + "_" + name]
    // },
    // getMangledName(type, name) {
    //   return mangledNames[type + "_" + name]
    // },
    getMangledNames() {
      return mangledNames
    }
  }
}

module.exports = {
  createNameGenerator,
  makeMangledNameMap
}
