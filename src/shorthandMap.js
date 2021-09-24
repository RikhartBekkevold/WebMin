module.exports = Object.assign(Object.create(null), { // removes the need to use hasOwnProperty when working with the object.
  margin: { // add type so dont need preds to categorize - or just loop each one - know we can check
    order: {
      "margin-top": 0,
      "margin-right": 1,
      "margin-bottom": 2,
      "margin-left": 3
    },
    subProperties: [
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left"
    ]
  },

  padding: {
    order: {
      "padding-top": 0,
      "padding-right": 1,
      "padding-bottom": 2,
      "padding-left": 3
    },
    subProperties: [
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left"
    ]
  },

  "border-radius": {
    order: {
      "border-top-left-radius": 0,
      "border-top-right-radius": 1,
      "border-bottom-right-radius": 2,
      "border-bottom-left-radius": 3
    },
    subProperties: [
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius"
    ]
  },


  border: {
    order: {
      "border-color": 0,
      "border-width": 1,
      "border-style": 2
    },
    subProperties: [
      "border-color",
      "border-width",
      "border-style"
    ]
  },

  background: {
    order: {
      "background-attachment": 0,
      "background-clip": 1,
      "background-color": 2,
      "background-image": 3,
      "background-origin": 4,
      "background-position": 5,
      "background-size": 6,
      "background-repeat": 7
    },
    subProperties: [
      "background-attachment",
      "background-clip",
      "background-color",
      "background-image",
      "background-origin",
      "background-position",
      "background-size",
      "background-repeat"
    ]
  },

  // for what method might it not be shorter? and how to test if shorter?


  // if longhands used. Layers cannot exists?

  // if bg and bg size must also positon

  // is border types, that isnt border, safe for simply using a pushing method in first if?
  // how do we solve font problem if longhands not covered by sh, which gets default values by sh? check for all, move below. have if (font) inside the algo?

  // we dont need to find or care what order we find in? since we loop all, but use index?
  // pushign to border works even if border already exists, just dont work...  - adding to border type, when border SH already eixsts?
  // bottom line. it isnt safe to add more values in anim/background by simply pushing. need to use index too? but not expand, just
  // add by index. if index exists in array. "in". and value is the index we replace/splice. if its higher, we push? those two operations?
  //
  // added option to convert longhand properties to shorthand (for those props i'm certain is safe for now) and added option to shorten shorthand properties

  // add shorthand optimization and conversion of longhand properties to shorthand (for those props i'm certain is safe for now)



  // we cant have many longhands, can only have LAYERS with shorthand? so if longhand
  // prev sh defined layers might mess things up?

  // some of these values can be a list? eg font family? no..

  // due to there being longhand props that can not set by this shorthand we can never
  // if all is set inside, then we just need to keep the other, nah, but we can move after?
  // so: detect ALL, then make shorthand, then move the extra after?

  // rearrange order
  // move longhand after - need to have a if check for font?

  // if shorthand already - we assume shorthand correct - has border type values, we cant just push? since might have delay
  // and we want to push time, will reverse the meaning intepreted by CSS

  // we need to add / in shorthand codegen? if lineheight is set?
  font: {
    order: {
      "font-family": 0,
      "font-size": 1,
      "font-stretch": 2,
      "font-style": 3,
      "font-variant": 4,
      "font-weight": 5,
      "line-height": 6
    },
    subProperties: [
      "font-family",
      "font-size",
      "font-stretch",
      "font-style",
      "font-variant",
      "font-weight",
      "line-height"
    ]
  },

  animation: {
    order: {
      "animation-duration": 0,
      "animation-delay": 1,
      "animation-direction": 2,
      "animation-fill-mode": 3,
      "animation-iteration-count": 4,
      "animation-name": 5,
      "animation-play-state": 6,
      "animation-timing-function": 7
    },
    subProperties: [
      "animation-duration",
      "animation-delay",
      "animation-direction",
      "animation-fill-mode",
      "animation-iteration-count",
      "animation-name",
      "animation-play-state",
      "animation-timing-function"
    ]
  }

})
