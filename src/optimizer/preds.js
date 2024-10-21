/**
 * rgba is legacy. modern css
 * implementations converts rgba to rgb.
 */
function isRGB(node) {
  return ["rgb", "rgba"].includes(node.name.toLowerCase())
}

/**
 * True for any declaration value
 * that is not a custom property.
 */
function isPlainDeclarationValue(parent, grandparent) {
  return (
    grandparent && grandparent.type === "Declaration"
    && parent && parent.type === "Value"
    && !isCustomProperty(grandparent)
  )
}

function isCustomProperty(declaration) {
  return declaration.property.startsWith("--")
}

function isVariableRef(fn) {
  return fn.name.toLowerCase() === "var"
}

function isUrl(fn) {
  return fn.name.toLowerCase() === "url"
}

function isBinaryCalcFunction(fn) {
  return fn.name === "calc" && fn.arguments.length > 1
}

function isInterchangableStringAndUrlContext(parent) {
  return parent.url && (parent.type === "NamespaceRule" || parent.type === "ImportRule")
}

function isAnimationNamePermissibleProperty(decl) {
  return decl.property === "animation" || decl.property === "animation-name"
}

/**
 * Is empty if has no own enumerable stringed keys.
 */
function isEmpty(val) {
  return typeof val === "object" && val !== null && Object.keys(val)
}

function isOrderDependantShorthandProp(property) {
  return property === "margin"
    || property === "padding"
    || property === "border-radius"
}

function isDatatypeDependantShorthandProp(property) {
  return property === "border"
    || property === "background"
    || property === "font"
}

module.exports = {
  isRGB,
  isPlainDeclarationValue,
  isCustomProperty,
  isVariableRef,
  isUrl,
  isBinaryCalcFunction,
  isInterchangableStringAndUrlContext,
  isAnimationNamePermissibleProperty,
  isEmpty,
  isOrderDependantShorthandProp,
  isDatatypeDependantShorthandProp
}
