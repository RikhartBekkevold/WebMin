module.exports = {
  removeEmptyAtRules: true,
  prependComment: "",                   // prepends a comment either at start of file, or after charset rule
  removeSpace: true,
  removeComments: true,
  keepFirstComment: false,
  skipTrailingZero: true,
  roundColorValuesHex: false,

  mergeVariations: true,
  removeExcessUnits: true,
  shortenUnsafeHex: false,              // shorten hex values by loss of accuracy
  replaceRgbWithHex: true,              // rgb(a)(20,30,3) to #000fff
  useShortestColorValue: true,          // converts a color to the shortest of hex or colorname
  replaceColorNameWithHex: true,
  keepImportantInKeyframes: false,      // by default we remove any "!important" appearing in keyframes, since they are ignored by the browser
  removeRedundantImportant: true,
  removeExcessImportant: false,
  removeCharset: false,
  removeDeprecatedAtRules: false,       // charset? viewport (need to declared in html)?, document? - keep to still support older browsers?

  /* attempts to shorten a shorthand property (e.g. border, margin) by either re-arranging the values to require less divisional space (border:#fff solid; -> border:solid#fff;), or by removing unecessary values (margin: 20px 20px;  ->  margin: 20px;) */
  shortenShortHand: true,               // optimizeShorthand

  // removeOverridenLonghands: true, // longhand, or dupli - include dupli here?
  // mergeDuplicateDeclarations: true,
  // becasue duplicate or similar/shorthand version overrides
  removeOverridenDeclarations: true, // combine them both to this prop?

  mergeDupliSelectors: true,
  removeEmptySelectors: true,           // removes selectors that contain no declarations (or comments)


  // replace longhand declarations with shorthand
  longhandToShorthand: true,            // useSmallerDeclarations: true, useShorthandValue - background-color -> background

  mangleNames: false,
  mangleKeyframeNames: true,
  mangleWithSpecialChars: false,

  createSourceMap: true,

  resolveFunctionCalcValue: false,
  mergeMediaQueries: false,
  pathToIdOrClass: false
}
