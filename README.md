# WebMin
<!-- A CSS minifier that enables most flags by default, in order to achieve the smallest
files possible, with the option to disable, rather than enable them. Can be used as CLI or API. -->

A CSS minifier. Can be used as CLI or API.

<!-- The files passed to cli or api is assumed to represent all relevant CSS files. If multiple files passed they will be concatenated.
The order of passing is the order of concatenation (the second is appended to the first etc). The output will be a single
CSS file in the output folder specified (or working directory if none specified), unless the option split is set.. the indivdual.. parse?
minifySeparately -->

<!-- For api in addition to filepath, one can also pass a string.
If name of directory passed, order can be random. So read the directory files, and order the files before before calling. -->

<!-- When to use
websiute version
as part of lib for css mod, when have html and js
cli
standalone in lib/api, as api -->
<!-- output can be wrong if css is wrong. use a linter first if need garantee correct output. -->

<!-- # Install
Download repo. -->

# API
Pass a string or filepaths.
Simple use-case:

<!-- version that reads and writes to help make clear for novice? cli must do it atleast, since cmd, file with yarg? shebang? -->
```js


var minify = require('WebMin');
var min_css = minify(
  `
    body {
      margin: 2px;
    }
    div {
      height: 20%;
    }
  `
);
console.log(min_css);
// "body{margin:2px;}div{height: 20%}"
```

Take note that the string must represent _valid_ CSS. The minifier _cannot_ work with invalid CSS.

You can customize the minification process by overriding many of the default config variables used
during the process, to do so pass an object as the second argument:

```js
var minify = require('WebMin');

// any config passed will override the default config
var min_css = minify("body {}", {
  // will leave empty selectors untouched,
  // normally these would be removed during minification
  removeEmptySelectors: false
})

console.log(min_css); // -> "body{}"
```

Here is a list of all config options currently available and their default values:

```js
minify("body {margin: 2px;}", {
  removeEmptyAtRules: true,
  prependComment: "",                  
  removeSpace: true,
  removeComments: true,
  skipTrailingZero: true,
  removeExcessUnits: true,
  shortenUnsafeHex: false,              
  replaceRgbWithHex: true,              
  useShortestColorValue: true,          
  replaceColorNameWithHex: true,
  keepImportantInKeyframes: false,      
  removeRedundantImportant: true,
  removeExcessImportant: false,
  removeCharset: false,
  removeDeprecatedAtRules: false,      
  shortenShortHand: true,              
  removeOverridenDeclarations: true,
  mergeDupliSelectors: true,
  removeEmptySelectors: true,           
  longhandToShorthand: false,          
  mangleKeyframeNames: true,
  mangleNames: false,
  keepFirstComment: false,
  roundColorValuesHex: false
})
```
<!-- // set to true by defualt if use combined minification
// when html or only css minfiier choosen - mangle this flag is set to false -->

# CLI
Run to minify:

```shell
webmin -i style.css media.css alt_style.css -o ./css/min.css
```

<code>-i</code>
  Input files. Can also skip the -i flag.

<code>-o</code>
  Output file. specific "/dir/file.js" for dir.

<code>-c</code>
  Config variables passed to minification process (make shell). Cant also make a webmin.config.js file in root.

Additionally you can print extra info:
<code>--help</code>
  Lists all options.

<!-- # Notes on name mangling -->
<!-- // Mangling names depends on values outside CSS.
// There are two options. Mangle e.g. html and pass the values to be used in the CSS process.
// Or let CSS minifier mangle and return a map of the old and new names by setting the various options mangle
// properties. -->
<!-- ## What is mangling
The minifier can mangle names, meaning change the name to a shorter version. E.g.

```stylesheet
.card -> .a
```

to make the files smaller. Custom properties (variables), keyframes and namespaces can be mangled.

## Notes on selector, variable, namespaces and keyframes name mangling
Name mangling is disabled by default. Mangling is not safe with CSS as input alone, since the names is referenced in both HTML and JS outside of the CSS input.

You can enable name mangling with mangleNames set to true. Together with the minified CSS a map of the old and new names of selector will then be returned.

If you would rather pass the names to the minifier so it can use them when mangling, e.g. if you have already mangled the names yourself in HTML/JS. You can tell it to do so by assigning an object to config.useNames, on this form: -->

<!-- ```js
config.useNames = {
  selector|variable|keyframe|namespaces: {
    oldname: newname,
    oldname: newname
  }
}
``` -->

<!-- If flag set. The minfier can mangle names to a shorter version (.class-> .a). This is disabled by default. The selector names are referenced in both HTML and CSS and it is therefore only safe to enable this feature (set mangleNames to true), if you as the caller, know that it is safe.  

Setting this config option to true will also return a map with the old and new names. This can then be used to apply the new names in CSS and JS. -->

<!-- ## Notes on variable resolution
In addition to mangling, variables names can be resolved to their values instead. If resolveVariables is set to true, it will take precedence over mangling. By default this is disabled because variables can be declared outside of CSS in JS. The JS variable have higher priority than the CSS declared variable. This means that the minifier does not know if its safe to resolve a value. Enable this flag only if you know that this is not the case and that all variables is declared in the CSS input you provide.      -->

## Licence
<a href="https://github.com/RikhartBekkevold/WebMin/blob/main/LICENSE.md">MIT</a>

<!-- # TODO:
Cookbook
HTML test frameworks
Examples -->
