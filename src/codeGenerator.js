const { traverseParent } = require('./css-parser/src/traverse.js');

module.exports = function generateCode(ast, config) {
  var output      = ""
  var inKeyframe  = false
  var inMedia     = false

  var visitors = {
    Stylesheet: {
      enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr) {}
    },
    Comment: {
      enter(node, parent) {
        add(node.val)
      },
    },
    NamespaceRule: {
      enter(node) {
        add("@namespace ")
      },
      exit() {
        add(";")
      }
    },
    CounterStyleRule: {
      enter(node) {
        add("@counter-style ")
      }
    },
    ViewportRule: {
      enter(node) {
        add("@viewport")
      }
    },
    DocumentRule: {
      enter(node) {
        add("@document ")
      }
    },
    ColorProfileRule: {
      enter(node) {
        add("@color-profile ")
      }
    },
    PropertyRule: {
      enter(node) {
        add("@property ")
      }
    },
    FontFeatureValuesRule: {
      enter(node) {
        add("@font-feature-values")
      },
    },
    Feature: {
      enter(node, parent, index) {
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
    ImportRule: {
       enter(node, parent, idx, selPattern, arr, key) {
         add(node.url.type === "String" ? "@import" : "@import ")
       },
       exit(node, parent, idx) {
         add(";")
       }
    },
    CharsetRule: {
      enter(node, parent) {
        // due to charsets archaic syntax it can ONLY have the path as a
        // double quoted string, and there HAS to be a space after "@charset"
        // string visitor never adds space self, so must add here
        add(`@charset `)
      },
      exit(node, parent) {
        add(";")
      }
    },
    KeyframesRule: {
      enter(node, parent) {
        add(`@keyframes ${node.name}{`)
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
      enter(node, parent) {},
      exit(node, parent, idx) {
        if (parent.queries.indexOf(node) === parent.queries.length-1)
          add("{")
        else
          add(",")
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
    StyleRule: {
      enter(node, parent, idx) {},
      exit(node, parent) {}
    },
    SelectorPattern: {
      enter(node, parent) {},
      exit(node, parent, idx) {
        add(parent.selectors.indexOf(node) === parent.selectors.length-1 ? "" : ",")
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
    Statement: {
      enter(node, parent) {
        add(inKeyframe || inMedia ? node.property + ":" : node.property + ":")
      },
      exit(node, parent) {
        add(node.important ? "!important;" : ";")
      }
    },
    AttributeSelector: {
      enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
        var idx = parent.selectors.indexOf(node)
        var noSpace = parent.type === "ComplexSelector" || idx === 0 || parent.selectors[idx-1].type === "Combinator"
        add(noSpace ? "[" : " [")
      },
      exit(node, parent) {
        add("]")
      }
    },
    TagSelector: {
      enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
        var idx = parent.selectors.indexOf(node)
        var noSpace = parent.type === "ComplexSelector" ||
                      (idx === 0 && ancestors[ancestors.length-4].type !== "PageRule") ||
                      (idx !== 0 && parent.selectors[idx-1].type === "Combinator")
        add(noSpace ? node.name : " " + node.name)
      }
    },
    ClassSelector: {
      enter(node, parent) {    // dont add space. parse dark and dbody as one selector of type: combi - try in playground
        var idx = parent.selectors.indexOf(node)
        var noSpace = parent.type === "ComplexSelector" || idx === 0 || parent.selectors[idx-1].type === "Combinator"
        add(noSpace ? "." + node.name : " ." + node.name)
      }
    },
    IdSelector: {
      enter(node, parent, index, visitedSelectorPatterns, arr, parentArr, ancestors) {
        var idx = parent.selectors.indexOf(node)
        var noSpace = parent.type === "ComplexSelector" || idx === 0 || parent.selectors[idx-1].type === "Combinator"
        add(noSpace ? "#" + node.name : " #" + node.name)
      }
    },
    PsuedoElementSelector: {
      enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr) {
        var noSpace = parent.type === "ComplexSelector" || idx === 0 || parent.selectors[idx-1].type === "Combinator"
        add(noSpace ? "::" + node.name : " ::" + node.name)
      }
    },
    PseudoClassSelector: {
      enter(node, parent, idx, visitedSelectorPatterns, arr, parentArr, ancestors) {
        var noSpace = parent.type === "ComplexSelector" ||
                      (idx === 0 && ancestors[ancestors.length-4].type !== "PageRule") ||
                      (idx !== 0 && parent.selectors[idx-1].type === "Combinator")
        add(noSpace ? ":" + node.name : " :" + node.name)
      }
    },
    UniversalSelector: {
      enter(node, parent) {
        // even if universal is inside complex, the parent array is called selector. so we dont get lookup error.
        var idx = parent.selectors.indexOf(node)
        // check index only if NOT inside complex
        var noSpace = parent.type === "ComplexSelector" || idx === 0 || parent.selectors[idx-1].type === "Combinator"
        add(noSpace ? node.name : " " + node.name)
      }
    },
    Function: {
      enter(node, parent, index, selPattern, arr, key) {
        var noSpace = !index || parent.type === "ImportRule" || index === 0 || arr[index-1].type === "Percentage" || arr[index-1].type === "ListSeparator" || arr[index-1].type === "String"
        var space =  parent.type === "NamespaceRule" && parent.prefix ? " " : ""
        add(noSpace ? space + node.name + "(" : " " + node.name + "(")
      },
      exit(node, parent) {
        add(")")
      }
    },
    Identifier: {
      enter(node, parent, index, selPattern, arr, key) {
        // if identifier is inside a MediaFeature - and its on the left side of :
        if (parent.type === "MediaFeature" && parent.prop === node) {
          add(parent.val.type === "Identifier" ? node.name + ":" : node.name + ":")
          return
        }

        if (parent.type === "FontFeatureValuesRule") {
          if (index !== 0 && (arr[index-1].type === "ListSeparator" || arr[index-1].type === "String")) {
            add(node.name)
            return
          }
          else {
            add(" "+node.name)
            return              // return AFTER add() because we dont want to return string (coerced to true), but undefined (false) instead
          }
        }

        var noSpace = !index || index === 0 || arr[index-1].type === "Percentage" || arr[index-1].type === "ListSeparator" || arr[index-1].type === "String"
        parent.type === "Function"
          ? add(parent.type === "Value" && parent.arguments.indexOf(node) !== 0  || parent.type === "MediaRule" || parent.type === "ImportRule" ? " " + node.name : node.name)
          // default:
          : add(!noSpace || parent.type === "MediaRule" || parent.type === "ImportRule" ? " " + node.name : node.name)
          // parent.type === "Value" && parent.parts.indexOf(node) !== 0
          // do we need "url"print space? shl says so. but not sure.
      }
    },
    Dimension: {
      enter(node, parent, index, selPattern, arr, key) {
        // is 20%20 somethign diff to 20% 20?
        // !index = if no index is passed, as is the case when the node is a part of prop, and not in array, we set nospace by defualt
        var noSpace = !index || index === 0 || arr[index-1].type === "Percentage" || arr[index-1].type === "ListSeparator" || arr[index-1].type === "String"
        add(noSpace ? node.val + node.unit : " " + node.val + node.unit)
      }
    },

    Number: {
      enter(node, parent, index, selPattern, arr, key) {
        // !index becomes the way to determine if inside array. we can pass a fake num?
        var noSpace = !index || index === 0 || arr[index-1].type === "Percentage" || arr[index-1].type === "ListSeparator" || arr[index-1].type === "String"
        add(noSpace ? node.val : " " + node.val)
      }
    },
    String: {
      enter(node, parent) {
        // check that we never add space
        if (parent && parent.operator) add(parent.operator)
        add(parent.type === "ImportRule" ?
              `${node.delimiter + node.val + node.delimiter}` : // why does import need space after?

                (parent.type === "Value" ?
                    `${node.delimiter}` + node.val + `${node.delimiter}` :
                    `${node.delimiter}` + node.val + `${node.delimiter}`))
      }
    },
    ListSeparator: {
      enter() {
        add(",")
      }
    },
    Percentage: {
      enter(node, parent, index, selPattern, arr, key) {
        var noSpace = !index || index === 0 || arr[index-1].type === "Percentage" || arr[index-1].type === "ListSeparator" || arr[index-1].type === "String"
        add(noSpace ? node.val + "%" : " " + node.val + "%")
      },
    },
    Combinator: {
      enter(node, parent) {
        add(node.name)
      }
    },
    Hex: {
      enter(node, parent) {
        add("#" + node.val)
      }
    },
    Operator: {
      enter(node, parent) {
        // operator is a part of the parts array (just another value): 20px + 20px. we only add space
        // before + becasues next value in list will also add space before it, since its not the first item in the list.
        add(" " + node.val)
      }
    },
    Delimiter: {
      enter(node, parent) {
        add(node.val)
      }
    },
    ComplexSelector: {
      enter(node, parent, index, selPattern, arr, parentArr, ancestors) {
        // unless first, or "," before - complex ALWASYS inserts space before it. hence why "ab:first" did
        // if we add pagerule check, it will do next check in 0 if pagerule/not pagerule
        // first check filters so second is atleast 1. hence we avoid undefined.type error
        var noSpace = index === 0 || parent.selectors[index-1].type === "Combinator"

        // for pagerules, or any at rules, we need to add space so it wont mix with the at rule - atleast for ident. shl indicates that its ok for pclass. but not garan that it is safe.
        // in terms of pagerule checks, complex has diff checks than tag and p-class. which one is best?
        if (index === 0 && ancestors[ancestors.length-4].type === "PageRule") add(" ")
        add(noSpace ? "" : " ")
      }
    }
  }


  function add(str, noSpace) {
    output +=  str
  }


  traverseParent(ast, visitors)
  return output
}
