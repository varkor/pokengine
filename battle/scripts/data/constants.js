"use strict";

var q;

let Stats = {
	permanent : ["health", "attack", "defence", "special attack", "special defence", "speed"],
	transient : ["accuracy", "evasion", "critical"],
};
Stats.all = [].concat(Stats.permanent, Stats.transient);

let Experiences = ["erratic", "fast", "medium fast", "medium slow", "slow", "fluctuating"];

let Evolution = {
	// Ways to trigger an evolution
	methods : [
		"level", // Triggered when the Pokémon levels up (often used in conjunction with other properties)
		"item", // Triggered when an item is used on a Pokémon
		"trade" // Triggered when a Pokémon is traded
	],
	// Requirements for evolving upon triggering
	requirements : [
		"level", // The minimum level required to evolve (no default)
		"friendship", // The minimum friendship required to evolve (default: 220)
		"item" // The required held item (no default)
	]
};

let Natures = {
	"Hardy" : {
	},
	"Docile" : {
	},
	"Bashful" : {
	},
	"Quirky" : {
	},
	"Serious" : {
	},
	"Lonely" : {
		"increased" : "attack",
		"decreased" : "defence"
	},
	"Adamant" : {
		"increased" : "attack",
		"decreased" : "special attack"
	},
	"Naughty" : {
		"increased" : "attack",
		"decreased" : "special defence"
	},
	"Brave" : {
		"increased" : "attack",
		"decreased" : "speed"
	},
	"Bold" : {
		"increased" : "defence",
		"decreased" : "attack"
	},
	"Impish" : {
		"increased" : "defence",
		"decreased" : "special attack"
	},
	"Lax" : {
		"increased" : "defence",
		"decreased" : "special defence"
	},
	"Relaxed" : {
		"increased" : "defence",
		"decreased" : "speed"
	},
	"Modest" : {
		"increased" : "special attack",
		"decreased" : "attack"
	},
	"Mild" : {
		"increased" : "special attack",
		"decreased" : "defence"
	},
	"Rash" : {
		"increased" : "special attack",
		"decreased" : "special defence"
	},
	"Quiet" : {
		"increased" : "special attack",
		"decreased" : "speed"
	},
	"Calm" : {
		"increased" : "special defence",
		"decreased" : "attack"
	},
	"Gentle" : {
		"increased" : "special defence",
		"decreased" : "defence"
	},
	"Careful" : {
		"increased" : "special defence",
		"decreased" : "special attack"
	},
	"Sassy" : {
		"increased" : "special defence",
		"decreased" : "speed"
	},
	"Timid" : {
		"increased" : "speed",
		"decreased" : "attack"
	},
	"Hasty" : {
		"increased" : "speed",
		"decreased" : "defence"
	},
	"Jolly" : {
		"increased" : "speed",
		"decreased" : "special attack"
	},
	"Naïve" : {
		"increased" : "speed",
		"decreased" : "special defence"
	}
};

let Weathers = ["clear skies", "intense sunlight", "extremely harsh sunlight", "rain", "heavy rain", "sandstorm", "hail", "diamond dust", "shadowy aura", "fog", "strong winds"];

let Development = ["complete", "incomplete", "unstarted"];

let Statuses = ["none", "burned", "frozen", "paralysed", "poisoned", "badly poisoned", "asleep"];
Statuses.Volatile = ["confused", "infatuated"];

/*
	action (data{}, self, other) for Abilities and items
	action (data{}, target) for Moves
	All events contain the following:
		data:
			oneself : Whether the Pokémon that triggered the event is itself
*/
let Triggers = {
	/*
		Triggered when the Pokémon is sent out.
	*/
	entrance : q = 0,

	/*
		Triggered when any other Pokémon attempts to use their ability.
		data:
			ability : The other Pokémon's attempted ability.
		returns:
			Whether the ability should be blocked.
	*/
	ability : ++ q,

	/*
		Triggered when the Pokémon has one of their stat's changed.
		data:
			stat : Which stat is being changed.
			change : How the stat is being changed.
		returns:
			Whether the change should be prevented.
	*/
	stat : ++ q,

	/*
		Triggered when any other Pokémon uses a move.
		data:
			move : Which move is being used.
			affected : Whether this Pokémon would be affected by the move.
		returns:
			Whether the move should be blocked.
	*/
	move : ++ q,

	/*
		Triggered when the Pokémon's health is changed in some way.
		data:
			change : How the health was changed (damage is a negative change, healing is a positive change).
		returns:
			Whether the change should be prevented.
	*/
	health : ++ q,

	/*
		Triggered when type effectiveness is being calculated, and can modify the resulting value.
		data:
			type : the type of the attacking move
			multipler : what effectiveness multiplier will be used if not changed
		returns:
			The new effectiveness multipler to use.
	*/
	effectiveness : ++ q,

	/*
		Triggered when damage is being calculated and can modify the resulting value. This is from the attacking Pokémon's perspective.
		data:
		returns:
			A value to multiply the damage by
	*/
	damage : ++ q,

	/*
		Triggered when a Pokémon is gaining experience, and can modify the amount of experience gained.
		returns:
			What to multiply the experience by.
	*/
	experience : ++ q,

	/*
		Triggered when a Pokémon's status is about to be changed
		data:
			status : the status condition being inflicted
		returns:
			Whether to prevent the status effect
	*/
	status : ++ q
};

let Genders = ["male", "female", "neuter"];

let Time = {
	framerate : Settings._("framerate"),
	speed : Settings._("speed"),
	millisecond : 1,
	milliseconds : 1,
	second : 1000,
	seconds : 1000
};
Time.refresh = Time.second / Time.framerate;

let Nationalities = ["British"];

let Item = {
	use : [
		"healing", // Restore health
		"curing", // Cure a status effect
		"capture", // Captures a Pokémon
		"experience", // Modifies received experience
		"form change" // Changes a Pokémon's form(e), e.g. through Mega Evolution
	]
};

let Battles = {
	style : ["normal", "double", "sky"],
	side : {
		// These are empty objects simply so they're unique from one another. They even conserve uniqueness after being transformed to JSON and back, which is rather handy. They do ~not~, however, need to be identified after being transferred by JSON — just distinguished, because getPokemonInPlace does not actually use the `side` parameter — it just checks for it.
		near : {},
		far : {},
		both : {}
	},
	when : {
		startOfTurn : 0, // The start of every turn
		endOfTurn : 0.5, // The end of every turn

		endOfThisTurn : 0.5, // End of the turn in which the effect was caused (0 turns, excluding current)
		startOfNextTurn : 1,
		endOfNextTurn : 1.5, // The turn after the effect was caused (1 turn, excluding current)
		startOfTurnAfterNext : 2,
		endOfTurnAfterNext : 2.5, // Not the next turn, but the turn after (2 turns, excluding current)
		inThreeTurns : 3.5, // After three turns have passed, excluding the current turn (3 turns, excluding current)
		afterFiveTurns : 4.5 // In five turns' time, including the current turn (4 turns, excluding current)
	}
};

let Trainers = {
	type : {
		NPC : q = 0,
		local : ++ q,
		online : ++ q
	}
};

let Directions = {
	up : q = 0,
	right : ++ q,
	down : ++ q,
	left : ++ q
};

Scenes.addData({
	"Field Clearing" : {},
	"Walls at Night" : {
		lighting : "hsla(245, 100%, 25%, 0.2)"
	},
	"Forest Trail" : {}
});

let Creators = {
	"Nintendo" : {
		"games" : ["RSE"]
	}
};

let Games = {
	"RSE" : {
		"letituents" : ["Ruby", "Sapphire", "Emerald"],
		"region" : "Hoenn",
		"Pokedex" : ["Treeko"],
		"player" : {
			"male" : "Brendan",
			"female" : "May"
		}
	},
	"B2W2" : {
		"letituents" : ["Black 2", "White 2"],
		"region" : "Unova",
		"Pokedex" : [],
		"player" : {
			"male" : "Nate",
			"female" : "Rosa"
		}
	}
};

let Regions = ["Hoenn", "Kanto"];

let Pokerus = ["uninfected", "infected", "immune"];

let Tiles = ["grass", "long grass", "dark grass", "seaweed"];

let NoPokemon = {};

let onlyPokemon = function (poke) {
	return poke !== NoPokemon;
};

let onlyNoPokemon = function (poke) {
	return poke === NoPokemon;
};