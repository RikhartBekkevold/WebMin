# CSS parser
Parses CSS into an Abstract Syntax Tree

## In
```css
span
{
  height: 100px !important;
}
```
// what can i compiule css too?

// exit and enter. vue flow.

// need them in both?
// they diff though. since only in here we are selective
// there we onyl do the ones we want to change

// passes specific node.prop - params and body
// so that we can rec/loop
// continue to check for visitors

// we dont need the transform? we just need the object with fns? and then the call itself
// visitors obj in file, then call outside. instead of passing directly as anon arg.

// the difference of calling them in row like me (visitprs and traverse(null) in node), vs wrapping them in fn then calling them in "compile" fn
// this fn calls traverse node with null, but it can be done outside! we just want it inside so
// it will happen when we call the fn itself - more logical/convinennt?
// transformer creates the new node to push too...


// if Charset do something additionally. like going into a specific prop. aka
// rec parse node/array
// we can do this because we know all the types. since we made it

// what does can diff for diff impl?

// if (node.type === "StyleRule") {
// }
// if rule found in ast, that is not here, we need a defualt way of handling it or only
// call if visitors[node.type] eixsts
// and if it has a fn - exists in visitors

// if the fn exists. after we used the naem to retrieve, if we gort fn and not ndefuned, only
// then do we try to call it

// compile my lang to a format another compiler understnads, to anothe rlang in other words.
// that way we have made a legit language. we just didnt make the code gen. we just
// transformed it to a format an existing compiler gets to help us compile. slow yes.
// otherwise we need llvm to make into machine code for us?
// point is: we made a lang ppl can write in when they install compiler. and it will
// be bundled to cpp exe files. that way we have a lang thats unqiue to write in.
// syntax vs diff contructs and concepts/paradigms. diff logic. not just cpp
// syntax in my own version feks if statements without () then i change it to add them
// before compiling in the compiler syntax

// compile to js

// make my own lang which i compile to node?


// legit, just not mc and not var lookup.

// two different reasons to compule to py/cpp feks.

// we now dont need to handle varible lookup, becaue we tok the

// can require lots of transformation if the difference is huge btween the langs
// since we might have to not only do syntax diff, but move varaible placements etc
// before we codegen to c++ (not machien direclyt)
// essentially we are doing the same thing, except skipping machine code gen (which req more steps?)

// compile to py just so can use in places with py - to allow js py development.

// lang i used to make compiler allows us to use it diff env. feks browser.


// dont throw during dev
// - is parsed as identifier. meaning: we dont parse operators at all
// parse operators and then have in this fn, add operator
// nah, need to be node, not prop on fn
// so have fn called Operator here, then add it with space around

add parsing for , inside values. add as operator in tokenizer i guess  
comma is missing inside function arguments too (and dot?)

## Out (Stringified for printing)
```json
{
  "type": "Stylesheet",
  "rules": [
    {
      "type": "StyleRule",
      "loc": {
        "start": {
          "line": 1,
          "col": 0
        },
        "end": {
          "line": 5,
          "col": 1
        }
      },
      "selectors": [
        {
          "type": "SelectorPattern",
          "loc": {
            "start": {
              "line": 2,
              "col": 0
            },
            "end": {
              "line": 3,
              "col": 1
            }
          },
          "selectors": [
            {
              "type": "TagSelector",
              "loc": {
                "start": {
                  "line": 2,
                  "col": 0
                },
                "end": {
                  "line": 2,
                  "col": 4
                }
              },
              "name": "span"
            }
          ]
        }
      ],
      "rules": {
        "type": "Block",
        "loc": {
          "start": {
            "line": 3,
            "col": 0
          },
          "end": {
            "line": 5,
            "col": 1
          }
        },
        "statements": [
          {
            "type": "Statement",
            "important": true,
            "property": "height",
            "loc": {
              "start": {
                "line": 4,
                "col": 2
              },
              "end": {
                "line": 4,
                "col": 27
              }
            },
            "value": {
              "type": "Value",
              "loc": {
                "start": {
                  "line": 4,
                  "col": 10
                },
                "end": {
                  "line": 4,
                  "col": 27
                }
              },
              "parts": [
                {
                  "type": "Dimension",
                  "loc": {
                    "start": {
                      "line": 4,
                      "col": 10
                    },
                    "end": {
                      "line": 4,
                      "col": 15
                    }
                  },
                  "val": "100",
                  "unit": "px"
                }
              ]
            }
          }
        ]
      }
    }
  ]
}                                            
```


# Install
Download, then:

```js
var parse = require('CSS-parser');
var ast = parse("#home {width: 10px;}");
```
