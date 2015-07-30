Clauses = {
	"Baton Pass" : {
		description : "Only one Pokémon in each party may know Baton Pass.",
		regards : "party",
		test : function (party) {
			var batonPasser = false;
			return !foreach(party.pokemon, function (poke) {
				if (poke.knowsMove("Baton Pass")) {
					if (batonPasser)
						return true;
					else batonPasser = true;
				}
			});
		}
	},
	"Endless Battle" : {
		description : "Pokémon with the capability of intentionally causing an endless battle are banned.",
		regards : "Pokémon",
		test : function (poke) {
			return !(poke.item === "Berries => Leppa" && (poke.knowsMove("Recycle") || poke.ability === "Harvest"));
		}
	},
	"Evasion" : {
		description : "A Pokémon may not have either of the moves Double Team or Minimize, or hold the items BrightPowder or Lax Incense",
		regards : "Pokémon",
		test : function (poke) {
			return !poke.knowsMove("Double Team") && !poke.knowsMove("Minimize") && poke.item !== "Other => BrightPowder" && poke.item !== "Incense => Lax";
		}
	},
	"Event Clause" : {
		description : "Pokémon and items only available through events are banned.",
		regards : "party",
		test : function (party) {
			// There is not currently an event database, so we'll just let this one slide for now
			return true;
		}
	},
	"Freeze" : {
		description : "A trainer may not freeze two of the other's trainer's Pokémon, so that they are frozen in the same turn, unless forced into it.",
		regards : "battle"
	},
	"Item" : {
		description : "There may not be two Pokémon holding the same item on the same team.",
		regards : "party",
		test : function (party) {
			var items = [];
			return !foreach(party.pokemon, function (poke) {
				if (items.contains(poke.item)) {
					return true;
				} else items.push(poke.item);
			});
		}
	},
	"Moody" : {
		description : "Pokémon with the ability Moody are banned.",
		regards : "Pokémon",
		test : function (poke) {
			return poke.ability !== "Moody";
		}
	},
	"Nickname" : {
		description : "There may not be two Pokémon with the same nickname on the same team.",
		regards : "party",
		test : function (party) {
			var nicknames = [];
			return !foreach(party.pokemon, function (poke) {
				if (nicknames.contains(poke.name())) {
					return true;
				} else nicknames.push(poke.name());
			});
		}
	},
	"OHKO" : {
		description : "A Pokémon may not have a one-hit knockout move.",
		regards : "Pokémon",
		test : ["Fissure", "Guillotine", "Horn Drill", "Sheer Cold"]
	},
	"Self-KO" : {
		description : "A trainer loses the battle if their last Pokémon uses Selfdestruct or Explosion.",
		regards : "battle",

	},
	"Sleep" : {
		description : "A trainer may not put to sleep two of the other's trainer's Pokémon, so that they are sleeping in the same turn, unless forced into it.",
		regards : "battle"
	},
	"Species" : {
		description : "There may not be two Pokémon of the same species on the same team.",
		regards : "party",
		test : function (party) {
			var species = [];
			return !foreach(party.pokemon, function (poke) {
				if (species.contains(poke.species)) {
					return true;
				} else species.push(poke.species);
			});
		}
	}
};