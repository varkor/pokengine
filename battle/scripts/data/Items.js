Items = {
	"Other" : {
		"Lucky Egg" : {
			use : "experience",
			targets : Move.targets.self,
			onetime : false,
			direct : false,
			useMessage : false,
			effect : function (self) {
				return 1.5;
			},
			effects : [
				{
					event : Triggers.experience,
					action : function (data) {
						return true;
					}
				}
			]
		},
	},
	"Balls" : {
		standard : {
			category : "Ball",
			use : "capture",
			targets : Move.targets.opponents,
			onetime : true,
			direct : true,
			useMessage : false,
			"catch rate" : 1,
			effect : function (self, poke, trainer) {
				if (poke.battler.battle.isWildBattle()) {
					Textbox.state(trainer.pronoun(true) + " threw a " + self.fullname + " at " + poke.name() + "!");
					poke.battler.battle.attemptCapture(poke, self, trainer);
				} else {
					Textbox.state(poke.trainer.pronoun(true) + " blocked " + trainer.possessivePronoun() + " " + self.fullname + "! " + (trainer === Game.player ? "You can't catch other people's Pokémon!" : trainer.pronoun(true) + " tried to capture your Pokémon!"));
				}
			}
		},
		"Poké" : {
		},
		"Luxury" : {
		},
		"Master" : {
			"catch rate" : 255
		},
		"Clone" : {
			"catch rate" : 255,
			effect : function (self, poke, trainer) {
				var thrownByPlayer = (poke.trainer !== poke.battler.battle.alliedTrainers[0]);
				Textbox.state((thrownByPlayer ? poke.battler.battle.alliedTrainers[0] : poke.battler.battle.opposingTrainers[0]).pronoun(true) + " threw a " + self.fullname + " at " + poke.name() + "!");
				if (poke.battler.battle.situation !== Battles.situation.wild)
					Textbox.state((thrownByPlayer ? poke.battler.battle.opposingTrainers[0] : poke.battler.battle.alliedTrainers[0]).pronoun(true) + " look" + (thrownByPlayer ? "s" : "") + " on helplessly as " + (thrownByPlayer ? poke.battler.battle.alliedTrainers[0] : poke.battler.battle.opposingTrainers[0]).possessivePronoun() + " " + self.fullname + " closes in!");
				poke.battler.battle.attemptCapture(poke, self, trainer);
			}
		}
	},
	"Berries" : {
		standard : {
			category : "Berry",
			use : "healing",
			targets : Move.targets.party,
			onetime : true, // Whether the item is used up after its effect has occurred
			direct : true, // Whether you can use it as a trainer, directly (rather than just being a held item)
			useMessage : true
		},
		"Sitrus" : {
			effect : function (self, poke) {
				poke.battler.battle.healPercentage(poke, 0.25, Items._("Berries => Sitrus"));
			},
			effects : [
				{
					event : Triggers.health,
					action : function (data, self, other) {
						if (data.change < 0 && self.health <= self.maximumHealth() / 2)
							return true;
					}
				}
			]
		}
	},
	"Key Stones" : {
		standard : {
			category : "Key Stone"
		},
		"Mega Bracelet" : {
		}
	},
	"Mega Stones" : {
		standard : {
			category : "Mega Stone",
			use : "form change",
			targets : Move.targets.self,
			onetime : false,
			direct : false,
			useMessage : false
		},
		"Pidgeotite" : {
			"Pokémon" : "Pidgeot (Nintendo)",
			"form" : "Mega"
		}
	}
};