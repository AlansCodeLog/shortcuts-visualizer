<template>
   <div class="temp-bin bin-container">
      <div class="bin">
         <div
            :class="['bin-entry', entry.chain_start ? 'is_chain':'']"
            v-for="(entry, index) in bin"
            :key="index+entry.command"
         ><span :index="index" class="command">{{entry.command}}</span><div
            class="remove"
            @click="remove(index)"
         >&#10006;</div></div>
      </div>
   </div>
</template>

<script>
import dragula from "dragula"
import {keys_from_text, normalize, multisplice} from "../helpers/helpers"
export default {
	name: 'Bin',
	props: ["bin", "block_singles", "chain", "context", "keymap", "keymap_active", "modifiers_names", "modifiers_order", "options", "shortcuts", "shortcuts_active", "shortcuts_list_active"],
	methods: {
		remove (index) {
			this.$emit("delete", this.bin[index])
		},
      //move an entry from the bin to "somewhere else" aka a different shortcut
		move(entry, index, new_shortcut) {
         //if the entry was a chain_start, we move all it's chained command with it
			if (entry.chain_start) {
				let indexes = this.bin.map((existing_entry, index) => {
					if (existing_entry.chained && existing_entry._shortcut[0].join("") == entry._shortcut[0].join("")) {
						return index
					}
				}).filter(entry => typeof entry !== "undefined")
				for (let entry_index of indexes) {
					let existing_entry = this.bin[entry_index]
					existing_entry._shortcut[0] = new_shortcut[0]
					existing_entry.shortcut = existing_entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")
               //when an item is added to the bin, only it's current context is removed, so here we just add the new current context
					existing_entry.contexts.push(this.options.context)
					this.shortcuts.push(existing_entry)
				}
				multisplice(this.bin, indexes)
			}
			this.bin.splice(index, 1)
			entry._shortcut = new_shortcut
			entry.shortcut = entry._shortcut.map(keyset => normalize(keyset, this).join("+")).join(" ")
         //when an item is added to the bin, only it's current context is removed, so here we just add the new current context
			entry.contexts.push(this.options.context)
			this.shortcuts.push(entry)
		},
	},
	mounted() {
		let container_keys = this.$el.querySelectorAll(".bin")
      
      //most of the logic here is half stolen from the other components
		let drake = dragula([...container_keys], {
			mirrorContainer: this.$el.querySelector(".bin"),
			revertOnSpill: true, //so cancel will revert position of element
			isContainer: function (el) {
            //we can drag to the keyboard or the list (but only to a command)
				return el.classList.contains("bin") || el.classList.contains("delete-bin") || el.classList.contains("key-container") || (el.classList.contains("drag") && el.classList.contains("command"))
			},
			moves: function (el, source, handle, sibling) {
				return el.classList.contains("bin-entry")
			},
			accepts: (el, target, source, sibling) => {
				if (target.classList.contains("delete-bin")) {
					return true
				}
				if (target.classList.contains("key-container")) {
               //get modifiers in pressed keys
					let modifiers = _.intersection(this.modifiers_names, this.keymap_active)
               //block_singles if on
					if (this.block_singles
               && (this.keymap_active.length == 0 || modifiers == 0)) {
                  
						return false
					}
               
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
				}
				return target.classList.contains("key-container") || (target.classList.contains("drag") && target.classList.contains("command"))
			},
		})
		drake
      //note bin does not freeze input as the bin itself isn't dependent on keys or context
      .on("over", (el, container, source) => {
         //clean css classes
	document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
	document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))

         //mark shortcuts that will be replaced depending on if we're dragging to the keyboard or the bin
	let is_key = container.classList.contains("key-container")
	let is_list = container.classList.contains("drag")
	if (is_key) {
		let target_entry = container.querySelectorAll(".key-entry")
		if (target_entry.length > 0) {
			target_entry.forEach(el => el.classList.add("will_be_replaced"))
			el.classList.add("will_replace")
		}
	} else if (is_list) {
            
		let siblings = container.querySelectorAll(".list-subentry:not(.gu-transit)")
		let siblings_length = siblings.length
            

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
         //clean css classes, sometimes they get stuck
	document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
	document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
	document.querySelectorAll(".hovering").forEach(el => el.classList.remove("hovering"))
}) 
      .on("drop", (el, target, source, sibling)=> {
	let is_key = target.classList.contains("key-container")
	let source_index = el.querySelector(".command").getAttribute("index") //TODO context
	let source_entry = this.bin[source_index]
         //get info to move depending on whether we dragged to the keyboard or the list

	if (target.classList.contains("delete-bin")) {
		this.$emit("delete", source_entry)
		drake.cancel()
		return
	}
	if (is_key) {
		let target_key = target.querySelector(".label").innerText
         
		target_key = keys_from_text(target_key, this)._shortcut[0][0]
		let target_combo = [this.chain.start, _.uniq([target_key, ...this.keymap_active]).sort()].filter(keyset => keyset.length !== 0)

		let target_command = target.querySelector(".key-entry > div")
                     
		if (target_command !== null) {
			target_command = target_command.innerText
			let target_entry = this.shortcuts_active.findIndex(entry => {
				return entry.command == target_command
                  && entry._shortcut.join("") == target_combo.join("")
			})
               
			target_entry = this.shortcuts_active[target_entry]
			let target_shortcut = target_entry._shortcut
               
			this.$emit("add", target_entry)
		} 
		this.move(source_entry, source_index, target_combo)
	} else {
		let target_entry_index = target.parentNode.getAttribute("index")
		let target_entry = this.shortcuts_list_active[target_entry_index]
            
		this.$emit("add", target_entry)
		this.move(source_entry, source_index, target_entry._shortcut)
	}
         //we don't actually want to drop the element and change the dom, vue will handle rerendering it in the proper place
	drake.cancel()
}).on("cancel", (el, target, source, sibling)=> {
         //clean css classes
	document.querySelectorAll(".will_be_replaced").forEach(el => el.classList.remove("will_be_replaced"))
	document.querySelectorAll(".will_replace").forEach(el => el.classList.remove("will_replace"))
})
	},

}
</script>

<style lang="scss">

.shortcut-visualizer {
   &.background-light {
      .bin-container {
         background: rgba(0,0,0,0.1);
         border-color: rgba(0,0,0,0.1);
      }
   }
   &.background-dark {
      .bin-container {
         background: rgba(0,0,0,0.25);
         border-color:rgba(0,0,0,0.3);
      }
   }
   @import "../settings/theme.scss";
   @import "../settings/custom_dragula.scss";
   .bin-container {
      min-height: 4.5em;
      border: 2px solid rgba(0,0,0,0);
   }
   .bin {
      flex: 1 0 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 0.5em;
      .bin-entry.gu-transit {
         display: none !important;
      }
      .bin-entry, .key-entry.gu-transit, .list-subentry {
         user-select: none;
         cursor: pointer;
         flex: 0 0 auto;
         padding:0.5em;
         margin: 0.5em;
         position: relative;
         background: rgba(0,0,0,0.3);
         border: rgba(0,0,0,0) 0.2em solid;
         .remove {
            display: none;
            position: absolute;
            top: -0.7em;
            right: -0.7em;
            width: 1.2em;
            height: 1.2em;
            border: 2px solid mix(red, black, 80%);
            background: transparentize(red, 0.7);
            color: red;
            line-height: 1.2em;
            border-radius: 100%;
            text-align: center;
            cursor: pointer;
         }
         &:hover:not(.gu-mirror) .remove {
            display: block;
         }
      }
      .gu-mirror {
         height: auto!important;
         width: auto !important;
         opacity: 1;
         background: hsla(hue($accent-color), 100%, 50%, 0.2);
      }
      .is_chain  {
         border: 2px solid rgba(0,0,0,1);
      }
      .key-entry, .list-subentry {
         border-color: $accent-color;
      }
      .gu-transit.is_chain {
         border: 2px solid red;
         display: flex;
         align-items: center;
         flex-wrap: nowrap;
         & div {
            flex: 0 0 auto;
         }
         &::after {
            content: "+";
            flex: 0 0 auto;
            padding-left: 0.2em;
            font-weight: bold;
            color: $dragging-will-be-replaced;
            font-size: 2em;
            line-height: 0.5em;
            max-height: 0.5em;
         }
      }
   }
}
</style>

