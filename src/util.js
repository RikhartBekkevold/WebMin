exports.createMap = function(obj) {
  var map = Object.assign(Object.create(null), obj || {})
  return function(key) { return map[key] }
}

exports.makeMap = function(obj) {
  var map = Object.assign(Object.create(null), obj || {})
  return {
    get(key) { return map[key] },
    add(key) { return map[key] = true }
  }
}

exports.removeDuplicates = function(arr, key) {
  var seen = Object.create(null)
  return arr.filter(function(item) {
    return key
      ? seen[item[key]] ? false : (seen[item[key]] = true)
      : seen[item] ? false : (seen[item] = true)
  })
}
