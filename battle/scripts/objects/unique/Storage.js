Storage = {
	box : 0,
	boxes : [],
	pokemonPerBox : 30,
	store : function (poke, box) {
		if (arguments.length < 2)
			box = Storage.box;
		box = Math.min(Storage.boxes.length, box);
		while (box < Storage.boxes.length) {
			var slot;
			if (foreach(Storage.boxes[box].slots, function (contents, attemptedSlot) {
				if (contents === null) {
					Storage.boxes[box].slots[attemptedSlot] = poke;
					slot = attemptedSlot;
					return true;
				}
			}))
				return {
					box : Storage.boxes[box].name,
					position : slot
				};
			box += 1;
		}
		Storage.boxes.push({
			name : "Box " + (Storage.boxes.length + 1),
			slots : []
		});
		for (var i = 0; i < Storage.pokemonPerBox; ++ i)
			Storage.boxes[box].slots[i] = null;
		Storage.boxes[box].slots[0] = poke;
		return {
			box : Storage.boxes[box].name,
			position : 0
		};
	}
};