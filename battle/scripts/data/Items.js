Items = {
	Other : {
		LuckyEgg : {
			name : "Lucky Egg",
			use : Item.use.experience,
			targets : Move.targets.self,
			onetime : false,
			direct : false,
			useMessage : false,
			effect : function (self) {
				return 1.5;
			},
			effects : [
				{
					event : Events.experience,
					action : function (data) {
						return true;
					}
				}
			]
		},
	},
	Balls : {
		standard : {
			category : "Ball",
			use : Item.use.capture,
			targets : Move.targets.opponents,
			onetime : true,
			direct : true,
			useMessage : false,
			effect : function (self, poke, trainer) {
				if (Battle.situation === Battles.situation.wild) {
					Textbox.state(capitalise(trainer.pronoun()) + " threw a " + self.fullname + " at " + poke.name() + "!");
					Battle.attemptCapture(poke, self, trainer);
				} else {
					Textbox.state(capitalise(poke.trainer.pronoun()) + " blocked " + trainer.possessivePronoun() + " " + self.fullname + "! " + (trainer === Game.player ? "You can't catch other people's Pokémon!" : capitalise(trainer.pronoun()) + " tried to capture your Pokémon!"));
				}
			}
		},
		Poke : {
			name : "Poké",
			catchRate : 1
		},
		Luxury : {
			name : "Luxury",
			catchRate : 1
		},
		Master : {
			name : "Master",
			catchRate : 255
		},
		Clone : {
			name : "Clone",
			catchRate : 255,
			effect : function (self, poke, trainer) {
				var thrownByPlayer = (poke.trainer !== Battle.alliedTrainers[0]);
				Textbox.state(capitalise((thrownByPlayer ? Battle.alliedTrainers[0] : Battle.opposingTrainers[0]).pronoun()) + " threw a " + self.fullname + " at " + poke.name() + "!");
				if (Battle.situation !== Battles.situation.wild)
					Textbox.state(capitalise((thrownByPlayer ? Battle.opposingTrainers[0] : Battle.alliedTrainers[0]).pronoun()) + " look" + (thrownByPlayer ? "s" : "") + " on helplessly as " + (thrownByPlayer ? Battle.alliedTrainers[0] : Battle.opposingTrainers[0]).possessivePronoun() + " " + self.fullname + " closes in!");
				Battle.attemptCapture(poke, self, trainer);
			}
		}
	},
	Berries : {
		standard : {
			category : "Berry",
			use : Item.use.healing,
			targets : Move.targets.party,
			onetime : true, // Whether the item is used up after its effect has occurred
			direct : true, // Whether you can use it as a trainer, directly (rather than just being a held item)
			useMessage : true
		},
		Sitrus : {
			name : "Sitrus",
			effect : function (self, poke) {
				Battle.healPercentage(poke, 0.25, Items.Berries.Sitrus);
			},
			effects : [
				{
					event : Events.health,
					action : function (data, self, other) {
						if (data.change < 0 && self.health <= self.maximumHealth() / 2)
							return true;
					}
				}
			]
		}
	}
};

forevery(Items, function (category) {
	var standard = (category.hasOwnProperty("standard") ? category.standard : {});
	forevery(category, function (item) {
		if (item === standard)
			return;
		forevery(standard, function (value, key) {
			if (!item.hasOwnProperty(key))
				item[key] = value;
		});
		item.fullname = item.name + (["Berry", "Ball"].contains(item.category) ? " " + item.category : "");
	});
});