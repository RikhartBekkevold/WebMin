const { traverseParent } = require('../parser/src/traverse.js');

module.exports = function generateCode(ast, config) {
  console.log("Generating code");
  var output      = ""
  var inKeyframe  = false
  var inMedia     = false

  var visitors = {
    QuotelessUrl: {
      enter(node, parent, index, _, siblings) {
        isImportUrl(parent) || (prevSiblingIsDelimValue(siblings, index) && !isNamespaceUrl(parent)) ?
          // import (already adds ws) or decl behind delim
          add(node.name+"("+node.val+")") :
          // namespace, decl
          add(" " + node.name+"("+node.val+")")
          // if import dont add. also want b always for import
      }
    },
    ImportRule: {
       enter(node, parent, idx, selPattern, arr, key) {
         add(node.url.type === "String" ? "@import" : "@import ")
       },
       exit(node, parent, idx) {
         add(";")
       }
    },
    FontPaletteValuesRule: {
      enter() {
        add("@font-palette-values ")
      }
    },
    FontFaceRule: {
      enter() {
        add("@font-face ")
      }
    },
    LayerRule: {
      enter() {
        add("@layer ")
      },
      exit(node) {
        if (node.rules.length === 0)
          node.hasEmptyBlock
            ? add("{}")
            : add(";")
      }
    },
    StyleRule: {
      enter(node, parent, index) {
        if ((parent.type === "LayerRule" || parent.type === "ScopeRule") && index === 0)
          add("{")
      },
      exit(node, parent, index) {
        if ((parent.type === "LayerRule" || parent.type === "ScopeRule") && index === parent.rules.length-1) {
          add("}")
          return
        }
      }
    },
    ScopeRule: {
      enter(node) {
        add("@scope")
      }
    },
    Scope: {
      enter(node, parent, idx) {
        add("(")
      },
      exit() {
        add(")")
      }
    },
    SelectorPattern: {
      exit(node, parent, idx) {
        if (!lastSelectorPattern(parent, node))
          add(",")
      }
    },
    Comment: {
      enter(node, parent) {
        add(node.val)
      },
    },
    NamespaceRule: {
      enter() {
        add("@namespace")
      },
      exit() {
        add(";")
      }
    },
    CounterStyleRule: {
      enter() {
        add("@counter-style ")
      }
    },
    ViewportRule: {
      enter() {
        add("@viewport")
      }
    },
    DocumentRule: {
      enter() {
        add("@document ")
      }
    },
    ContainerRule: {
      enter() {
        add("@container")
      }
    },
    ContainerCondition: {
      enter() {
        add("(")
      },
      exit() {
        add(")")
      }
    },
    ColorProfileRule: {
      enter() {
        add("@color-profile ")
      }
    },
    PropertyRule: {
      enter() {
        add("@property ")
      }
    },
    FontFeatureValuesRule: {
      enter() {
        add("@font-feature-values")
      },
    },
    Feature: {
      enter(node) {
        add("@"+node.name)
      }
    },
    PageRule: {
      enter(node) {
        add("@page")
      }
    },
    SupportsRule: {
      enter(node) {
        add("@supports")
      }
    },
    CharsetRule: {
      enter(node, parent) {
        // due to charsets archaic syntax it can ONLY have the path as a
        // double quoted string, and there HAS to be a space after "@charset"
        add(`@charset `)
      },
      exit(node, parent) {
        add(";")
      }
    },
    KeyframesRule: {
      enter(node, parent) {
        add(`@keyframes ${node.name.name}{`)
        inKeyframe = true
      },
      exit(node, parent) {
        add(`}`)
        inKeyframe = false
      }
    },
    MediaQueryList: {
      enter(node, parent) {
        add("@media")
        inMedia = true
      },
      exit(node, parent) {
        add("}")
        inMedia = false
      }
    },
    MediaRule: {
      exit(node, parent, idx) {
        lastMediaQuery(parent)
          ? add("{")
          : add(",")
      }
    },
    MediaFeature: {
      enter(node, parent) {
        add("(")
      },
      exit(node, parent) {
        add(")")
      }
    },
    Block: {
      enter(node, parent) {
        add("{")
      },
      exit(node, parent) {
        add("}")
      }
    },
    Declaration: {
      enter(node, parent) {
        add(inKeyframe || inMedia ? node.property + ":" : node.property + ":")
      },
      exit(node, parent) {
        add(node.important ? "!important;" : ";")
      }
    },
    TagSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = isFirstNonPageRuleSelector(ancestors, idx) ||
                      prevSiblingIsCombinator(parent, idx)
        add(node.name, !noSpace)
      }
    },
    ClassSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = !selectorIsBehindDelimiter(parent, idx)
        add("." + node.name, noSpace)
      }
    },
    IdSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = !selectorIsBehindDelimiter(parent, idx)
        add("#" + node.name, noSpace)
      }
    },
    UniversalSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = !selectorIsBehindDelimiter(parent, idx)
        add(node.name, noSpace)
      }
    },
    ComplexSelector: {
      enter(node, parent, index, selPattern, arr, parentArr, ancestors) {
        var noSpace = isFirstSelectorInPatternOrPrevSiblingIsCombinator(parent, index)

        if (isFirstSelectorAndInPageRule(ancestors, index))
          add(" ")

        add(noSpace ? "" : " ")
      }
    },
    AttributeSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = !selectorIsBehindDelimiter(parent, idx)
        add("[", noSpace)
      },
      exit(node, parent) {
        add("]")
      }
    },
    PsuedoElementSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = !selectorIsBehindDelimiter(parent, idx)
        add("::" + node.name, noSpace)
      }
    },
    PseudoClassSelector: {
      enter(node, parent, idx, a, b, c, ancestors) {
        var noSpace = isFirstNonPageRuleSelector(ancestors, idx) ||
                      prevSiblingIsCombinator(parent, idx)
        add(":" + node.name, !noSpace)
      }
    },
    NamespacePrefixSeparator: {
      enter(node) {
        // either | or |*
        add(node.val)
      }
    },
    Combinator: {
      enter(node, parent) {
        add(node.name)
      }
    },
    Function: {
      enter(node, parent, index, selPattern, siblings, key) {
        var noSpace = isImportUrl(parent) || !hasSiblings(siblings) || index === 0 || isValueEndingWithDelim(siblings[index-1])
        var space = isNamespaceUrl(parent) ? " " : ""
        add(noSpace ? space + node.name + "(" : " " + node.name + "(")
      },
      exit(node, parent) {
        add(")")
      }
    },
    // Whitespace: {
    //   enter(node) {add(node.val)}
    // },
    Identifier: {
      enter(node, parent, index, selPattern, siblings) {
        if (isScopeRuleSelector(parent)) {
          add(node.name)
          return
        }

        // if identifier is inside a MediaFeature - and its on the left side of :
        if (isMediaFeatureProperty(parent)) {
          add(parent.val.type === "Identifier" ? node.name + ":" : node.name + ":")
          // make more sense to add the : in MediaFeature: {} visitor? in it, just read both props (prop, val) and add if not null
          return
        }

        if (isAfterAtRuleKeyword(parent, index)) {
          add(" " + node.name)
          return
        }

        // path.next(), dontSkip() - for opti (diff traversers), but also so dont have to return values to tell outer fn what to do. outer fn gives the options as arg
        // path.prevSibling - have it better prepare the data it already passes. add to a single object, so not so many args with _
        // preds, what other fns -   // predicates also then better? but we never know if all parser users need them?
        // traverse obj that has fn, can set its state instead of pass path? inKeyframe etc?

        // forEach(next) - does current check if deleted element?

        // always add " "
        // when not to? see all the times we dont want too. dont detect when
        // !isImportUrl add

        if (isFontFeature(parent)) {
          let noSpace = prevSiblingIsListSepOrString(siblings, index)
          add(node.name, noSpace)
          return
        }

        if (isNamespacePrefix(parent, node)) {
          add(" " + node.name)
          return
        }

        isFunctionArgument(parent)
          ? add(parent.type === "Value" && parent.arguments.indexOf(node) !== 0  || parent.type === "MediaRule" || isImportUrl(parent) ? " " + node.name : node.name)
          : add(!prevSiblingIsDelimValue(siblings, index) || parent.type === "MediaRule" || isImportUrl(parent) ? " " + node.name : node.name)
      }
    },
    Dimension: {
      enter(node, parent, index, selPattern, siblings) {
        var noSpace = prevSiblingIsDelimValue(siblings, index)
        add(node.val + node.unit, !noSpace)
      }
    },
    Number: {
      enter(node, parent, index, selPattern, siblings) {
        var noSpace = prevSiblingIsDelimValue(siblings, index)
        add(node.val, !noSpace)
      }
    },
    String: {
      enter(node, parent) {
        if (parent && parent.operator) add(parent.operator)

        add(isImportUrl(parent) ?
              `${node.delimiter + node.val + node.delimiter}` : // why does import need space after?

                (parent.type === "Value" ?
                    `${node.delimiter}` + node.val + `${node.delimiter}` :
                    `${node.delimiter}` + node.val + `${node.delimiter}`))
      }
    },
    Percentage: {
      enter(node, parent, index, _, siblings) {
        var noSpace = prevSiblingIsDelimValue(siblings, index)
        add(node.val + "%", !noSpace)
      },
    },
    Hex: {
      enter(node, parent) {
        // check if hex in:
        // @font-palette-values --Alternate {
        // font-family: "Bungee Spice";
        // override-colors:
          // 0 #00ffbb,
          // 1 #007744;
        // }
        // needs space.
        add("#" + node.val)
      }
    },
    Operator: {
      enter(node, parent) {
        // operator is a Value. next sibling will add space after operator.
        add(" " + node.val)
      }
    },
    ListSeparator: {
      enter() {
        add(",")
      }
    },
    Unknown: {
      enter(node, parent) {
        if (node.token.type === "String")
          add(`${node.token.delimiter}` + node.token.val + `${node.token.delimiter}`, true)
        else
          add(node.token.val, true)
      }
    },
    NestingSelector: {
      enter() {
        add("&")
      }
    },
    StartingStyleRule: {
      enter(node) {
        add("@starting-style")
        if (node.rules[0].type !== "Block")
          add("{")
      },
      exit(node) {
        if (node.rules[0].type !== "Block")
          add("}")
      }
    }
  }

  function add(str, noSpace) {
    output += (noSpace ? " " + str : str)
  }

  function isValueEndingWithDelim(node) {
    // we dont consider dimension (px, rem etc) delim value. SHL and AI seem to indicate that it isnt ok to skip space between them.
    // check spec. so for now: 'margin:20px 10px;'
    return node.type === "Percentage"    ||
           node.type === "ListSeparator" ||
           node.type === "String"        ||
           node.type === "Function"      ||
           node.type === "QuotelessUrl"  ||
           node.type === "Condition"
           // mediafeature?
           // isValueDelim
  }

  function isFontPaletteValuesRuleDeclaration(parent) {
    return parent.type === "FontPaletteValuesRule"
  }

  function isScopeRuleSelector(parent) {
    return parent.type === "ScopeRule"
  }

  function prevSiblingIsDelimValue(siblings, index) {
    // have isSiblings as own check. the req to do nospace? need to set "" default? or else add(val)
    return !hasSiblings(siblings) || index === 0 || isValueEndingWithDelim(siblings[index-1])
  }

  function isAfterAtRuleKeyword(parent, index) {
    return parent.type === "ContainerRule" && index === 0  // siblingNum. siblingIdx
    // expand
  }

  // need to exclude if in PageRule here too?
  function selectorIsBehindDelimiter(node, idx) { // isSelectorDelim selectorIsAlsoDelim
     return node.type === "ComplexSelector" ||
            // check index only if not inside complex
            idx === 0 ||
            // pass siblings. node.arr. then it doesnt assume node can only be in an array called selectors
            // assume selectors if arg not set?
            node.selectors[idx-1].type === "Combinator" ||
            node.selectors[idx-1].type === "NamespacePrefixSeparator"
  }

  // firstSelectorOrBehindCombinator
  function isFirstSelectorInPatternOrPrevSiblingIsCombinator(parent, index) {
    return index === 0 || parent.selectors[index-1].type === "Combinator" || parent.selectors[index-1].type === "NamespacePrefixSeparator"
  }

  function insideComplex(parent) {
    return parent.type === "ComplexSelector"
  }

  // first in its selectorPattern, and stylerule is in pagerule
  function isFirstNonPageRuleSelector(ancestors, idx) {
    return (idx === 0 && ancestors[ancestors.length-4].type !== "PageRule")
  }

  function isFirstSelectorAndInPageRule(ancestors, idx) {
    return (idx === 0 && ancestors[ancestors.length-4].type === "PageRule")
  }

  function prevSiblingIsCombinator(parent, idx) {
    return (idx !== 0 && parent.selectors[idx-1].type === "Combinator") || parent.selectors[idx-1].type === "NamespacePrefixSeparator"
  }

  function prevSiblingIsListSepOrString(siblings, index) {
    return index !== 0 && (siblings[index-1].type === "ListSeparator" || siblings[index-1].type === "String")
  }

  function lastSelectorPattern(parent, node) {
    return parent.selectors.indexOf(node) === parent.selectors.length-1
  }

  function lastMediaQuery(parent) {
    return parent.queries.indexOf(node) === parent.queries.length-1
  }

  function isFontFeature(parent) {
    return parent.type === "FontFeatureValuesRule"
  }

  function isMediaFeatureProperty(parent) {
    return parent.type === "MediaFeature" && parent.prop === node
  }

  function isFunctionArgument(parent) {
    return parent.type === "Function"
  }

  function isImportUrl(parent) {
    return parent.type === "ImportRule"
  }

  function isNamespaceUrl(parent) {
    return parent.type === "NamespaceRule"
  }

  function isNamespacePrefix(parent, node) {
    return parent.type === "NamespaceRule" && node === parent.prefix
  }

  function hasSiblings(siblings) {
    return Array.isArray(siblings) && siblings.length > 0
  }

  traverseParent(ast, visitors)
  return output
}
