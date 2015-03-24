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
	setProperty("identification", typeof "Game" === "object" ? Game.unique() : null);
	setProperty("gender", "male");
	setProperty("party", []);
	setProperty("nationality", "British");
	setProperty("bag", []);
	setProperty("dex", (new dex()).store());
	setProperty("badges", []);
	// Player properties
	setProperty("money", 0);
	// NPC properties
	setProperty("game", "B2W2"); // The game the trainer appears in (used for sprites)
	setProperty("class", "Ace Trainer"); // The trainer class of the NPC
	setProperty("individual", false); // Whether this particular trainer is a unique example of this class (for example a Rocket Admin) and requires specific data, e.g. sprite, that is not generic to the entire trainer class
	setProperty("pressure speech", null); // Dialogue spoken when the trainer sends out their final Pokémon (usually only used for gym leaders / E4 members)
	setProperty("defeat speech", ":("); // Dialogue spoken after the trainer has been defeated in battle

	self.party = new party(self.party);
	foreach(self.party.pokemon, function (poke) {
		poke.belong(self);
	});
	self.dex = new dex(self.dex);
	self.bag = new bag(self.bag);
	self.type = Trainers.type.NPC;
	self.team = Game.unique();
	self.OPowers = {
		"Exp. Point" : 0,
		"Prize Money" : 0,
		"Capture" : 0
	};
	foreach(Stats, function (stat) {
		self.OPowers[stat] = 0;
	});

	self.megaEvolution = "possible"; // Whether the trainer has Mega Evolved their Pokémon during the current battle, whether they intend to, or whether they haven't at all

	self.store = function () {
		// Returns an object that contains all the data for the trainer, without any methods
		var store = {};
		foreach(["name", "identification", "gender", "money", "nationality", "badges", "game", "class", "individual", "pressure speech", "defeat speech"], function (property) {
			store[property] = JSONCopy(self._(property));
		});
		store.party = self.party.store();
		store.bag = self.bag.store();
		return JSONCopy(store);
	};

	self.resetDisplay = function () {
		self.display = {
			visible : false,
			position : {
				x : 0,
				y : 0,
				z : 0
			}
		};
	};
	self.resetDisplay();

	self.fullname = function (trueName) {
		// trueName will use the default name (e.g. "Red") for a player character
		return self.class + " " + (trueName && self.class === "Pokémon Trainer" ? Games[self.game].player[(self.gender === "male" ? "male" : "female")] : self.name);
	};

	self.paths = {
		sprite : function (which, includeFiletype) {
			// which should be left as null for the front sprite, as this is much more likely than the back sprite.
			var contracted = Settings._("paths => characters => image");
			contracted = contracted.replace("{game}", self.game);
			contracted = contracted.replace("{who}", (self.individual ? (self.fullname(true)) : self.class + (self.gender === "male" ? "~male" : self.gender === "female" ? "~female" : "")) + (which ? "~" + which : ""));
			contracted = contracted.replace(/\{filetype=[a-z0-9]+\}/, (includeFiletype ? "." + contracted.match(/\{filetype=([a-z0-9]+)\}/)[1] : ""));
			return contracted;
		}
	};

	self.pronoun = function (capitalised) {
		return (self === Game.player ? (capitalised ? "You" : "you") : self.fullname());
	};
	self.genderPronoun = function (capitalised) {
		var word = (self === Game.player ? "you" : (self.gender === "male" ? "he" : self.gender === "female" ? "her" : "it"));
		return (capitalised ? capitalise(word) : word);
	};
	self.possessivePronoun = function (capitalised) {
		return (self === Game.player ? (capitalised ? "Your" : "your") : self.fullname() + "'s");
	};
	self.possessiveGenderPronoun = function (capitalised) {
		var word = (self === Game.player ? "your" : (self.gender === "male" ? "his" : self.gender === "female" ? "her" : "its"));
		return (capitalised ? capitalise(word) : word);
	};
	
	self.give = function (poke) {
		/*
			Gives the player a Pokémon, ensuring it now has the correct trainer details.
		*/
		poke.belong(self);
		self.dex.capture(poke.species);
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

	self.healthyPokemon = function (thatAreNotBattling, _excluding, style) {
		if (!self.hasPokemon())
			return [];
		var pokes = [], excluding = (arguments.length >= 2 && typeof _excluding !== "undefined" && _excluding !== null ? wrapArray(_excluding) : []);
		foreach(self.party.pokemon, function (poke) {
			if (poke.conscious() && (!thatAreNotBattling || (!poke.battler.battling && !poke.battler.reserved)) && !excluding.contains(poke) && !(arguments.length >= 3 && typeof style !== "undefined" && style !== null && style === "sky" && !poke.currentProperty("aerial")))
				pokes.push(poke);
		});
		return pokes;
	};

	self.healthyEligiblePokemon = function (thatAreNotBattling, excluding, style) {
		return self.healthyPokemon(thatAreNotBattling, excluding, style);
	};

	self.hasHealthyPokemon = function (thatAreNotBattling, excluding, style) {
		return self.healthyPokemon(thatAreNotBattling, excluding, style).length > 0;
	};

	self.hasHealthyEligiblePokemon = function (thatAreNotBattling, excluding, style) {
		// Assumes a battle is in progress
		return self.healthyEligiblePokemon(thatAreNotBattling, excluding, style).length > 0;
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

	self.ownsKeyStone = function () {
		return self.bag.has("Key Stone");
	};
}

TheWild = new trainer({
	name : "The Wild"
});