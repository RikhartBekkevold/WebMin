const treeUtil = require('../src/optimize/treeUtil.js');



// // unit.js - nodes.js - opti.js
// console.log("jdajdjadjsadj");
// console.log(treeUtil.equalSelectorPatterns(
//     [{
//       "type": "ComplexSelector",
//       "loc": {
//         "start": {
//           "line": 7,
//           "col": 0
//         },
//         "end": {
//           "line": 7,
//           "col": 6
//         }
//       },
//       "selectors": [
//         {
//           "type": "PseudoClassSelector",
//           "loc": {
//             "start": {
//               "line": 7,
//               "col": 0
//             },
//             "end": {
//               "line": 7,
//               "col": 5
//             }
//           },
//           "name": "root"
//         }
//       ],
//       "specificity": [
//         0,
//         1,
//         0
//       ]
//     }],
//   [  {
//       "type": "ComplexSelector",
//       "loc": {
//         "start": {
//           "line": 7,
//           "col": 0
//         },
//         "end": {
//           "line": 7,
//           "col": 6
//         }
//       },
//       "selectors": [
//         {
//           "type": "PseudoClassSelector",
//           "loc": {
//             "start": {
//               "line": 7,
//               "col": 0
//             },
//             "end": {
//               "line": 7,
//               "col": 5
//             }
//           },
//           "name": "root"
//         }
//       ],
//       "specificity": [
//         0,
//         1,
//         0
//       ]
//     }]
// ));



// treeUtil.sameValueExact({
//   type: "Dimension",
//   val: 10,
//   unit: "px",
// },
// {
//   type: "Number",
//   val: 10,
// })

// console.log(
// treeUtil.sameValueExact({
//   "type": "Function",
//   "name": "rgb",
//   "loc": {
//     "start": {
//       "line": 91,
//       "col": 12
//     },
//     "end": {
//       "line": 91,
//       "col": 24
//     }
//   },
//   "arguments": [
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 16
//         },
//         "end": {
//           "line": 91,
//           "col": 17
//         }
//       },
//       "val": "4",
//       "isInt": true,
//       "isEpsilon": false
//     },
//     {
//       "type": "ListSeparator",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 17
//         },
//         "end": {
//           "line": 91,
//           "col": 18
//         }
//       },
//       "val": ","
//     },
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 19
//         },
//         "end": {
//           "line": 91,
//           "col": 20
//         }
//       },
//       "val": "3",
//       "isInt": true,
//       "isEpsilon": false
//     },
//     {
//       "type": "ListSeparator",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 20
//         },
//         "end": {
//           "line": 91,
//           "col": 21
//         }
//       },
//       "val": ","
//     },
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 22
//         },
//         "end": {
//           "line": 91,
//           "col": 23
//         }
//       },
//       "val": "0",
//       "isInt": true,
//       "isEpsilon": false
//     }
//   ]
//   },
//   {
//   "type": "Function",
//   "name": "rgb",
//   "loc": {
//     "start": {
//       "line": 91,
//       "col": 12
//     },
//     "end": {
//       "line": 91,
//       "col": 24
//     }
//   },
//   "arguments": [
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 16
//         },
//         "end": {
//           "line": 91,
//           "col": 17
//         }
//       },
//       "val": "4",
//       "isInt": true,
//       "isEpsilon": false
//     },
//     {
//       "type": "ListSeparator",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 17
//         },
//         "end": {
//           "line": 91,
//           "col": 18
//         }
//       },
//       "val": ","
//     },
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 19
//         },
//         "end": {
//           "line": 91,
//           "col": 20
//         }
//       },
//       "val": "3",
//       "isInt": true,
//       "isEpsilon": false
//     },
//     {
//       "type": "ListSeparator",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 20
//         },
//         "end": {
//           "line": 91,
//           "col": 21
//         }
//       },
//       "val": ","
//     },
//     {
//       "type": "Number",
//       "loc": {
//         "start": {
//           "line": 91,
//           "col": 22
//         },
//         "end": {
//           "line": 91,
//           "col": 23
//         }
//       },
//       "val": "0",
//       "isInt": true,
//       "isEpsilon": false
//     }
//   ]
// })
// );

console.log(treeUtil.sameValueExact(    {
      "type": "Function",
      "name": "calc",
      "loc": {
        "start": {
          "line": 117,
          "col": 9
        },
        "end": {
          "line": 117,
          "col": 50
        }
      },
      "arguments": [
        {
          "type": "Dimension",
          "loc": {
            "start": {
              "line": 117,
              "col": 14
            },
            "end": {
              "line": 117,
              "col": 17
            }
          },
          "val": "100",
          "unit": "px",
          "isInt": true,
          "isEpsilon": false
        },
        {
          "type": "Operator",
          "loc": {
            "start": {
              "line": 117,
              "col": 20
            },
            "end": {
              "line": 117,
              "col": 21
            }
          },
          "val": "+"
        },
        {
          "type": "Dimension",
          "loc": {
            "start": {
              "line": 117,
              "col": 22
            },
            "end": {
              "line": 117,
              "col": 25
            }
          },
          "val": "100",
          "unit": "px",
          "isInt": true,
          "isEpsilon": false
        },
        {
          "type": "Operator",
          "loc": {
            "start": {
              "line": 117,
              "col": 28
            },
            "end": {
              "line": 117,
              "col": 29
            }
          },
          "val": "+"
        },
        {
          "type": "Dimension",
          "loc": {
            "start": {
              "line": 117,
              "col": 30
            },
            "end": {
              "line": 117,
              "col": 33
            }
          },
          "val": "600",
          "unit": "px",
          "isInt": true,
          "isEpsilon": false
        },
        {
          "type": "Operator",
          "loc": {
            "start": {
              "line": 117,
              "col": 36
            },
            "end": {
              "line": 117,
              "col": 37
            }
          },
          "val": "/"
        },
        {
          "type": "Dimension",
          "loc": {
            "start": {
              "line": 117,
              "col": 38
            },
            "end": {
              "line": 117,
              "col": 41
            }
          },
          "val": "300",
          "unit": "px",
          "isInt": true,
          "isEpsilon": false
        },
        {
          "type": "Operator",
          "loc": {
            "start": {
              "line": 117,
              "col": 45
            },
            "end": {
              "line": 117,
              "col": 45
            }
          },
          "val": "*"
        },
        {
          "type": "Dimension",
          "loc": {
            "start": {
              "line": 117,
              "col": 46
            },
            "end": {
              "line": 117,
              "col": 47
            }
          },
          "val": "2",
          "unit": "px",
          "isInt": true,
          "isEpsilon": false
        }
      ]
    },



    {
          "type": "Function",
          "name": "calc",
          "loc": {
            "start": {
              "line": 117,
              "col": 9
            },
            "end": {
              "line": 117,
              "col": 50
            }
          },
          "arguments": [
            {
              "type": "Dimension",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 14
                },
                "end": {
                  "line": 117,
                  "col": 17
                }
              },
              "val": "100",
              "unit": "px",
              "isInt": true,
              "isEpsilon": false
            },
            {
              "type": "Operator",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 20
                },
                "end": {
                  "line": 117,
                  "col": 21
                }
              },
              "val": "+"
            },
            {
              "type": "Dimension",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 22
                },
                "end": {
                  "line": 117,
                  "col": 25
                }
              },
              "val": "100",
              "unit": "px",
              "isInt": true,
              "isEpsilon": false
            },
            {
              "type": "Operator",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 28
                },
                "end": {
                  "line": 117,
                  "col": 29
                }
              },
              "val": "+"
            },
            {
              "type": "Dimension",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 30
                },
                "end": {
                  "line": 117,
                  "col": 33
                }
              },
              "val": "600",
              "unit": "px",
              "isInt": true,
              "isEpsilon": false
            },
            {
              "type": "Operator",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 36
                },
                "end": {
                  "line": 117,
                  "col": 37
                }
              },
              "val": "/"
            },
            {
              "type": "Dimension",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 38
                },
                "end": {
                  "line": 117,
                  "col": 41
                }
              },
              "val": "300",
              "unit": "px",
              "isInt": true,
              "isEpsilon": false
            },
            {
              "type": "Operator",
              "loc": {
                "start": {
                  "line": 117,
                  "col": 45
                },
                "end": {
                  "line": 117,
                  "col": 45
                }
              },
              "val": "*"
            },
            // {
            //   "type": "ListSeparator",
            //   "loc": {
            //     "start": {
            //       "line": 91,
            //       "col": 20
            //     },
            //     "end": {
            //       "line": 91,
            //       "col": 21
            //     }
            //   },
            //   "val": ","
            // },
            {
                  "type": "Function",
                  "name": "calc",
                  "arguments": [
                    {
                      "type": "Dimension",
                      "loc": {
                        "start": {
                          "line": 117,
                          "col": 14
                        },
                        "end": {
                          "line": 117,
                          "col": 17
                        }
                      },
                      "val": "100",
                      "unit": "px",
                      "isInt": true,
                      "isEpsilon": false
                    },
                    {
                      "type": "Operator",
                      "loc": {
                        "start": {
                          "line": 117,
                          "col": 20
                        },
                        "end": {
                          "line": 117,
                          "col": 21
                        }
                      },
                      "val": "+"
                    },
                    {
                      "type": "Dimension",
                      "loc": {
                        "start": {
                          "line": 117,
                          "col": 22
                        },
                        "end": {
                          "line": 117,
                          "col": 25
                        }
                      },
                      "val": "100",
                      "unit": "px",
                      "isInt": true,
                      "isEpsilon": false
                    }
                  ]
                }
                // is this handled? prints, null, 2, - need
                // compares only outer?
                // need to be fn for both nodes, before it rec?
                // check by having both have fn, where values inside is both same and not. check if get
                // need to print? nah, check bool value result

                // need css to check...?


            // {
            //   "type": "Dimension",
            //   "loc": {
            //     "start": {
            //       "line": 117,
            //       "col": 46
            //     },
            //     "end": {
            //       "line": 117,
            //       "col": 47
            //     }
            //   },
            //   "val": "2",
            //   "unit": "px",
            //   "isInt": true,
            //   "isEpsilon": false
            // }
          ]
        }));
