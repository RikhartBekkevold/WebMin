function defined(val) {
  return val !== undefined && val !== null
}

function isString(val) {
  return typeof val === "string"
}

function isEmpty(str) {
  return str.trim().length === 0
}

/**
 * Assign source object's properties to target.
 * If target already has properties. Updates the value.
 */
function assignOverlap(source, target) {
  Object.keys(target).forEach(function(key) {
    target[key] = source[key] || target[key]
  })
  return target
}

/**
 * Merge two config objects, if either
 * not provided, prevent error.
 */
function mergeConfig(user, _default) {
  return assignOverlap(user || {}, _default || {})
}

module.exports = {
  defined,
  isString,
  isEmpty,
  assignOverlap,
  mergeConfig
}
