PokemonIDs = {
	0 : "Missingno."
};

Pokemon = {
	"Missingno." : {
		region : "Nintendo",
		types : [Types.bird, Types.normal],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {
		},
		evolution : [],
		friendship : 70,
		catchRate : 29
	},
	"Bulbasaur" : {
		region : "Nintendo",
		types : [Types.grass, Types.poison],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {
			2 : ["Hyper Beam"]
		},
		evolution : [
			{
				species : "Ivysaur",
				method : [Evolution.level, Evolution.friendship],
				level : 2,
				friendship : 70
			},
			{
				species : "Charizard",
				method : [Evolution.level],
				level : 3
			}
		],
		friendship : 70,
		catchRate : 45
	},
	"Ivysaur" : {
		region : "Nintendo",
		types : [Types.grass, Types.poison],
		experience : Experiences.fast,
		forms : {
			Normal : {
			},
			Metallic : {
				types : [Types.grass, Types.steel],
				attack : 200
			}
		},
		yield : {
			experience : 50
		},
		moveset : {
			3 : ["Metronome"]
		},
		friendship : 70,
		catchRate : 45
	},
	"Charizard" : {
		region : "Nintendo",
		types : [Types.fire, Types.flying],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {},
		friendship : 70,
		catchRate : 45
	},
	"Blastoise" : {
		region : "Nintendo",
		types : [Types.water],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {},
		friendship : 70,
		catchRate : 45
	}
};
forevery(Pokemon, function (poke, name) {
	if (!poke.hasOwnProperty("evolution"))
		poke.evolution = [];
	poke.evolution = wrapArray(poke.evolution);
	foreach(poke.evolution, function (evo) {
			evo.method = wrapArray(evo.method);
	});
	if (!poke.hasOwnProperty("stats")) {
		poke.stats = [];
		poke.stats[Stats.health] = 100;
		poke.stats[Stats.attack] = 100;
		poke.stats[Stats.specialAttack] = 100;
		if (0 && name === "Ivysaur") {
			poke.stats[Stats.attack] = 10000;
			poke.stats[Stats.specialAttack] = 10000;
		}
		poke.stats[Stats.defence] = 100;
		poke.stats[Stats.specialDefence] = 100;
		poke.stats[Stats.speed] = 100;
	}
	if (!poke.yield.hasOwnProperty("EVs")) {
		poke.yield.EVs = [0, 0, 0, 0, 0, 0];
		poke.yield.EVs[Stats.health] = 1;
		poke.yield.EVs[Stats.speed] = 2;
	}
});
_method(Pokemon);