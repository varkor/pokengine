Pokedex = {
	"Missingno. (Nintendo)" : {
		"types" : ["Bird", "Normal"],
		"experience" : "fast",
		"form(e)s" : null,
		"yield" : {
			"experience" : 50
		},
		moveset : {
		},
		evolutions : [],
		friendship : 70,
		"catch rate" : 29,
		"gender ratio" : null, // Chance of being male
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	},
	"Bulbasaur (Nintendo)" : {
		types : ["Grass", "Poison"],
		experience : "fast",
		"form(e)s" : {
			"Normal" : {
			},
			"Metallic" : {
				types : ["Grass", "Steel"],
				attack : 200
			}
		},
		yield : {
			experience : 50
		},
		moveset : {
			2 : ["Hyper Beam"]
		},
		evolutions : [
			{
				species : "Ivysaur (Nintendo)",
				method : "level",
				requirements : {
					level : 2,
					friendship : 70
				}
			},
			{
				species : "Charizard (Nintendo)",
				method : "level",
				requirements : {
					level : 2
				}
			}
		],
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875, // Chance of being male
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	},
	"Ivysaur (Nintendo)" : {
		types : ["Grass", "Poison"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		moveset : {
			3 : ["Metronome"]
		},
		evolutions : [
			{
				species : "Charizard (Nintendo)",
				method : "level",
				requirements : {
					level : 2
				}
			}
		],
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	},
	"Charizard (Nintendo)" : {
		types : ["Fire", "Flying"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		moveset : {},
		evolutions : [],
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	},
	"Blastoise (Nintendo)" : {
		types : ["Water"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	}
};
_method(Pokedex);

forevery(Pokedex, function (poke, name) {
	if (!poke.hasOwnProperty("evolutions"))
		poke.evolutions = [];
	if (!poke.hasOwnProperty("preevolutions"))
		poke.preevolutions = [];
	poke.evolutions = wrapArray(poke.evolutions);
	foreach(poke.evolutions, function (evo) {
			var into = Pokedex._(evo.species);
			if (!into.hasOwnProperty("preevolutions"))
				into.preevolutions = [];
			var details = {
				species : name
			};
			forevery(evo, function (value, key) {
				if (key !== "species") {
					details[key] = value;
				}
			});
			into.preevolutions.push(details);
	});
	if (!poke.hasOwnProperty("stats")) {
		poke.stats = {};
		poke.stats.health = 100;
		poke.stats.attack = 100;
		poke.stats["special attack"] = 100;
		poke.stats.defence = 100;
		poke.stats["special defence"] = 100;
		poke.stats.speed = 100;
	}
	if (!poke.yield.hasOwnProperty("EVs")) {
		poke.yield.EVs = {};
		poke.yield.EVs.health = 1;
		poke.yield.EVs.speed = 2;
	}
});
forevery(Pokedex, function (poke, name) {
	var tested = [];
	var lowestLevelFoundAt = function (speciesName, lowerBound) {
		if (!tested.contains(speciesName)) {
			var preevolutions = Pokedex._(speciesName).preevolutions;
			if (preevolutions.notEmpty()) {
				var upperBound = 100;
				foreach(preevolutions, function (preevo) {
					if (preevo.method === "level") {
						if (preevo.hasOwnProperty("level")) {
							upperBound = Math.min(upperBound, preevo.level + lowerBound);
						} else {
							upperBound = Math.min(upperBound, lowestLevelFoundAt(preevo.species, lowerBound + 1));
						}
					} else {
						upperBound = Math.min(upperBound, lowestLevelFoundAt(preevo.species, lowerBound));
					}
				});
				return upperBound;
			} else {
				return lowerBound + 1;
			}
		} else return 100; // There is an evolutionary loop, and technically you shouldn't ever be able to get the Pokémon via this path as you need to evolve it from itself first. The only way to get the Pokémon via this path is to capture it in a location first.
	}
	poke.lowestPossibleLevel = lowestLevelFoundAt(name, 0);
});