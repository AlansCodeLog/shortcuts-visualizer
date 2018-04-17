<template>
   <!-- tab index needs to be added so we can capture keyboard events, also allows us to ignore typing in other components -->
   <div class="keyboard" tabIndex="1" @keydown="$emit('keydown', $event)">
      <!-- make our key rows from our layout -->
      <div
         :class="['key-row', row.length == 0 ? 'empty-row': '']"
         v-for="(row, rindex) of layout"
         :key="rindex"
         :id="'key-row' + rindex"
      >
         <!-- create the key with classes for showing whether we're pressing it and/or if we're in a chain, show the chain's pressed keys -->
         <div
            v-if="keys[key]"
            v-for="(key, index) of row"
            :key="index"
            :id=[key]
            :class="[keys[key].classes,
               typeof keymap[keys[key].identifier] !=='undefined'
               && keymap[keys[key].identifier].active === true
                  ? 'pressed'
                  : '',
               typeof keymap[keys[key].identifier] !=='undefined'
               && keymap[keys[key].identifier].chain_active === true
                  ? 'chain-pressed'
                  : ''
            ]"
         >
            <!-- the key container, used to style most of the key, is also dragging container for dragula and ignored keys can't get dragged -->
            <div
               :class="[keys[key].ignore ? '' : 'key-container']"
            >
               <!-- the label for the key character, also contains any label classes -->
               <div
                  v-if="
                     keys[key]
                     && !(keys[key].ignore == true)
                     "
                  :class="['label', keys[key].label_classes]"
               >{{keys[key].character}}</div>
               <!-- the actual shortcut entry command, this is what gets dragged if we drag -->
               <div
                  :class="['key-entry', active_keys[keys[key].identifier].entry.chain_start ? 'is_chain' : '']"
                  v-if="
                     !key.is_modifier
                     && !keys[key].ignore
                     && typeof active_keys[keys[key].identifier] !== 'undefined'
                  "
                  :active_shortcuts_index="active_keys[keys[key].identifier].__active_shortcuts_index"
               >
                  <div class="command">{{active_keys[keys[key].identifier].entry.command}}</div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize} from "../helpers/helpers"

export default {
	name: 'Keys',
   //any props that look like they weren't used are being used by the helpers!
	props: ["chain", "keymap", "keymap_active", "keys", "layout", "modifiers_names", "modifiers_order", "normalize", "pressed", "shortcuts", "shortcuts_active"],
	computed: {
		active_keys () {
			let active_keys = {}
         //assign each active shortcut to an object by key (excluding modifiers)
         //also add index property for use within this component to quickly get entry
			this.shortcuts_active.map((entry, index) => {
            //if we're in a chain check against the end else check agains the beginning
				let shorcut_index = this.chain.in_chain && entry.chained ? 1 : 0
				let intersect = entry._shortcut[shorcut_index].filter(identifier => !this.keymap[identifier].is_modifier)
				active_keys[(intersect.join(""))] = {entry, __active_shortcuts_index: index}
			})
			return active_keys
		}
	},
	mounted() {
		let container_keys = this.$el.querySelectorAll(".key-container")
      
		let drake = dragula([...container_keys], {
			mirrorContainer: this.$el, //we want to keep the dragged element within this component to style it apropriately
			revertOnSpill: true, //so cancel will revert position of element
			isContainer: function (el) {
				return el.classList.contains(".key-container") || el.classList.contains("bin") || el.classList.contains("delete-bin")
            //TODO allow dragging to shortcut list
			},
			moves: function (el, source, handle, sibling) {
				return el.classList.contains("key-entry")
			},
			accepts: (el, target, source, sibling) => {
            //if we drag to the bins we always accept
				if (target.classList.contains("delete-bin") || target.classList.contains("bin")) {return true}

            //get modifiers in pressed keys
				let modifiers = _.intersection(this.modifiers_names, this.keymap_active)
            
            //block individual block_single keys
				let singles = modifiers.map(key => this.keymap[key].block_single)
				let non_singles = singles.filter(block => block == false)
				singles = singles.filter(block => block == true)

				if (singles.length > 0 && non_singles.length == 0) {
					return false
				}

				let target_key = target.querySelector(".label").innerText.toLowerCase().replace(" ", "")
				target_key = keys_from_text(target_key, this)._shortcut[0][0]

            //block individual block all keys
				let block_all = [...this.keymap_active, target_key].map(key => this.keymap[key].block_all).filter(block => block == true)
            
				if (block_all.length > 0) {return false}

            //don't allow dragging to modifiers
				if (this.keymap[target_key].is_modifier || this.keymap[target_key].block) {
					return false
				}

            //clean classes
				this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

            //if we're not in a chain (where almost anything can be swapped), don't allow swapping of entries that aren't chain starts with entries that are and vice-versa
				if (!this.chain.in_chain) {
               //check if the key even has a shortcut assigned
					let target_entry = target.querySelector(".key-entry:not(.gu-transit)")
               
					if (target_entry !== null) {
                  //get both our entries to compare
						let target_entry = target.querySelector(".key-entry").getAttribute("active_shortcuts_index")
						target_entry = this.shortcuts_active[target_entry]

						let current_entry = el.getAttribute("active_shortcuts_index")
						current_entry = this.shortcuts_active[current_entry]
                  
						if (current_entry.chain_start == target_entry.chain_start) {
							return true
						} 
					} else {return true}
				} else {
					return true
				}
            //ELSE if anything was false, make the target unselectable (red)
				target.querySelectorAll(".key-entry:not(.gu-transit)").forEach(el => el.classList.add("unselectable"))
				return false
			},
		})
		drake
      .on("drag", ()=> {
         //freeze input over keyboard
	this.$emit("freeze", true)
})
      .on("over", (el, container, source) => {
	let is_key = container.classList.contains("key-container")
         //TODO let is_list = container.classList.contains("drag")
	if (is_key) {
            //we want to know how many real siblings the target has as sometimes the element might be inserted before/after it's sibling and so we need to manually add the selectors to properly target them with css
		let siblings = container.parentNode.querySelectorAll(".key-entry:not(.gu-transit)")
		let siblings_length = siblings.length

            //clean classes beforehand
		this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
		this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))

		if (siblings_length > 0) {
			el.classList.add("will_replace")
			siblings.forEach(el => el.classList.add("will_be_replaced"))
		} else {
			el.classList.remove("will_replace")
		}
	} else if (container.classList.contains("delete-bin")) {
		container.classList.add("hovering")
	}
})
      .on("out", (el, container, source) => {
         //sometimes the classes get stuck
	this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
	this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
	document.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
}) 
      .on("drop", (el, target, source, sibling)=> {
	let source_entry = el.getAttribute("active_shortcuts_index")
	source_entry = this.shortcuts_active[source_entry]

	if (target.classList.contains("delete-bin")) {
		this.$emit("delete", source_entry)
		drake.cancel()
		return
	}

         //if we drag to the bin just emit and add (add_to_bin)
	if (target.classList.contains("bin")) {
		this.$emit("add_to_bin", source_entry)
	} else {
            //else get target from it's key than calculate the new combo
		let target_key = target.querySelector(".label").innerText
		target_key = keys_from_text(target_key, this)._shortcut[0][0]
            
            //all this means is get the chain start, mix the active keys with the target keys and remove any duplicates, sort them, then filter the entire thing for empty arrays (to clean an empty chain start)
		let target_combo = [this.chain.start, _.uniq([target_key, ...this.keymap_active]).sort()].filter(keyset => keyset.length !== 0)

		let change = {
			old_entry: source_entry,
			new_entry: {
				shortcut: target_combo.map(keyset => normalize(keyset, this).join("+")).join(" "),
				_shortcut: target_combo, //optional
				command: source_entry.command,
			}
		}
            
		this.$emit("edit", change)
	}

         //we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
	drake.cancel()
}).on("cancel", (el, target, source, sibling)=> {
         //clean classes
         //when removing/assigning these classes they should always use querySelectorAll so we don't have to deal with them not existing, we just get an empty array if they don't exist that is never iterated through
	this.$el.querySelectorAll(".unselectable").forEach(el => el.classList.remove("unselectable"))
	this.$el.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
	this.$el.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
         //unfreeze input
	this.$emit("freeze", false)
})

	}

}
</script>

<style lang="scss">
//do not scope! causes problems, also we want to be able to target light/dark theme from within component

.shortcut-visualizer {
   @import "../settings/theme.scss";
   @import "../settings/custom_dragula.scss";
   @import "../settings/keyboard_base.scss"; //handles the messy stuff so we can concentrate on styling
   &.background-light {
      .key > .key-container {
         background: $cap-light;
         border: (0.1 * $keyboard-font-size) solid  mix($cap-light, black, 90%);
         box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-light, black, 50%);
      }
   }
   &.background-dark {
      .key > .key-container {
         background: $cap-dark;
         border: (0.1 * $keyboard-font-size) solid mix($cap-dark, black, 90%);
         box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-dark, black, 50%);
      }
   }

   .keyboard {
      padding: 0 $padding-size $padding-size;
      .key-entry, .bin-entry {
         cursor: pointer;
         position: absolute;
         top:$keyboard-font-size * 1.3;
         bottom: 0;
         left: 0;
         right:0;
         font-size: $shortcut-font-size;
         text-align: center;
         display:flex;
         align-items: center;
         background: hsla(hue($accent-color), 100%, 50%, 0.2);
         border: rgba(0,0,0,0) 0.2em solid;
         .command {
            text-align: center;
            user-select: none;
            word-break: break-word;
            max-height: 100%;
            overflow: hidden;
            padding: 0.1em;
            margin: 0 auto;
         }
      }
      .bin-entry .remove {
         display: none;
      }
      .gu-mirror {
         font-size: $shortcut-drag-font-size;
         width: auto !important;
         height: auto !important;
         right: auto !important;
         bottom: auto !important;
      }
      .will_replace {
         display: none;
      }
      .will_be_replaced {
         z-index: 1;
      }
      .is_chain {
         border-color: transparentize($accent-color, 0.7);
      }
      .chain-pressed > .key-container::before {
         content: "";
         position: absolute;
         top:-$cap-spacing;
         bottom:-$cap-spacing;
         left:-$cap-spacing;
         right:-$cap-spacing;
         border-color: mix($accent-color,rgba(0,0,0,0), 50%) !important;
         border-style: dotted;
      }
   }

   .background-light {
      .key-container {
         background: $cap-light;
         border: (0.1 * $keyboard-font-size) solid  mix($cap-light, black, 90%);
         box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-light, black, 50%);
      }
   }
   .background-dark {
      .key-container {
         background: $cap-dark;
         border: (0.1 * $keyboard-font-size) solid mix($cap-dark, black, 90%);
         box-shadow: 0 (0.05 * $keyboard-font-size) (0.1 * $keyboard-font-size) (0.1 * $keyboard-font-size) mix($cap-dark, black, 50%);
      }
   }
}
</style>

