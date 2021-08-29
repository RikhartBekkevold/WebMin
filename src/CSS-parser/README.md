# CSS parser
Parses CSS into an Abstract Syntax Tree

## In
```css
span
{
  height: 100px !important;
}
```

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
