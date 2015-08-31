Abilities = {
	"Intimidate" : {
		effects : [
			{
				event : Triggers.entrance,
				oneself : true,
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Intimidate is lowering the Attack of the opposing Pokémon!");
					foreach(self.battler.battle.opponentsTo(self), function (poke) {
						poke.battler.battle.stat(poke, "attack", -1, self);
					});
				}
			}
		]
	},
	"Teary-Eyed" : {
		effects : [
			{
				event : Triggers.entrance,
				oneself : true,
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Teary-Eyed is lowering the Special Defence of the opposing Pokémon!");
					foreach(self.battler.battle.opponentsTo(self), function (poke) {
						poke.battler.battle.stat(poke, "special defence", -1, self);
					});
				}
			}
		]
	},
	"Big Pecks" : {
		effects : [
			{
				event : Triggers.stat,
				oneself : false,
				stat : "defence",
				action : function (data, self, other) {
					if (data.change < 0 || (data.change === 0 && self.battler.statLevel["defence"] > 0)) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Big Pecks prevents " + self.possessivePronoun() + " Defence from being lowered!");
						return true;
					}
				}
			}
		]
	},
	"Hyper Cutter" : {
		effects : [
			{
				event : Triggers.stat,
				oneself : false,
				stat : "attack",
				action : function (data, self, other) {
					if (data.change < 0 || (data.change === 0 && self.battler.statLevel["attack"] > 0)) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Hyper Cutter prevents " + self.possessivePronoun() + " Attack from being lowered!");
						return true;
					}
				}
			}
		]
	},
	"Keen Eye" : {
		effects : [
			{
				event : Triggers.stat,
				oneself : false,
				stat : "accuracy",
				action : function (data, self, other) {
					if (data.change < 0 || (data.change === 0 && self.battler.statLevel["accuracy"] > 0)) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Keen Eye prevents " + self.possessivePronoun() + " Accuracy from being lowered!");
						return true;
					}
				}
			}
		]
	},
	"Bulletproof" : {
		effects : [
			{
				event : Triggers.move,
				affected : true,
				action : function (data, self, other) {
					if (data.move.classification.contains("Ballistics")) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Bulletproof protects " + self.personalPronoun() + " from " + other.name() + "'s ballistics-based attack!");
						return true;
					}
				}
			}
		]
	},
	"Soundproof" : {
		effects : [
			{
				event : Triggers.move,
				affected : true,
				action : function (data, self, other) {
					if (data.move.classification.contains("Sound")) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Soundproof protects " + self.personalPronoun() + " from " + other.name() + "'s sound-based attack!");
						return true;
					}
				}
			}
		]
	},
	"Dry Skin" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Water",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Dry Skin protects " + self.personalPronoun() + " from " + other.name() + "'s Water-type attack!");
					return 0;
				}
			}
		]
	},
	"Levitate" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Ground",
				action : function (data, self, other) {
					if (!self.battler.grounded) {
						if (other)
							if (!self.battler.battle.process) Textbox.state(self.name() + "'s Levitate protects " + self.personalPronoun() + " from " + other.name() + "'s Ground-type attack!");
						return 0;
					}
				}
			}
		]
	},
	"Iron Fist" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Punch",
				action : function (data, self, other) {
					return 1.2;
				}
			}
		]
	},
	"Overgrow" : {
		effects : [
			{
				event : Triggers.move,
				type : "Grass",
				action : function (data, self, other) {
					/*if (self.health < self.maximumHealth() * 0.5)
						return 1.5;
					else
						return 1;*/
				}
			}
		]
	}
};