Abilities = {
	Intimidate : {
		name : "Intimidate",
		effects : [
			{
				event : Events.entrance,
				oneself : true,
				action : function (data, self, other) {
					Textbox.state(self.name() + "'s " + Abilities.Intimidate.name + " is lowering the Attack of the opposing Pokémon!");
					foreach(Battle.opponentsTo(self), function (poke) {
						Battle.stat(poke, Stats.attack, -1, self);
					});
				}
			}
		]
	},
	HyperCutter : {
		name : "Hyper Cutter",
		effects : [
			{
				event : Events.stat,
				oneself : false,
				stat : Stats.attack,
				action : function (data, self, other) {
					if (data.change < 0 || (data.change === 0 && self.battler.statLevel[Stats.attack] > 0)) {
						Textbox.state(self.name() + "'s " + Abilities.HyperCutter.name + " prevents " + self.possessivePronoun() + " Attack from being lowered!");
						return true;
					}
				}
			}
		]
	},
	Soundproof : {
		name : "Soundproof",
		effects : [
			{
				event : Events.move,
				affected : true,
				action : function (data, self, other) {
					if (data.move.classification.contains("Sound")) {
						Textbox.state(self.name() + "'s " + Abilities.Soundproof.name + " protects " + self.personalPronoun() + " from " + other.name() + "'s sound-based attack!");
						return true;
					}
				}
			}
		]
	},
	Levitate : {
		name : "Levitate",
		effects : [
			{
				event : Events.effectiveness,
				type : Types.ground,
				action : function (data, self, other) {
					if (!Battle.active || !self.battler.grounded) {
						if (other)
							Textbox.state(self.name() + "'s " + Abilities.Levitate.name + " protects " + self.personalPronoun() + " from " + other.name() + "'s Ground-type attack!");
						return 0;
					}
				}
			}
		]
	}
};