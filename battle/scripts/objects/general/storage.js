function storage (initial) {
	var self = this;

	self.pokemonPerBox = 30;
	self.box = 0;
	self.boxes = [];

	self.addBox = function (name) {
		var box;
		self.boxes.push(box = {
			"name" : arguments.length >= 1 ? name : "Box " + (self.boxes.length + 1),
			"slots" : []
		});
		for (var i = 0; i < self.pokemonPerBox; ++ i)
			box.slots[i] = null;
		return box;
	};

	self.add = function (poke, box) {
		if (arguments.length < 2)
			box = self.box;
		box = Math.min(self.boxes.length, box);
		while (box < self.boxes.length) {
			var slot;
			if (foreach(self.boxes[box].slots, function (contents, attemptedSlot) {
				if (contents === null) {
					self.boxes[box].slots[attemptedSlot] = poke;
					slot = attemptedSlot;
					return true;
				}
			}))
				return {
					box : self.boxes[box].name,
					position : slot
				};
			++ box;
		}
		self.addBox();
		self.boxes[box].slots[0] = poke;
		return {
			box : self.boxes[box].name,
			position : 0
		};
	};

	if (arguments.length > 0)
		foreach(initial, function (box) {
			var newBox = self.addBox(box.name);
			foreach(box.contents, function (poke) {
				newBox.slots[poke.slot] = new pokemon(poke)
			});
		});

	self.store = function () {
		var store = [];
		foreach(self.boxes, function (box) {
			var contents = [];
			foreach(box.slots, function (slot, i) {
				if (slot !== null)
					contents.push({
						"slot" : i,
						"pokemon" : slot.store()
					});
			});
			store.push({
				"box" : box.name,
				"contents" : contents
			});
		});
		return store;
	};
}