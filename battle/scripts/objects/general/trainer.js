function trainer (data) {
	var self = this;

	_method(self);

	if (arguments.length < 1)
		data = {};
	var setProperty = function (property, value) {
		if (data.hasOwnProperty(property))
			self[property] = data[property];
		else
			self[property] = (typeof value === "function" ? value() : value);
	};

	setProperty("name", "Someone");
	setProperty("unique", Game.unique());
	setProperty("gender", Genders.male);
	setProperty("party", []);
	setProperty("money", 0);
	setProperty("nationality", Nationalities.British);
	setProperty("bag", []);
	setProperty("badges", []);
	setProperty("location", "nowhere");

	self.party = new party(self.party);
	foreach(self.party.pokemon, function (poke) {
		poke.belong(self);
	});
	self.bag = new bag(self.bag);
	self.battlers = [];
	self.type = Trainers.type.NPC;
	self.team = Game.unique();

	self.store = function () {
		// Returns an object that contains all the data for the trainer, without any methods
		var store = {};
		foreach(["name", "unique", "gender", "money", "nationality", "badges", "location"], function (property) {
			store[property] = JSONCopy(self._(property));
		});
		store.party = self.party.store();
		store.bag = self.bag.items;
		return JSONCopy(store);
	};

	self.pronoun = function (capitalised) {
		return (self === Game.player ? (capitalised ? "You" : "you") : self.name);
	};
	self.genderPronoun = function (capitalised) {
		var word = (self === Game.player ? "you" : (self.gender === Genders.male ? "he" : self.gender === Genders.female ? "her" : "it"));
		return (capitalised ? capitalise(word) : word);
	};
	self.possessivePronoun = function (capitalised) {
		return (self === Game.player ? (capitalised ? "Your" : "your") : self.name + "'s");
	};
	
	self.give = function (poke) {
		/*
			Gives the player a Pokémon, ensuring it now has the correct trainer details.
		*/
		poke.belong(self);
		if (self === Game.player) {
			Pokedex.capture(poke.species);
		}
		if (self.party.pokemon.length < self.party.space)
			self.party.add(poke);
		else if (self === Game.player) {
			var placement = Storage.store(poke);
			Textbox.say(poke.name() + " has been placed in \"" + placement.box + "\".");
		}
	};

	self.rent = function (poke) {
		/*
			Gives the trainer a Pokémon, but only temporarily, so it is not added to the Pokédex.
			This is used for some tournament battles, such as in the Battle Factory
		*/
		if (self.party.pokemon.length < self.party.space) // Otherwise, it cannot be added to the party
			self.party.add(poke);
	};

	self.release = function (poke) {
		self.party.release(poke);
	};

	self.pokemon = function () {
		return self.party.pokemon.length;
	};

	self.hasPokemon = function () {
		return self.pokemon() > 0;
	};

	self.healthyPokemon = function (thatAreNotBattling, excluding) {
		if (!self.hasPokemon())
			return [];
		var pokes = [];
		excluding = wrapArray(excluding);
		foreach(self.party.pokemon, function (poke) {
			if (poke.conscious() && (!thatAreNotBattling || !poke.battler.battling) && !excluding.contains(poke))
				pokes.push(poke);
		});
		return pokes;
	};

	self.hasHealthyPokemon = function (thatAreNotBattling, excluding) {
		return self.healthyPokemon(thatAreNotBattling, excluding).length > 0;
	};

	self.isAnNPC = function () {
		return self.type === Trainers.type.NPC;
	};

	self.battlers = function () {
		var battlers = [];
		foreach(self.party.pokemon, function (poke) {
			if (poke.battler.battling)
				battlers.push(poke);
		});
		return battlers;
	};

	self.holdsControlOverPokemonUpToLevel = function () {
		var maximum = 0;
		foreach(self.badges, function (badge) {
			if (badge.obediance > maximum)
				maximum = badge.obediance;
		});
		return maximum;
	};
}