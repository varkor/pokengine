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
		self.side = null;
		self.statLevel = [];
		self.statLevel = {};
		foreach(Stats, function (stat) {
			self.statLevel[stat] = 0;
		});
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
		self.reserved = false; // Whether the Pokémon is going to be sent out next time, so can't be a second time (in a double battle, for instance)
		battler.resetDisplay(self);
		self.transform = {
			transformed : false
		};
		if (self.pokemon.currentMoves)
			foreach(self.pokemon.currentMoves(), function (move) {
				delete move.disabled;
			});
		if (self.battling)
			foreach(self.battle.effects.specific, function (effect) {
				if (effect.target === self)
					effect.expired = true;
			});
		self.battling = false; // Whether the Pokémon is in the battle right now
		self.battle = null; // Which battle object is responsible for this battler
	};
	self.reset();

	self.isTrapped = function () {
		return self.trapped.notEmpty() && !self.pokemon.ofType("Ghost");
	};
}