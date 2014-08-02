Pokemon = {
	Bulbasaur : {
		name : "Bulbasaur",
		region : "Nintendo",
		types : [Types.grass, Types.poison],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {
			2 : [Moves.HyperBeam]
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
	Ivysaur : {
		name : "Ivysaur",
		region : "Nintendo",
		types : [Types.grass, Types.poison],
		experience : Experiences.fast,
		yield : {
			experience : 50
		},
		moveset : {
			2 : [Moves.HyperBeam, Moves.SolarBeam],
			3 : [Moves.Metronome]
		},
		friendship : 70,
		catchRate : 45
	},
	Charizard : {
		name : "Charizard",
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
	Blastoise : {
		name : "Blastoise",
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
forevery(Pokemon, function (poke) {
	if (!poke.hasOwnProperty("evolution"))
		poke.evolution = [];
	if (poke.hasOwnProperty("evolution") && !(poke.evolution instanceof Array))
		poke.evolution = [poke.evolution];
	foreach(poke.evolution, function (evo) {
		evo.species = Pokemon[evo.species];
		if (!(evo.method instanceof Array))
			evo.method = [evo.method];
	});
	if (!poke.hasOwnProperty("stats")) {
		poke.stats = [];
		poke.stats[Stats.health] = 100;
		poke.stats[Stats.attack] = 100;
		poke.stats[Stats.specialAttack] = 100;
		if (poke.name === "Ivysaur") {
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