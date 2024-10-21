const pp = require('./parser').Parser.prototype
const { removeCharset, keepImportantInKeyframes }  = require('../../config.js')
const tokens = require('./tokens.js')

pp.isDeclarationEnd = function() {
  return this.token.type === tokens.punctation && this.token.val === ";"
}

pp.isBlockStart = function() {
  return this.token.type === tokens.punctation && this.token.val === "{"
}

pp.isBlockEnd = function() {
  return this.token.type === tokens.punctation && this.token.val === "}"
}

pp.isParanStart = function(token) {
  return token
    ? token.type === tokens.punctation && token.val === "("
    : this.token.type === tokens.punctation && this.token.val === "("
}

pp.isCondition = function() {
  return this.isParanStart()
}

pp.isParanEnd = function() {
  return this.token.type === tokens.punctation && this.token.val === ")"
}

pp.isNestingSelector = function() {
  return this.token.type === tokens.punctation && this.token.val === "&"
}

pp.isListSeparator = function() {
  return this.token.type === tokens.combinator && this.token.val === ","
}

pp.isAttributeOperator = function() {
  return this.token.type === tokens.attributeOperator
}

pp.isNamespacePrefixSeparator = function() {
  return this.isAttributeOperator() && (this.token.val === "|" || this.token.val === "|*")
}

pp.isID = function(token) {
  return token ? token.type === tokens.id : this.token.type === tokens.id // this,isIdent
}

pp.isTag = function(token) {
  return token ? token.type === tokens.ident : this.token.type === tokens.ident
}

pp.isClass = function(token) {
  return token ? token.type === tokens.class : this.token.type === tokens.class
}

pp.isAttribute = function(token) {
  return token
    ? token.type === tokens.punctation && token.val === "["
    : this.token.type === tokens.punctation && this.token.val === "["
}

pp.isPseudoClass = function(token) {
  return token
    ? token.type === tokens.punctation && token.val === ":"
    : this.token.type === tokens.punctation && this.token.val === ":"
}

pp.isPseudoElement = function(token) {
  return token
    ? token.type === tokens.punctation && token.val === "::"
    : this.token.type === tokens.punctation && this.token.val === "::"
}

pp.isSelector = function(inKeyframe) {
  return (
    this.isID()              ||
    this.isTag()             ||
    this.isClass()           ||
    this.isPseudoClass()     ||
    this.isPseudoElement()   ||
    this.isAttribute()       ||
    this.isAsterisk()        ||
    this.isNestingSelector() ||
    this.isPercentage() && inKeyframe
  )
}

// make these two preds, into one isComplex pred (isSel && isSel(peek))
pp.isComplex = function() {
  // console.log(this.token);
  // console.log(this.peek());
  return (
    this.isTag(this.peek())            ||
    this.isID(this.peek())             ||
    this.isClass(this.peek())          ||
    this.isPseudoClass(this.peek())    ||
    this.isPseudoElement(this.peek())  ||
    this.isAttribute(this.peek())
    // || this.isNestingSelector(this.peek())
    // parseCombinator?
  )
}

// exlude * that isnt followed by tag - want to see asterisk as universal. but why is specifically if tag after complex?
// isNonUniversalComplex
// *body || *body
pp.isNonAsterisksComplex = function(isKeyframe) {
  return (this.isSelector(isKeyframe) && this.isComplex()) || (this.isAsterisk() && this.isTag(this.peek()))
}

pp.isAsterisk = function(token) {
  return token ? token.type === tokens.asterisk : this.token.type === tokens.asterisk
}

pp.isImportant = function() {
  return this.token.type === tokens.punctation && this.token.val === "!" // && isIdent(this.peek()) && this.peek().val === "important"
}

pp.shouldKeepImportant = function(inKeyframe) {
  return ((inKeyframe && keepImportantInKeyframes) || !inKeyframe)
}

pp.isCombinator = function() {
  return this.token.type === tokens.combinator
}

pp.isIdent = function(token) {
  return token ? token.type === tokens.ident : this.token.type === tokens.ident
}

pp.isDeclarationStart = function() {
  return this.isIdent()
}

pp.isFunction = function(token) {
  return token ? this.isParanStart(token) : this.isParanStart()
}

pp.isUrl = function() {
  return this.token.type === tokens.url
}

pp.isHex = function() {
  return this.isID()
}

pp.isString = function() {
  return this.token.type === tokens.string
}

pp.isOperator = function() {
  return this.token.type === tokens.operator // || this.isAsterisk(), combinator
}

pp.isComment = function() {
  return this.token.type === tokens.comment
}

pp.isWhitespace = function(token) {
  return token ? token.type === tokens.whitespace : this.token.type === tokens.whitespace
}

pp.isNum = function() {
  return this.token.type === tokens.number
}

pp.isPercentage = function() {
  return this.token.type == tokens.percentage
}

pp.isDimension = function() {
  return this.token.type === tokens.dimension
}

pp.isNumericValue = function() {
  return this.isNum() || this.isDimension() || this.isPercentage()
}

pp.isDelim = function() {
  return this.token.type === tokens.delim
}

pp.isMediaQuery = function() {
  return this.token.type === tokens.atRule && this.token.val === "media"
}

pp.isKeyframes = function() {
  return this.token.type === tokens.atRule && (this.token.val === "keyframes" || this.token.val === "-webkit-keyframes")
}

pp.isNamespace = function() {
  return this.token.type === tokens.atRule && this.token.val === "namespace"
}

pp.isImportRule = function() {
  return this.token.type === tokens.atRule && this.token.val === "import"
}

pp.isCharsetRule = function() {
  return !removeCharset && this.token.type === tokens.atRule && this.token.val === "charset"
}

pp.isFontface = function() {
  return this.token.type === tokens.atRule && this.token.val === "font-face"
}

pp.isLayerRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "layer"
}
// dont visually confirm, have test that make sure string is exactly same, with same space etc
pp.isFontPaletteValues = function () {
  return this.token.type === tokens.atRule && this.token.val === "font-palette-values"
}

pp.isPropertyRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "property"
}

pp.isScopeRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "scope"
}

pp.isColorProfileRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "color-profile"
}

pp.isCounterStyleRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "counter-style"
}

pp.isDocumentRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "document"
}

pp.isViewportRule = function () {
  return this.token.type === tokens.atRule && this.token.val === "viewport"
}

pp.isFontFeatureValues = function() {
  return this.token.type === tokens.atRule && this.token.val === "font-feature-values"
}

pp.isPageRule = function() {
  return this.token.type === tokens.atRule && this.token.val === "page"
}

pp.isContainerRule = function() {
  return this.token.type === tokens.atRule && this.token.val === "container"
}

pp.isSupportsRule = function() {
  return this.token.type === tokens.atRule && this.token.val === "supports"
}

pp.isStartingStyleRule = function() {
  return this.token.type === tokens.atRule && this.token.val === "starting-style"
}
