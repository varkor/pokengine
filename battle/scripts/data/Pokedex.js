Pokedex = {
	"Missingno. (Nintendo)" : {
		"types" : ["Bird", "Normal"],
		"experience" : "fast",
		"form(e)s" : null,
		"yield" : {
			"experience" : 50
		},
		moveset : {},
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
		stats : {"health" : 45, "attack" : 49, "defence" : 49, "special attack" : 65, "special defence" : 65, "speed" : 45 },
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
			normal : ["Intimidate"],
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
		stats : {"health" : 60, "attack" : 62, "defence" : 63, "special attack" : 80, "special defence" : 80, "speed" : 60 },
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
			},
			{
				species : "Blastoise (Nintendo)",
				method : "level",
				requirements : {
					level : 3
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
		types : ["Ghost"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 78, "attack" : 84, "defence" : 78, "special attack" : 109, "special defence" : 85, "speed" : 100 },
		moveset : {
			1 : ["Tackle"]
		},
		evolutions : [
			{
				species : "Blastoise (Nintendo)",
				method : "level",
				requirements : {
					level : 51
				}
			}
		],
		"shiny" : "E64110D55210F6A410E6B410FFD510E6E610833118313941EEB45ABDBDACCD52415A5A6AEE8329837B94084152831029207394BD2041EEDE7BDEDEAC",
		"friendship" : 70,
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
		stats : {"health" : 79, "attack" : 83, "defence" : 100, "special attack" : 85, "special defence" : 105, "speed" : 78 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Chlorophyll"
		}
	},
	"Bramboom (Atlas)" : {
		types : ["Grass", "Ground"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 78, "attack" : 115, "defence" : 90, "special attack" : 74, "special defence" : 78, "speed" : 95 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Damasoar (Atlas)" : {
		types : ["Water", "Ice"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 85, "attack" : 105, "defence" : 73, "special attack" : 80, "special defence" : 77, "speed" : 110 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Ekiama (Atlas)" : {
		types : ["Fire", "Poison"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 100, "attack" : 75, "defence" : 98, "special attack" : 100, "special defence" : 98, "speed" : 59 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Vermpent (Atlas)" : {
		types : ["Ground", "Dark"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 95, "attack" : 125, "defence" : 100, "special attack" : 60, "special defence" : 81, "speed" : 79 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Phantomail (Atlas)" : {
		types : ["Ghost", "Steel"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 60, "attack" : 110, "defence" : 100, "special attack" : 65, "special defence" : 65, "speed" : 89 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Levitate"],
			hidden : "Tough Claws"
		}
	},
	"Beanormous (Atlas)" : {
		types : ["Grass", "Fairy"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 90, "attack" : 80, "defence" : 85, "special attack" : 135, "special defence" : 105, "speed" : 55 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Stalliot (Atlas)" : {
		types : ["Normal"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 90, "attack" : 105, "defence" : 75, "special attack" : 55, "special defence" : 60, "speed" : 105 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 1,
		abilities : {
			normal : ["Intimidate"],
			hidden : "Tough Claws"
		}
	},
	"Horrendove (Atlas)" : {
		types : ["Dark", "Flying"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 112, "attack" : 98, "defence" : 73, "special attack" : 50, "special defence" : 70, "speed" : 92 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		},
		attributes : {
			"floating" : {
				height : 40,
				variation : 10,
				period : 5
			}
		}
	},
	"Expertri (Havai)" : {
		types : ["Grass", "Fighting"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 85, "attack" : 120, "defence" : 90, "special attack" : 70, "special defence" : 80, "speed" : 90 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.875,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Spinda (Nintendo)" : {
		types : ["Normal"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 60, "attack" : 60, "defence" : 60, "special attack" : 60, "special defence" : 60, "speed" : 60 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Toxito (Atlas)" : {
		types : ["Bug", "Poison"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 75, "attack" : 85, "defence" : 55, "special attack" : 65, "special defence" : 55, "speed" : 65 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Akakira (Atlas)" : {
		types : ["Electric"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 65, "attack" : 50, "defence" : 65, "special attack" : 98, "special defence" : 80, "speed" : 111 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
		}
	},
	"Kikiwi (Okeno)" : {
		types : ["Grass"],
		experience : "fast",
		"form(e)s" : null,
		yield : {
			experience : 50
		},
		stats : {"health" : 75, "attack" : 75, "defence" : 75, "special attack" : 75, "special defence" : 75, "speed" : 75 },
		moveset : {},
		friendship : 70,
		"catch rate" : 45,
		"gender ratio" : 0.5,
		abilities : {
			normal : ["Overgrow"],
			hidden : "Tough Claws"
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
	if (!poke.hasOwnProperty("attributes")) {
		poke.attributes = {};
	}
	if (poke.hasOwnProperty("shiny")) {
		var pairs = poke.shiny.toLowerCase().match(/.{12}/g).map(function (pair) {
			return pair.match(/.{6}/g);
		}), map = {};
		var convertToRGB = function (hex) {
			return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
		};
		foreach(pairs, function (pair) {
			map[convertToRGB(pair[0])] = convertToRGB(pair[1]);
		});
		poke.shiny = map;
	} else {
		poke.shiny = {};
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