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
	"Overcoat" : {
		effects : [
			{
				event : Triggers.move,
				affected : true,
				action : function (data, self, other) {
					if (data.move.classification.contains("Powder")) {
						if (!self.battler.battle.process) Textbox.state(self.name() + "'s Powder protects " + self.personalPronoun() + " from " + other.name() + "'s powder-based attack!");
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
	"Equilibrium" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Fairy",
				action : function (data, self, other) {
					return 0.5;
				}
			}
		]
	},
	"Flash Fire" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Fire",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Flash Fire protects " + self.personalPronoun() + " from " + other.name() + "'s Fire-type attack!");
					return 0;
				}
			}
		]
	},
	"Heatproof" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Fire",
				action : function (data, self, other) {
					return 0.5;
				}
			}
		]
	},
	"Holy Guard" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Dragon",
				action : function (data, self, other) {
					return 0.5;
				}
			}
		]
	},
	"Ignition" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Fire",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Ignition protects " + self.personalPronoun() + " from " + other.name() + "'s Fire-type attack!");
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
	"Lightningrod" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Electric",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Lightningrod protects " + self.personalPronoun() + " from " + other.name() + "'s Electric-type attack!");
					return 0;
				}
			}
		]
	},
	"Motor Drive" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Electric",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Motor Drive protects " + self.personalPronoun() + " from " + other.name() + "'s Electric-type attack!");
					return 0;
				}
			}
		]
	},
	"Mountaineer" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Rock",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Mountaineer protects " + self.personalPronoun() + " from " + other.name() + "'s Rock-type attack!");
					return 0;
				}
			}
		]
	},
	"Pinwheel" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Flying",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Pinwheel protects " + self.personalPronoun() + " from " + other.name() + "'s Flying-type attack!");
					return 0;
				}
			}
		]
	},
	"Sap Sipper" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Grass",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Sap Sipper protects " + self.personalPronoun() + " from " + other.name() + "'s Grass-type attack!");
					return 0;
				}
			}
		]
	},
	"Storm Drain" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Water",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Storm Drain protects " + self.personalPronoun() + " from " + other.name() + "'s Water-type attack!");
					return 0;
				}
			}
		]
	},
	"Thick Fat" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Fire",
				action : function (data, self, other) {
					return 0.5;
				}
			}
		]
	},
	"Updraft" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Flying",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Updraft protects " + self.personalPronoun() + " from " + other.name() + "'s Flying-type attack!");
					return 0;
				}
			}
		]
	},
	"Volt Absorb" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Electric",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Volt Absorb protects " + self.personalPronoun() + " from " + other.name() + "'s Electric-type attack!");
					return 0;
				}
			}
		]
	},
	"Water Absorb" : {
		effects : [
			{
				event : Triggers.effectiveness,
				type : "Water",
				action : function (data, self, other) {
					if (!self.battler.battle.process) Textbox.state(self.name() + "'s Water Absorb protects " + self.personalPronoun() + " from " + other.name() + "'s Water-type attack!");
					return 0;
				}
			}
		]
	},
	"Cacophony" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Sound",
				action : function (data, self, other) {
					return 1.2;
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
	"Mega Launcher" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Pulse",
				action : function (data, self, other) {
					return 1.5;
				}
			}
		]
	},
	"Power Leech" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Draining",
				action : function (data, self, other) {
					return 1.2;
				}
			}
		]
	},
	"Strong Jaw" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Jaw",
				action : function (data, self, other) {
					return 1.5;
				}
			}
		]
	},
	"Sharpshooter" : {
		effects : [
			{
				event : Triggers.damage,
				classification : "Ballistics",
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
