battler.resetDisplay = function (self) {
	self.display = {
		transition : 1,
		height : 1,
		position : {
			x : 0,
			y : 0,
			z : 0
		},
		angle : 0,
		outlined : false
	};
};
function battler (pokemon) {
	var self = this;
	self.pokemon = pokemon;

	self.reset = function () {
		self.battling = false; // Whether the Pokémon is in the battle right now
		self.side = null;
		self.statLevel = [];
		self.statLevel[Stats.attack] = 0;
		self.statLevel[Stats.defence] = 0;
		self.statLevel[Stats.specialAttack] = 0;
		self.statLevel[Stats.specialDefence] = 0;
		self.statLevel[Stats.speed] = 0;
		self.statLevel[Stats.accuracy] = 0;
		self.statLevel[Stats.evasion] = 0;
		self.statLevel[Stats.critical] = 0;
		self.opponents = []; // Which Pokémon have been battling whilst this Pokémon also has (used to work out which Pokémon gain experience from this one's defeat)
		self.poison = 1;
		self.speed = 0; // A small modifer used to determinate randomly which Pokémon goes first if they both have exactly the same speed.
		self.moveStage = 0;
		self.previousMoves = [];
		self.previousTarget = null;
		self.battlingForDuration = 0; // How many turns the Pokémon has been in the battle for.
		self.flinching = false;
		self.confused = false; // Pretty self-explanatory
		self.recharging = 0;
		self.infatuated = false;
		self.protected = false; // Whether the Pokémon is protecting itself using Protect or Detect
		self.switching = false;
		self.substitute = 0;
		self.grounded = false; // Whether Flying-type Pokémon have been grounded by a move
		self.invulnerable = null;
		self.trapped = []; // By what moves or abilities the Pokémon is trapped
		self.disobeying = false; // Whether the Pokémon is about to disobey their trainer
		self.damaged = [];
		self.damaged[Move.category.physical] = 0;
		self.damaged[Move.category.special] = 0;
		battler.resetDisplay(self);
		self.transform = {
			transformed : false
		};
		foreach(Battle.effects.specific, function (effect) {
			if (effect.target === self)
				effect.expired = true;
		});
	};
	self.reset();

	self.isTrapped = function () {
		return self.trapped.notEmpty() && !self.pokemon.ofType(Types.Ghost);
	};
}