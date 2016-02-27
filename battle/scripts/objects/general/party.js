"use strict";

function party (initial) {
	var self = this;

	self.space = 6;
	self.pokemon = [];

	self.add = function (poke) {
		if (self.pokemon.length < self.space) {
			self.pokemon.push(poke);
			return true;
		}
		return false;
	};

	if (arguments.length > 0)
		foreach(initial, function (poke) {
			self.add(new pokemon(poke));
		});

	self.release = function (poke) {
		poke.release();
		self.pokemon.remove(self.pokemon.indexOf(poke));
	};

	self.store = function () {
		var store = [];
		foreach(self.pokemon, function (poke) {
			store.push(poke.store());
		});
		return store;
	};
}