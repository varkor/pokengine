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
		self.poison = 1;
		self.sleep = 0;
		self.speed = 0; // A small modifer used to determinate randomly which Pokémon goes first if they both have exactly the same speed.
		self.moveStage = 0;
		self.previousMove = null;
		self.previousTarget = null;
		self.battlingForDuration = 0; // How many turns the Pokémon has been in the battle for.
		self.flinching = false;
		self.confused = false; // Pretty self-explanatory
		self.cursed = false; // Whether an enemy has used Curse on the Pokémon
		self.recharging = 0;
		self.infatuated = false;
		self.nightmare = false; // Whether the Pokémon is suffering from a nightmare (from Darkrai)
		self.protected = false; // Whether the Pokémon is protecting itself using Protect or Detect
		self.switching = false;
		self.ingrained = false; // Whether the Pokémon has used Ingrain
		self.substitute = 0;
		self.grounded = false; // Whether Flying-type Pokémon have been grounded by a move
		self.invulnerable = null;
		self.trapped = null;
		self.disobeying = false; // Whether the Pokémon is about to disobey their trainer
		self.damaged = [];
		self.damaged[Move.category.physical] = 0;
		self.damaged[Move.category.special] = 0;
		battler.resetDisplay(self);
		if (self.hasOwnProperty("transform") && self.transform.transformed) { // Reverse the Transform
			self.pokemon.species = self.transform.species;
			self.pokemon.stats = self.transform.stats;
			self.pokemon.moves = self.transform.moves;
			self.pokemon.shiny = self.transform.shiny;
			self.pokemon.ability = self.transform.ability;
			self.pokemon.form = self.transform.form;
		}
		self.transform = {
			transformed : false
		};
		foreach(Battle.effects.specific, function (effect) {
			if (effect.target === self)
				effect.expired = true;
		});
	};
	self.reset();
}