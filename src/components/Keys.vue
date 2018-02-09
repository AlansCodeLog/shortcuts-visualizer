<template>
   <div :class="[{keyboard: true}, theme_dark ? 'background-dark' : 'background-light']">
      <div class="options">
         <input id="button-theme" type="checkbox" v-model="theme_dark"/>
         <label for="button-theme">Dark/White Theme</label>
      </div>
      <div :class="['key-row', row.length == 0 ? 'empty-row': '']" v-for="(row, rindex) of layout" :key="rindex" :id="'key-row' + rindex">
         <div v-if="keys[key]" v-for="(key, index) of row" :key="index" :id=[key] :class="[keys[key].classes, pressed[keys[key].identifier] === true ? 'pressed' : '']">
            <div :class="[keys[key].classes.indexOf('flexspace') !== -1 || keys[key].classes.indexOf('blank') !== -1 ? '' : 'dec']">
               <div v-if="keys[key] && keys[key].classes.indexOf('blank') == -1" :class="[{label: true}, keys[key].label.classes]">{{keys[key].label.text}}</div>
            </div>
         </div>
      </div>
      <div>{{pressed}}</div>
   </div>
</template>

<script>
export default {
   name: 'Keys',
   data () {
      return {
         theme_dark: true,
         layout: [
            ["escape", "spacer", "f1", "f2", "f3", "f4", "spacer", "f5", "f6", "f7", "f8", "spacer", "f9", "f10", "f11", "f12", "flexspace", "printscreen", "scrolllock", "pausebreak", "flexspace", "blank", "blank", "blank", "blank"],
            [],
            ["tild", "num1", "num2", "num3", "num4", "num5", "num6", "num7", "num8", "num9", "num0", "minus", "plus", "backspace", "flexspace", "insert", "home", "pageup", "flexspace", "numlock","numpaddivide", "numpadmultiply", "numpadminus"],
            ["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "leftbracket", "rightbracket", "pipe", "flexspace","delete", "end", "pagedown", "flexspace", "numpad7", "numpad8", "numpad9", "numpadplus"],
            ["capslock", "a", "s", "d", "f", "g", "h", "j", "k", "l", "colon", "quotationmark", "enter", "flexspace", "blank", "blank", "blank", "flexspace", "numpad4", "numpad5", "numpad6", "blank",],
            ["Lshift", "z", "x", "c", "v", "b", "n", "m", "lessthan", "greaterthan", "questionmark", "Rshift", "flexspace", "blank", "arrowup", "blank", "flexspace", "numpad1", "numpad2", "numpad3", "numpadenter"],
            ["control", "super", "alt", "space", "alt", "meta", "super", "control", "flexspace", "arrowleft", "arrowdown", "arrowright", "flexspace", "numpad0", "numpaddel", "blank",]
         ],
         keys: {
            a: {
               classes:["key"],
               label: {
                  text: "A",
                  classes: []
               }
            },
            b: {
               classes:["key"],
               label: {
                  text: "B",
                  classes: []
               }
            },
            c: {
               classes:["key"],
               label: {
                  text: "C",
                  classes: []
               }
            },
            d: {
               classes:["key"],
               label: {
                  text: "D",
                  classes: []
               }
            },
            e: {
               classes:["key"],
               label: {
                  text: "E",
                  classes: []
               }
            },
            f: {
               classes:["key"],
               label: {
                  text: "F",
                  classes: []
               }
            },
            g: {
               classes:["key"],
               label: {
                  text: "G",
                  classes: []
               }
            },
            h: {
               classes:["key"],
               label: {
                  text: "H",
                  classes: []
               }
            },
            i: {
               classes:["key"],
               label: {
                  text: "I",
                  classes: []
               }
            },
            j: {
               classes:["key"],
               label: {
                  text: "J",
                  classes: []
               }
            },
            k: {
               classes:["key"],
               label: {
                  text: "K",
                  classes: []
               }
            },
            l: {
               classes:["key"],
               label: {
                  text: "L",
                  classes: []
               }
            },
            m: {
               classes:["key"],
               label: {
                  text: "M",
                  classes: []
               }
            },
            n: {
               classes:["key"],
               label: {
                  text: "N",
                  classes: []
               }
            },
            o: {
               classes:["key"],
               label: {
                  text: "O",
                  classes: []
               }
            },
            p: {
               classes:["key"],
               label: {
                  text: "P",
                  classes: []
               }
            },
            q: {
               classes:["key"],
               label: {
                  text: "Q",
                  classes: []
               }
            },
            r: {
               classes:["key"],
               label: {
                  text: "R",
                  classes: []
               }
            },
            s: {
               classes:["key"],
               label: {
                  text: "S",
                  classes: []
               }
            },
            t: {
               classes:["key"],
               label: {
                  text: "T",
                  classes: []
               }
            },
            u: {
               classes:["key"],
               label: {
                  text: "U",
                  classes: []
               }
            },
            v: {
               classes:["key"],
               label: {
                  text: "V",
                  classes: []
               }
            },
            w: {
               classes:["key"],
               label: {
                  text: "W",
                  classes: []
               }
            },
            x: {
               classes:["key"],
               label: {
                  text: "X",
                  classes: []
               }
            },
            y: {
               classes:["key"],
               label: {
                  text: "Y",
                  classes: []
               }
            },
            z: {
               classes:["key"],
               label: {
                  text: "Z",
                  classes: []
               }
            },
            tild: {
               classes:["key"],
               label: {
                  text: "`",
                  classes: []
               }
            },
            greaterthan: {
               classes:["key"],
               label: {
                  text: ">",
                  classes: []
               }
            },
            lessthan: {
               classes:["key"],
               label: {
                  text: "<",
                  classes: []
               }
            },
            questionmark: {
               classes:["key"],
               label: {
                  text: "?",
                  classes: []
               }
            },
            quotationmark: {
               classes:["key"],
               label: {
                  text: "\"",
                  classes: []
               }
            },
            pipe: {
               classes:["key", "small"],
               label: {
                  text: "|",
                  classes: []
               }
            },
            rightbracket: {
               classes:["key"],
               label: {
                  text: "}",
                  classes: []
               }
            },
            leftbracket: {
               classes:["key"],
               label: {
                  text: "{",
                  classes: []
               }
            },
            colon: {
               classes:["key"],
               label: {
                  text: ":",
                  classes: []
               }
            },
            num1: {
               classes:["key"],
               label: {
                  text: "1",
                  classes: []
               }
            },
            num2: {
               classes:["key"],
               label: {
                  text: "2",
                  classes: []
               }
            },
            num3: {
               classes:["key"],
               label: {
                  text: "3",
                  classes: []
               }
            },
            num4: {
               classes:["key"],
               label: {
                  text: "4",
                  classes: []
               }
            },
            num5: {
               classes:["key"],
               label: {
                  text: "5",
                  classes: []
               }
            },
            num6: {
               classes:["key"],
               label: {
                  text: "6",
                  classes: []
               }
            },
            num7: {
               classes:["key"],
               label: {
                  text: "7",
                  classes: []
               }
            },
            num8: {
               classes:["key"],
               label: {
                  text: "8",
                  classes: []
               }
            },
            num9: {
               classes:["key"],
               label: {
                  text: "9",
                  classes: []
               }
            },
            num0: {
               classes:["key"],
               label: {
                  text: "0",
                  classes: []
               }
            },
            minus: {
               classes:["key"],
               label: {
                  text: "-",
                  classes: []
               }
            },
            plus: {
               classes:["key"],
               label: {
                  text: "+",
                  classes: []
               }
            },
            backspace: {
               classes:["key", "medium"],
               label: {
                  text: "Backspace",
                  classes: []
               }
            },
            insert: {
               classes:["key"],
               label: {
                  text: "Insert",
                  classes: ["shrink"]
               }
            },
            home: {
               classes:["key"],
               label: {
                  text: "Home",
                  classes: ["shrink"]
               }
            },
            pageup: {
               classes:["key"],
               label: {
                  text: "Page Up",
                  classes: ["shrink"]
               }
            },
            pagedown: {
               classes:["key"],
               label: {
                  text: "Page Down",
                  classes: ["shrink"]
               }
            },
            numlock: {
               classes:["key"],
               label: {
                  text: "Num Lock",
                  classes: []
               }
            },
            numpad1: {
               classes:["key"],
               label: {
                  text: "1",
                  classes: []
               }
            },
            numpad2: {
               classes:["key"],
               label: {
                  text: "2",
                  classes: []
               }
            },
            numpad3: {
               classes:["key"],
               label: {
                  text: "3",
                  classes: []
               }
            },
            numpad4: {
               classes:["key"],
               label: {
                  text: "4",
                  classes: []
               }
            },
            numpad5: {
               classes:["key"],
               label: {
                  text: "5",
                  classes: []
               }
            },
            numpad6: {
               classes:["key"],
               label: {
                  text: "6",
                  classes: []
               }
            },
            numpad7: {
               classes:["key"],
               label: {
                  text: "7",
                  classes: []
               }
            },
            numpad8: {
               classes:["key"],
               label: {
                  text: "8",
                  classes: []
               }
            },
            numpad9: {
               classes:["key"],
               label: {
                  text: "9",
                  classes: []
               }
            },
            numpad0: {
               classes:["key", "medium"],
               label: {
                  text: "0",
                  classes: []
               }
            },
            numpaddel: {
               classes:["key"],
               label: {
                  text: "Del",
                  classes: []
               }
            },
            numpadenter: {
               classes:["key", "vertical"],
               label: {
                  text: "Enter",
                  classes: []
               }
            },
            numpaddivide: {
               classes:["key"],
               label: {
                  text: "/",
                  classes: []
               }
            },
            numpadmultiply: {
               classes:["key"],
               label: {
                  text: "*",
                  classes: []
               }
            },
            numpadplus: {
               classes:["key", "vertical"],
               label: {
                  text: "+",
                  classes: []
               }
            },
            numpadminus: {
               classes:["key"],
               label: {
                  text: "-",
                  classes: []
               }
            },
            control: {
               identifier: "ctrlKey",
               classes:["key", "modifiers"],
               label: {
                  text: "Ctrl",
                  classes: []
               }
            },
            meta: {
               identifier: "metaKey",
               classes:["key", "modifiers"],
               label: {
                  text: "Meta",
                  classes: []
               }
            },
            super: {
               identifier: "osKey",
               classes:["key", "modifiers"],
               label: {
                  text: "Super",
                  classes: []
               }
            },
            Rshift: {
               identifier: "shiftKey",
               classes:["key", "huge"],
               label: {
                  text: "Shift",
                  classes: []
               }
            },
            Lshift: {
               identifier: "shiftKey",
               classes:["key", "medium-large"],
               label: {
                  text: "Shift",
                  classes: []
               }
            },
            alt: {
               identifier: "altKey",
               classes:["key", "modifiers"],
               label: {
                  text: "Alt",
                  classes: []
               }
            },
            enter: {
               classes:["key", "medium-large"],
               label: {
                  text: "Enter",
                  classes: []
               }
            },
            end: {
               classes:["key"],
               label: {
                  text: "End",
                  classes: ["shrink"]
               }
            },
            delete: {
               classes:["key"],
               label: {
                  text: "Del",
                  classes: ["shrink"]
               }
            },
            space: {
               classes:["key", "space"],
               label: {
                  text: "",
               }
            },
            tab: {
               classes:["key", "small"],
               label: {
                  text: "Tab",
               }
            },
            capslock: {
               classes:["key", "medium-small"],
               label: {
                  text: "Capslock",
               }
            },
            arrowleft: {
               classes:["key"],
               label: {
                  text: "Left",
                  classes: []
               }
            },
            arrowdown: {
               classes:["key"],
               label: {
                  text: "Down",
                  classes: []
               }
            },
            arrowright: {
               classes:["key"],
               label: {
                  text: "Right",
                  classes: []
               }
            },
            arrowup: {
               classes:["key"],
               label: {
                  text: "Up",
                  classes: []
               }
            },
            escape: {
               classes:["key"],
               label: {
                  text: "Esc",
                  classes: []
               }
            },
            f1: {
               classes:["key"],
               label: {
                  text: "F1",
                  classes: []
               }
            },
            f2: {
               classes:["key"],
               label: {
                  text: "F2",
                  classes: []
               }
            },
            f3: {
               classes:["key"],
               label: {
                  text: "F3",
                  classes: []
               }
            },
            f4: {
               classes:["key"],
               label: {
                  text: "F4",
                  classes: []
               }
            },
            f5: {
               classes:["key"],
               label: {
                  text: "F5",
                  classes: []
               }
            },
            f6: {
               classes:["key"],
               label: {
                  text: "F6",
                  classes: []
               }
            },
            f7: {
               classes:["key"],
               label: {
                  text: "F7",
                  classes: []
               }
            },
            f8: {
               classes:["key"],
               label: {
                  text: "F8",
                  classes: []
               }
            },
            f9: {
               classes:["key"],
               label: {
                  text: "F9",
                  classes: []
               }
            },
            f10: {
               classes:["key"],
               label: {
                  text: "F10",
                  classes: []
               }
            },
            f11: {
               classes:["key"],
               label: {
                  text: "F11",
                  classes: []
               }
            },
            f12: {
               classes:["key"],
               label: {
                  text: "F12",
                  classes: []
               }
            },
            printscreen: {
               classes:["key"],
               label: {
                  text: "Prt Scrn",
                  classes: ["shrink"]
               }
            },
            scrolllock: {
               classes:["key"],
               label: {
                  text: "Scroll Lock",
                  classes: ["shrink"]
               }
            },
            pausebreak: {
               classes:["key"],
               label: {
                  text: "Pause Break",
                  classes: ["shrink"]
               }
            },
            blank: {
               classes:["blank", "key"],
               label: {
                  text: "",
                  classes: ["shrink"]
               }
            },
            flexspace: {
               classes:["flexspace"],
               label: {
                  text: "",
                  classes: []
               }
            },
            spacer: {
               classes:["spacer"],
               label: {
                  text: "",
                  classes: []
               }
            }
         },
         pressed: {
            keyCode: false,
            altKey: false,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false,
            osKey: false,
            8: false,
            9: false,
            10: false,
            11: false,
            12: false,
            13: false,
            14: false,
            15: false,
            16: false,
            17: false,
            18: false,
            19: false,
            20: false,
            21: false,
            22: false,
            23: false,
            24: false,
            25: false,
            26: false,
            27: false,
            28: false,
            29: false,
            30: false,
            31: false,
            32: false,
            33: false,
            34: false,
            35: false,
            36: false,
            37: false,
            38: false,
            39: false,
            40: false,
            41: false,
            42: false,
            43: false,
            44: false,
            45: false,
            46: false,
            47: false,
            48: false,
            49: false,
            50: false,
            51: false,
            52: false,
            53: false,
            54: false,
            55: false,
            56: false,
            57: false,
            58: false,
            59: false,
            60: false,
            61: false,
            62: false,
            63: false,
            64: false,
            65: false,
            66: false,
            67: false,
            68: false,
            69: false,
            70: false,
            71: false,
            72: false,
            73: false,
            74: false,
            75: false,
            76: false,
            77: false,
            78: false,
            79: false,
            80: false,
            81: false,
            82: false,
            83: false,
            84: false,
            85: false,
            86: false,
            87: false,
            88: false,
            89: false,
            90: false,
            91: false,
            92: false,
            93: false,
            94: false,
            95: false,
            96: false,
            97: false,
            98: false,
            99: false,
            100: false,
            101: false,
            102: false,
            103: false,
            104: false,
            105: false,
            106: false,
            107: false,
            108: false,
         }
      }
   },
   created() {
      // let timer
      document.addEventListener("keydown", (e) => {
         this.pressed.keyCode = e.keyCode
         this.pressed.altKey = e.altKey
         this.pressed.ctrlKey = e.ctrlKey
         this.pressed.shiftKey = e.shiftKey
         if (e.keyCode == 93) {
            this.pressed.metaKey = true
         }
         this.pressed.osKey = e.metaKey
         this.pressed[e.keyCode] = true
      })
      document.addEventListener("keyup", (e) => {
         this.pressed.keyCode = e.keyCode
         this.pressed.altKey = e.altKey
         this.pressed.ctrlKey = e.ctrlKey
         this.pressed.shiftKey = e.shiftKey
         if (e.keyCode == 93) {
            this.pressed.metaKey = true
         }
         this.pressed.osKey = e.metaKey
         this.pressed[e.keyCode] = false
      })
   }
}
</script>

<style lang="scss" scoped>

$base_size: 4.3%;
$theme-light-background: rgb(224, 224, 224);
$theme-dark-background: rgb(43, 43, 43);
$cap-dark-border: 2px solid rgb(78, 78, 78);
$cap-light-border: 2px solid rgb(170, 170, 170);
$cap-box-shadow: 0px 1px 2px 2px rgba(0,0,0,0.7);
$cap-spacing: 5px;
$pressed-color: red;

.background-light {
   background: $theme-light-background;
   .key {
      background: $cap-light-border;
   }
   .key > .dec {
      border: $cap-light-border;
   }
}
.background-dark {
   background: $theme-dark-background;
   color: invert($theme-dark-background);
   .key {
      background: $cap-dark-border;
   }
   .key > .dec{
      border: $cap-dark-border;
   }
}

.pressed > .dec {
   border-color: $pressed-color !important;
}
.options {
   width:100%;
   height: 2%;
   margin: 0 2px;
   display: flex;
   align-items: center;
}

input[type="checkbox"] {
   transform: scale(1.5);
}


.key-row {
   // height: $base_size;
   padding-bottom: $base-size;
   height:0;
   display:flex;
   flex-wrap: wrap;
   & > * {
      flex-grow: 0;
      flex-shrink: 0;
   }
}

.empty-row {
   padding-bottom: $base-size/2;
}

.key { 
   width: $base-size;
   // height: 100%;
   border-radius: 2px;
   box-sizing: border-box;
   padding-bottom: $base-size;
   position:relative;
   .label {
      margin:5%;
      overflow: hidden;
   }
   .shrink {
      font-size:0.8rem;
   }
   .dec {
      position:absolute;
      right: $cap-spacing;
      top: $cap-spacing;
      width: calc(100% - #{$cap-spacing*2});
      height: calc(100% - #{$cap-spacing*2});
      box-sizing: border-box;
      box-shadow: $cap-box-shadow;
   }
}

.five {
   width:5%;
   &:nth-child(odd) {
      background:green;
   }
   &:nth-child(even) {
      background:blue;
   }
}

.blank {
   background:none;
   box-shadow:none;
}

.spacer {
   padding-bottom: $base-size;
   width: 0.666 * $base_size;
}

.flexspace {
   padding-bottom: $base-size;
   flex:1 1 auto;
}

.vertical {
   padding-bottom: 2 * $base_size;
}

.space {
   // width:360px;
   width: 6.25 * $base_size;
}
.modifiers {
   // width:60px;
   width: 1.25 * $base_size;
}
.small {
   // width:60px;
   width: 1.5 * $base_size;
}
.medium-small {
   // width:80px;
   width: 1.75 * $base_size;
}
.medium {
   // width:80px;
   width: 2 * $base_size;
}
.medium-large {
   width: 2.25 * $base_size;
   // width:110px;
}
.huge {
   // width:140px;
   width: 2.75 * $base_size;
}
</style>

