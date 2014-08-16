function party (initial) {
	var self = this;

	self.space = 6;
	self.pokemon = [];
	if (arguments.length > 0)
		foreach(initial, function (poke) {
			self.add(new pokemon(poke));
		});

	self.add = function (poke) {
		if (self.pokemon.length < self.space) {
			self.pokemon.push(poke);
			return true;
		}
		return false;
	};

	self.release = function (poke) {
		self.pokemon.remove(self.pokemon.indexOf(poke));
	};

	self.empty = function () {
		self.pokemon = [];
	};

	self.store = function () {
		var store = [];
		foreach(self.pokemon, function (poke) {
			store.push(poke.store());
		});
		return store;
	};
}