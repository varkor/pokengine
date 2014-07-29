var q;

Types = {
	unknown : q = 0,
	typeless : q,
	normal : ++ q,
	fighting : ++ q,
	flying : ++ q,
	poison : ++ q,
	ground : ++ q,
	rock : ++ q,
	bug : ++ q,
	ghost : ++ q,
	steel : ++ q,
	fire : ++ q,
	water : ++ q,
	grass : ++ q,
	electric : ++ q,
	psychic : ++ q,
	ice : ++ q,
	dragon : ++ q,
	dark : ++ q,
	fairy : ++ q
};

Stats = {
	health : q = 0,
	attack : ++ q,
	defence : ++ q,
	specialAttack : ++ q,
	specialDefence : ++q,
	speed : ++ q,
	accuracy : ++ q,
	evasion : ++ q,
	critical : ++ q,
	string : function (stat) {
		switch (stat) {
			case Stats.health:
				return "health";
			case Stats.attack:
				return "attack";
			case Stats.defence:
				return "defence";
			case Stats.specialAttack:
				return "special attack";
			case Stats.specialDefence:
				return "special defence";
			case Stats.speed:
				return "speed";
			case Stats.accuracy:
				return "accuracy";
			case Stats.evasion:
				return "evasion";
		}
	}
};

Experiences = {
	erratic : q = 0,
	fast : ++ q,
	mediumFast : ++ q,
	mediumSlow : ++ q,
	slow : ++ q,
	fluctuating : ++ q
};

Evolution = {
	level : q = 0, // [Without property] The Pokémon levels up (useful in conjunction with other conditions), [With proprty] The Pokémon reaches or exceeds the specified level
	friendship : ++ q // [Without property] The Pokémon reaches or exceeds a friendship of 220, [With property] The Pokémon reaches or exceeds the specified friendship
};

Natures = {
	Hardy : {
	},
	Lonely : {
		increased : Stats.attack,
		decreased : Stats.defence
	}
};

Weathers = {
	clear : q = 0,
	intenseSunlight : ++ q,
	rain : ++ q,
	sandstorm : ++ q,
	hail : ++ q,
	diamondDust : ++ q,
	shadowyAura : ++ q,
	fog : ++ q
};

Development = {
	complete : q = 0,
	incomplete : ++ q,
	unstarted : ++ q
};

Statuses = {
	none : q = 0,
	burned : ++ q,
	frozen : ++ q,
	paralysed : ++ q,
	poisoned : ++ q,
	badlyPoisoned : ++ q,
	asleep : ++ q,
	Volatile : {
		confused : q = 0
	}
};

/*
	All events contain the following:
		data:
			oneself : Whether the Pokémon that triggered the event is itself
*/
Events = {
	/*
		Triggered when the Pokémon is sent out.
		action (data{}, self, other)
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
			change : How the health was changed.
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
		Triggered when a Pokémon is gaining experience, and can modify the amount of experience gained.
		returns:
			What to multiply the experience by.
	*/
	experience : ++ q
};

Genders = {
	male : q = 0,
	female : ++ q,
	neuter : ++ q
};

Time = {
	now : function () {
		return new Date().getTime();
	},
	framerate : 60,
	millisecond : 1,
	milliseconds : 1,
	second : 1000,
	seconds : 1000
};
Time.refresh = Time.second / Time.framerate;

Nationalities = {
	British : q = 0
};

Item = {
	use : {
		healing : q = 0, // Restore health
		curing : ++ q, // Cure a status effect
		capture : ++ q, // Captures a Pokémon
		experience : ++ q // Modifies received experience
	}
};

Pokeballs = {
	Poke : {
		name : "Poké Ball"
	},
	Luxury : {
		name : "Luxury Ball"
	}
};

Teams = {
	allies : q = 0,
	opponents : ++ q
};

Battles = {
	situation : {
		wild : q = 0,
		trainer : ++ q
	},
	style : {
		normal : q = 0,
		double : ++ q,
		triple : ++ q,
		rotation : ++ q,
		sky : ++ q,
		inverse : ++ q,
		horde : ++ q
	},
	side : {
		near : q = 0,
		far : ++ q
	},
	when : {
		endOfThisTurn : 0.5, // End of the turn in which the effect was caused (0 turns, excluding current)
		startOfNextTurn : 1,
		endOfNextTurn : 1.5, // The turn after the effect was caused (1 turn, excluding current)
		startOfTurnAfterNext : 2,
		endOfTurnAfterNext : 2.5, // Not the next turn, but the turn after (2 turns, excluding current)
		inThreeTurns : 3.5, // After three turns have passed, excluding the current turn (3 turns, excluding current)
		afterFiveTurns : 4.5 // In five turns' time, including the current turn (4 turns, excluding current)
	}
};

NoPokemon = {};

onlyPokemon = function (poke) {
	return poke !== NoPokemon;
};