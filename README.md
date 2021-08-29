# WebMin
A CSS  minifier that enables most flags by default in order to achieve the smallest
files possible, with the option to disable, rather than enable them.
<!-- A combined CSS and HTML minifier (website minifier) that enables most flags by default in order to achieve the smallest
files possible, with the option to disable, rather than enable them. -->
<!-- An opiniated minifier that combined html and css minification, enabling most flags by default  -->

<!-- HTML and CSS is linked. By minifying the in the same collective process the file size can be made smaller. -->

<!-- #### Main reasons to use:
- Smaller files than other minifiers, i.e. <a href>Uglify</a>, <a href>MinCSS</a> (even when minifying CSS standalone)
- Combines two processes html and CSS minfication into one single process/command (with options to minify each individually) -->

<!-- // add my minfiier as a webtool? give link  -->
<!-- // matelrized huge - autoamte removal, cant calc all spec - print or log what we removed? and line?
// materlizd only css -->

<!-- advertize the fact that all the boolean config variables creates high customizability? control over process? also add mixin pattern for it? -->

<!-- For use in node project: -->
<!-- ## Install
```shell
npm install WebMin --save
``` -->
<!-- it also serves as a tool that increases perfrmance. download/init AND exe sicne we remove empty sel (which must be blinked)   -->
<!-- might be unsafe because they can change the behviour of app -->

<!-- If use CSS lib. Dont used minified version. Minify using this.! -->

<!-- A minfiier for wbsites. not just css! -->

<!-- waht ppl want. waht ppl need.
smaller/betetr -->

<!-- setting some to false might dramatically decrease execution speed. -->

<!-- confi file?   -->

<!-- #Use as CLi
# Api
# can also be run as browser - host? -->

Simple use-case:
(The string must represent _valid_ CSS. The minifier cannot work with invalid CSS.)

<!-- version that reads and writes to help make clear for novice? cli must do it atleast, since cmd, file with yarg? shebang? -->
```js
var minify = require('WebMin');

var min_css = minify("body {margin: 2px;}");

console.log(min_css); // -> "body{margin:2px;}"
```

To call the minification, while overriding the default config, pass an object as the second argument:

```js
var minify = require('WebMin');

// any config passed will override the default config value
minify("body {}", {
  removeEmptySelectors: false, // will leave empty selectors untouched, normally these would be removed during minification       
})
```

Here is a list of all config options currently available, most of which
is true by default, but can be set to false.

```js
minify("body {margin: 2px;}", {
  removeSpace: true,                // removes all whitespace
  removeComments: true,             // remove all comments
  mergeDuplicateDeclarations: true, // removes overriden declarations in a selector
  useShorthandValue: true,          // converts margin: 0 0; to -> margin: 0;
  removeExcessUnits: true,          // removes the unit (px, em etc) if the number does not require it (e.g. 0px -> 0)
  smallerDeclarations: true,        // converts e.g. background-color: red; -> background: red;
  removeEmptySelectors: true,       // removes a selector if it has no declarations
  useShortestColorValue: true,      // determines if a hex value (#fff) or colorname (white) is shortest, and uses it
  replaceRgbWithHex: true,          // replaces rgb values (eg: rgb(2,3,5) or rgba(2,3,5,.5)) values with a shorter hex value instead (also inc compat?)
  prependComment: "",               // a comment that will be added at the start of the minified CSS
})
```

## Licence
MIT


<!-- removeOverridenDeclarations: true, // removes any sort of need for manually checking! the minifier can detect if something is uneccessary -->

<!-- // replace only what is safe. so never problem atleast. say which verison of CSS it follows. a full list somwhere? -->
<!-- CSS has to be legal. -->

<!-- diff install for cli and api version?   -->

<!-- # CLI
If use as cli pass the obejc tprops as flags
install globally for it?

```shell
npm install SheetMin -g
```

```shell
program cmd --useShorthandValue: true
``` -->
<!-- take from html-minfier gh? -->
