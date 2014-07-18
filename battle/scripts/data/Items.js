Items = {
	Other : {
		LuckyEgg : {
			name : "Lucky Egg",
			onetime : false,
			direct : false
		},
	},
	Balls : {
		standard : {
			category : "Ball",
			use : Item.use.capture,
			targets : Move.targets.opponents,
			onetime : true,
			direct : true,
			effect : function (self, poke) {
				if (Battle.situation === Battles.situation.wild) {
					Textbox.state("You threw a " + self.fullname + " at " + poke.name() + "!");
					Battle.attemptCapture(poke, self);
				} else {
					Textbox.state("The other trainer blocked your " + self.fullname + "! You can't catch other people's Pokémon!");
				}
			}
		},
		Poke : {
			name : "Poké",
			catchRate : 1
		},
		Master : {
			name : "Master",
			catchRate : 255
		},
		Clone : {
			name : "Clone",
			catchRate : 255,
			effect : function (self, poke) {
				Textbox.state("You threw a " + self.fullname + " at " + poke.name() + "!");
				if (Battle.situation !== Battles.situation.wild)
					Textbox.state("The other trainer looks on helplessly as your " + self.fullname + " closes in!");
				Battle.attemptCapture(poke, self);
			}
		}
	},
	Berries : {
		standard : {
			category : "Berry",
			use : Item.use.healing,
			targets : Move.targets.party,
			onetime : true,
			direct : true, // Whether you can use it as a trainer, directly
		},
		Sitrus : {
			name : "Sitrus",
			effect : function (self, poke) {
				Battle.healPercentage(poke, 0.25);
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