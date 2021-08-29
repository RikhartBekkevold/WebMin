const pp = require('./parser').Parser.prototype
const { removeComments, removeCharset, keepImportantInKeyframes }  = require('../../config.js')

pp.isStatementEnd = function() {
  return this.token.type === "punctation" && this.token.val === ";"
}

pp.isBlockStart = function() {
  return this.token.type === "punctation" && this.token.val === "{"
}

pp.isBlockEnd = function() {
  return this.token.type === "punctation" && this.token.val === "}"
}

pp.isParanStart = function(token) {
  return token
    ? token.type === "punctation" && token.val === "("
    : this.token.type === "punctation" && this.token.val === "("
}

pp.isParanEnd = function() {
  return this.token.type === "punctation" && this.token.val === ")"
}

pp.isListSeparator = function() {
  return this.token.type === "combinator" && this.token.val === ","
}

pp.isAttributeOperator = function() {
  return this.token.type === "attributeoperator"
}

pp.isID = function(token) {
  return token ? token.type === "id" : this.token.type === "id"
}

pp.isTag = function(token) {
  return token ? token.type === "ident" : this.token.type === "ident"
}

pp.isClass = function(token) {
  return token ? token.type === "class" : this.token.type === "class"
}

pp.isAttribute = function(token) {
  return token
    ? token.type === "punctation" && token.val === "["
    : this.token.type === "punctation" && this.token.val === "["
}

pp.isPseudoClass = function(token) {
  return token
    ? token.type === "punctation" && token.val === ":"
    : this.token.type === "punctation" && this.token.val === ":"
}

pp.isPseudoElement = function(token) {
  return token
    ? token.type === "punctation" && token.val === "::"
    : this.token.type === "punctation" && this.token.val === "::"
}

pp.isSelector = function(inKeyframe) {
  return (
    this.isID()             ||
    this.isTag()            ||
    this.isClass()          ||
    this.isPseudoClass()    ||
    this.isPseudoElement()  ||
    this.isAttribute()      ||
    this.isAsterisk()       ||
    this.isPercentage() && inKeyframe
  )
}

// make these two preds, into one isComplex pred (isSel && isSel(peek))
pp.isComplex = function() {
  return (
    this.isTag(this.peek())            ||
    this.isID(this.peek())             ||
    this.isClass(this.peek())          ||
    this.isPseudoClass(this.peek())    ||
    this.isPseudoElement(this.peek())  ||
    this.isAttribute(this.peek())
    // can have several * in row, but is it legal? dont make sense so probably not
    // this.isAsterisk(this.peek()) && next is one of these        || // msut allow these to trigger, since both can be first, but only first (so not allowed in loop)
    // an universal token can only be a trigger for a complex, not in middle or at end. so it can trigger this pred call. but we
    // shouldnt allow it / check for it. this dont care what triggers it.
  )
}

pp.isAsterisk = function(token) {
  return token ? token.type === "asterisk" : this.token.type === "asterisk"
}

pp.isImportant = function() {
  return this.token.type === "punctation" && this.token.val === "!" // && isIdent(this.peek()) && this.peek().val === "important"
}

pp.shouldKeepImportant = function(inKeyframe) {
  return ((inKeyframe && keepImportantInKeyframes) || !inKeyframe)
}

pp.isCombinator = function() {
  return this.token.type === "combinator"
}

pp.isIdent = function(token) {
  return token ? token.type === "ident" : this.token.type === "ident"
}

pp.isStatementStart = function() {
  return this.isIdent()
}

pp.isFunction = function(token) {
  return token ? this.isParanStart(token) : this.isParanStart()
}

pp.isHex = function() {
  return this.isID()
}

pp.isString = function() {
  return this.token.type === "string"
}

pp.isOperator = function() {
  return this.token.type === "operator" // || this.isAsterisk()
}

pp.isComment = function() {
  return !removeComments && this.token.type === "comment"
}

pp.isNum = function() {
  return this.token.type === "num"
}

pp.isPercentage = function() {
  return this.token.type == "Percentage"
}

pp.isDimension = function() {
  return this.token.type === "Dimension"
}

pp.isNumericValue = function() {
  return this.isNum() || this.isDimension() || this.isPercentage()
}

pp.isDelim = function() {
  return this.token.type === "delim"
}

pp.isWhitespace = function(token) {
  return token ? token.type === "whitespace" : this.token.type === "whitespace"
}

pp.isMediaQuery = function() {
  return this.token.type === "@" && this.token.val === "media"
}

pp.isKeyframes = function() {
  return this.token.type === "@" && (this.token.val === "keyframes" || this.token.val === "-webkit-keyframes")
}

pp.isNamespace = function() {
  return this.token.type === "@" && this.token.val === "namespace"
}

pp.isImportRule = function() {
  return this.token.type === "@" && this.token.val === "import"
}

pp.isCharsetRule = function() {
  return !removeCharset && this.token.type === "@" && this.token.val === "charset"
}

pp.isFontface = function() {
  return this.token.type === "@" && this.token.val === "font-face"
}

pp.isPropertyRule = function () {
  return this.token.type === "@" && this.token.val === "property"
}

pp.isColorProfileRule = function () {
  return this.token.type === "@" && this.token.val === "color-profile"
}

pp.isCounterStyleRule = function () {
  return this.token.type === "@" && this.token.val === "counter-style"
}

pp.isDocumentRule = function () {
  return this.token.type === "@" && this.token.val === "document"
}

pp.isViewportRule = function () {
  return this.token.type === "@" && this.token.val === "viewport"
}

pp.isFontFeatureValues = function() {
  return this.token.type === "@" && this.token.val === "font-feature-values"
}

pp.isPageRule = function() {
  return this.token.type === "@" && this.token.val === "page"
}

pp.isSupportsRule = function() {
  return this.token.type === "@" && this.token.val === "supports"
}
