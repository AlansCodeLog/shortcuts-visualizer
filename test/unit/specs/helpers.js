// small helper to verify some entry partially deep equals the entry provided
// it's tempting to get shortcut[some index] then deep equal it to some entry but
// order should not matter and deep equal requires we list all the entry properties
export function exists_entry(list, entry, get_entry = false) {
	let indexes = list.map((existing_entry, index)=> {
		for (let prop of Object.keys(entry)) {
			if (Array.isArray(existing_entry[prop])) {
				if (Array.isArray(entry[prop])) {
					if (entry[prop].join() !== existing_entry[prop].join()) {
						return false
					}
				} else {
					return false
				}
			} else if (entry[prop] !== existing_entry[prop]) {
				return false
			}
		}
		return index
	}).filter(index => index !== false)

	if (indexes.length == 1) {
		return get_entry ? list[indexes[0]] : true
	} else if (indexes.length == 0) {
		return false
	} else {
		throw { message: "Found multiple indexes.", indexes }
	}
}