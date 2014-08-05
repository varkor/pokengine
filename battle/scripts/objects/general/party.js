function party () {
	var self = this;

	self.space = 6;
	self.pokemon = [];
	foreach(arguments, function (poke) {
		self.pokemon.push(poke);
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
}