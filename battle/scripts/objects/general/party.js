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

	self.list = function () {
		foreach(self.pokemon, function (poke, i) {
			Textbox.state((i + 1) + ". " + poke.name() + (poke.nickname ? " (" + poke.species.name + ")" : "") + ": Level " + poke.level + ", " + poke.health + "/" + poke.stats[Stats.health]() + " HP");
		});
	};
}