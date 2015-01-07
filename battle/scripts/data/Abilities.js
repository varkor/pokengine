Abilities = {
	"Intimidate" : {
		effects : [
			{
				event : Triggers.entrance,
				oneself : true,
				action : function (data, self, other) {
					Textbox.state(self.name() + "'s Intimidate is lowering the Attack of the opposing Pokémon!");
					foreach(Battle.opponentsTo(self), function (poke) {
						Battle.stat(poke, "attack", -1, self);
					});
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
						Textbox.state(self.name() + "'s Hyper Cutter prevents " + self.possessivePronoun() + " Attack from being lowered!");
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
						Textbox.state(self.name() + "'s Soundproof protects " + self.personalPronoun() + " from " + other.name() + "'s sound-based attack!");
						return true;
					}
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
					if (!Battle.active || !self.battler.grounded) {
						if (other)
							Textbox.state(self.name() + "'s Levitate protects " + self.personalPronoun() + " from " + other.name() + "'s Ground-type attack!");
						return 0;
					}
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
_method(Abilities);