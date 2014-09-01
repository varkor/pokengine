function pokemon (data) {
	var self = this;

	_method(self);

	if (arguments.length < 1)
		data = {};
	var setProperty = function (property, value) {
		if (data.hasOwnProperty(property))
			self[property] = data[property];
		else
			self[property] = (typeof value === "function" ? value() : value);
	};

	setProperty("species", "Missingno.");
	setProperty("nickname", null);
	setProperty("unique", Game.unique());
	setProperty("level", 1);
	setProperty("nature", Natures.Lonely);
	setProperty("gender", Genders.male);
	setProperty("moves", function () {
		return [{
			move : "Tackle",
			PP : Moves._("Tackle").PP,
			PPups : 0,
			number : 0
		}];
	});
	setProperty("ability", null);
	setProperty("status", Statuses.none);
	setProperty("IVs", function () {
		var IVs = [];
		for (var i = Stats.health; i <= Stats.speed; ++ i) {
			IVs[i] = srandom.int(0, 31);
		}
		return IVs;
	});
	setProperty("EVs", [0, 0, 0, 0, 0, 0]);
	setProperty("experience", 0);
	setProperty("nationality", Nationalities.British);
	setProperty("item", null);
	setProperty("form", null);
	setProperty("friendship", Pokemon._(self.species).friendship);
	setProperty("pokeball", null);
	setProperty("shiny", function () {
		return srandom.chance(8192);
	});
	setProperty("egg", null);
	setProperty("caught", null);
	setProperty("ribbons", []);

	self.trainer = null;
	self.stats = [];

	self.currentSpecies = function () {
		return self._("-> battler ~> transform => species");
	};

	self.currentMoves = function () {
		return self._("-> battler ~> transform => moves");
	};
	
	self.stats[Stats.health] = function () {
		return Math.floor(((self.IVs[Stats.health] + 2 * Pokemon._(self.currentSpecies()).stats[Stats.health] + self.EVs[Stats.health] / 4 + 100) * self.level) / 100 + 10);
	};
	for (var i = Stats.attack; i <= Stats.speed; ++ i) {
		(function (stat) {
			self.stats[stat] = function (stageModifier) {
				return Math.floor(((((self.IVs[stat] + 2 * Pokemon._(self.currentSpecies()).stats[stat] + self.EVs[stat] / 4) * self.level) / 100 + 5) * (self.nature.increased === stat ? 1.1 : self.nature.decreased === stat ? 0.9 : 1)) * (stageModifier ? (self.battler.statLevel[stat] >= 0 ? 1 + 0.5 * self.battler.statLevel[stat] : 2 / (2 - self.battler.statLevel[stat])) : 1));
			};
		})(i);
	}

	setProperty("health", self.stats[Stats.health]());

	self.battler = new battler(self);

	self.paths = {
		sprite : function (which, includeFiletype) {
			return "pokemon/" + Pokemon._(self.currentSpecies()).region + "/" + self.currentSpecies() + (which ? "~" + which : "") + (includeFiletype ? ".png" : "");
		},
		cry : function (includeFiletype) {
			return "pokemon/" + Pokemon._(self.currentSpecies()).region + "/" + self.currentSpecies() + (includeFiletype ? ".mp3" : "");
		}
	};

	self.name = function () {
		return (self.egg === null ? (self.nickname || self.species) : "Egg");
	};

	self.store = function () {
		// Returns an object that contains all the data for the Pokémon, without any methods
		var store = {};
		foreach(["species", "health", "item", "moves", "ability", "pokeball", "nickname", "unique", "level", "nature", "gender", "status", "IVs", "EVs", "experience", "nationality", "form", "friendship", "shiny", "egg", "ribbons", "caught"], function (property) {
			store[property] = JSONcopy(self._(property));
		});
		return JSONcopy(store);
	};

	self.learn = function (move, initial, learnRegardless) {
		if (foreach(self.moves, function (check) {
			if (check.move === move && !learnRegardless) // Don't learn a move you already know
				return true;
		}))
			return false;
		if (self.moves.length < 4) {
			if (!initial)
				Textbox.state(self.name() + " learnt " + move + "!");
			self.moves.push({
				move : move,
				number : self.moves.length,
				PP : Moves._(move).PP,
				PPups : 0
			});
		} else {
			var resumeNormalProceedings;
			if (Battle.active) {
				resumeNormalProceedings = function () {
					Battle.delayForInput = false;
					Battle.prompt();
				};
				Battle.delayForInput = true;
			} else {
				resumeNormalProceedings = function () {};
			}
			Textbox.state(self.name() + " wants to learn " + move + ". But " + self.name() + " already knows 4 moves!");
			var immediatelyProceeding = Textbox.confirm("Do you want " + self.name() + " to forget a move to make room for " + move + "?", function (response) {
				if (response === "Yes") {
					var moves = [], hotkeys = {};
					hotkeys[Game.key.secondary] = "Never mind";
					foreach(self.moves, function (move) {
						moves.push(move.move);
					});
					immediatelyProceeding = Textbox.insertAfter(Textbox.ask("Which move do you want " + self.name() + " to forget?", moves, function (response, i, major) {
						if (major) {
							Textbox.insertAfter(Textbox.state(self.name() + " forgot " + self.moves[i].move + " and learnt " + move + "!", resumeNormalProceedings), immediatelyProceeding);
							self.moves[i] = {
								move : move,
								number : i,
								PP : move.PP,
								PPups : 0
							};
						} else
							Textbox.insertAfter(Textbox.state(self.name() + " didn't learn " + move + ".", resumeNormalProceedings), immediatelyProceeding);
					}, ["Never mind"], null, hotkeys), immediatelyProceeding);
				} else
					Textbox.insertAfter(Textbox.state(self.name() + " didn't learn " + move + ".", resumeNormalProceedings), immediatelyProceeding);
			});
		}
	};

	self.forget = function (move, initial) {
		if (foreach(self.moves, function (check, i, deletion) {
			if (check.move === move) {
				deletion.push(i);
				return true;
			}
		})) {
			if (!initial)
				Textbox.state(self.name() + " forgot " + move + "!");
			return true;
		}
	};

	self.maximumHealth = function () {
		return self.stats[Stats.health]();
	};

	self.totalEVs = function () {
		return sum(self.EVs);
	};

	self.gainExperience = function (defeated, sharedBetween) {
		if (self.trainer === null || self.trainer.isAnNPC())
			return;
		sharedBetween = sharedBetween || 1;
		var participated = true, eventModifiers = product(Battle.triggerEvent(Events.experience, {}, defeated, self));
		var gain = Math.ceil((((Battle.situation === Battles.situation.trainer ? 1.5 : 1) * Pokemon.defeated.species).yield.experience * defeated.level) / (5 * (participated ? 1 : 2)) * Math.pow((2 * defeated.level + 10) / (defeated.level + self.level + 10)._(2.5) + 1) * (self.caught && self.trainer.unique === self.caught.trainer ? 1 : self.trainer.nationality === self.nationality ? 1.5 : 1.7) * eventModifiers / sharedBetween);
		if (Battle.active)
			Textbox.state(self.name() + " gained " + gain + " experience!");
		while (self.level < 100 && self.experience + gain >= self.experienceFromLevelToNextLevel()) {
			gain -= self.experienceFromLevelToNextLevel() - self.experience;
			self.experience = self.experienceFromLevelToNextLevel();
			var display = Display.state.save();
			Textbox.effect(function (display) { return function () { return Display.state.transition(display); }; }(display));
			self.raiseLevel();
			self.experience = 0;
			if (Battle.active) {
			var display = Display.state.save();
				Textbox.state(self.name() + " has grown to level " + self.level + "!", function (display) { return function () { Display.state.load(display); }; }(display));
			}
			if (Pokemon._(self.species).moveset.hasOwnProperty(self.level)) {
				foreach(Pokemon._(self.species).moveset[self.level], function (move) {
					self.learn(move);
				});
			}
			// Cycle through all the available evolutions
			/*
			foreach(Pokemon._(self.species).evolution, function (evo) {
				// Cycle through all the conditions for evolutions, e.g. levelling up and/while having a high friendship
				if (!foreach(evo.method, function (method) {
					switch (method) {
						case Evolution.level:
							return (self.level < (evo.hasOwnProperty("level") ? evo.level : self.level));
						case Evolution.friendship:
							return (self.friendship < (evo.hasOwnProperty("friendship") ? evo.friendship : 220));
					}
				})) {
					self.evolve(evo);
					return true;
				}
			});*/
		}
		if (self.level < 100)
			self.experience = gain;
		var maximumEVgain = 510 - self.totalEVs(), maximumEVgainForStat;
		for (var i = Stats.health; i <= Stats.speed; ++ i) {
			maximumEVgainForStat = Math.min(maximumEVgain, Pokemon._(defeated.species).yield.EVs[i]);
			maximumEVgainForStat = Math.min(maximumEVgainForStat, 252 - maximumEVgainForStat);
			maximumEVgain -= maximumEVgainForStat;
			self.EVs[i] += maximumEVgainForStat;
		}
		if (Battle.active) {
			var display = Display.state.save();
			Textbox.effect(function () { return Display.state.transition(display); });
		}
	};

	self.raiseLevel = function () {
		var previousMaximumHealth = self.stats[Stats.health]();
		++ self.level;
		self.health = Math.min(self.stats[Stats.health](), self.health + self.stats[Stats.health]() - previousMaximumHealth);
		self.friendship += (self.friendship < 100 ? 5 : self.friendship < 200 ? 3 : self.friendship < 256 ? 2 : 0) + (self.pokeball === Items.Balls.Luxury ? 1 : 0) + (self.caught && self.trainer && self.trainer.location === self.caught.location ? 1 : 0);
		self.friendship = Math.min(self.friendship, 255);
	};

	self.evolve = function (evolution) {
		Textbox.state(self.name() + " evolved from " + article(self.species) + " " + self.species + " into " + article(evolution.species) + " " + evolution.species + "!");
		self.species = evolution.species;
		if (Pokemon._(self.species).moveset.hasOwnProperty(self.level)) {
			foreach(Pokemon._(self.species).moveset[self.level], function (move) {
				self.learn(move);
			});
		}
	};

	self.raiseToLevel = function (level) {
		self.experience = 0;
		if (self.level > level)
			return;
		while (self.level < level)
			self.raiseLevel();
	};

	self.experienceFromLevelToNextLevel = function () {
		if (self.level === 100)
			return null;
		return self.experienceAtLevel(self.level + 1) - self.experienceAtLevel(self.level);
	};

	self.experienceAtLevel = function (level) {
		var n = level;
		switch (Pokemon._(self.species).experience) {
			case Experiences.erratic:
				if (n <= 50)
					return Math.ceil(Math.pow(n, 3) * (100 - n) / 50);
				else if (n <= 68)
					return Math.ceil(Math.pow(n, 3) * (150 - n) / 100);
				else if (n <= 98)
					return Math.ceil(Math.pow(n, 3) * ((1911 - 10 * n) / 3) / 500);
				else
					return Math.ceil(Math.pow(n, 3) * (160 - n) / 100);
				break;
			case Experiences.fast:
				return Math.ceil(4 * Math.pow(n, 3) / 5);
			case Experiences.mediumFast:
				return Math.ceil(Math.pow(n, 3));
			case Experiences.mediumSlow:
				return Math.ceil(6 / 5 * Math.pow(n, 3) - 15 * Math.pow(n, 2) + 100 * n - 140);
			case Experiences.slow:
				return Math.ceil(5 * Math.pow(n, 3) / 4);
			case Experiences.fluctuating:
				if (n <= 15)
					return Math.ceil(Math.pow(n, 3) * (((n + 1) / 3 + 24) / 50));
				else if (n <= 36)
					return Math.ceil(Math.pow(n, 3) * ((n + 14) / 50));
				else
					return Math.ceil(Math.pow(n, 3) * ((n / 2 + 32) / 50));
				break;
		}
	};

	self.ofType = function () {
		for (var i = 0; i < arguments.length; ++ i)
			if (Pokemon._(self.currentSpecies()).types.indexOf(arguments[i]) > -1)
				return true;
		return false;
	};

	self.pronoun = function () {
		return (self.gender === Genders.male ? "he" : self.gender === Genders.female ? "she" : "it");
	};
	self.possessivePronoun = function () {
		return (self.gender === Genders.male ? "his" : self.gender === Genders.female ? "her" : "its");
	};
	self.personalPronoun = function () {
		return (self.gender === Genders.male ? "him" : self.gender === Genders.female ? "her" : "it");
	};
	self.selfPronoun = function () {
		return self.personalPronoun() + "self";
	};

	self.effectiveness = function (attackType, byWhom) {
		var multiplier = 1, current;
		foreach(Pokemon._(self.currentSpecies()).types, function (type) {
			if (attackType === Types.ground && type === Types.flying && self.battler.grounded)
				return;
			multiplier *= Move.effectiveness(attackType, type);
		});
		var modification = Battle.triggerEvent(Events.effectiveness, {
			type : attackType,
			multiplier : multiplier
		}, byWhom, self);
		if (modification.notEmpty())
			multiplier = product(modification);
		return multiplier;
	};

	self.conscious = function () {
		return self.health > 0 && self.egg === null;
	};

	self.belong = function (who) {
		if (self.trainer)
			self.trainer.release(self);
		if (!self.caught) {
			self.caught = {
				location : who.location,
				level : self.level,
				trainer : who.unique
			};
		}
		self.trainer = who;
	};

	self.release = function () {
		self.trainer = null;
	};

	self.notHinderedByAilments = function () {
		if (self.status === Statuses.asleep) {
			Textbox.state(self.name() + " is sleeping soundly.");
			return false;
		}
		if (self.status === Statuses.frozen) {
			Textbox.state(self.name() + " is frozen solid.");
			return false;
		}
		if (self.status === Statuses.paralysed && srandom.chance(4)) {
			Textbox.state(self.name() + " was paralysed and couldn't move!");
			return false;
		}
		if (self.battler.flinching)
			return false;
		if (self.battler.confused) {
			Textbox.state(self.name() + " is confused.");
			if (srandom.chance(2)) {
				self.hurtInConfusion();
				return false;
			}
		}
		if (self.battler.infatuated) {
			Textbox.state(self.name() + " is infatuated.");
			if (srandom.chance(2)) {
				Textbox.state(self.name() + " couldn't move due to infatuation.");
				return false;
			}
		}
		return true;
	};

	self.attemptMove = function (move, target) {
		if (self.notHinderedByAilments()) {
			self.battler.previousTarget = target;
			self.use(move.number, target);
		}
	};

	self.use = function (move, target) {
		var moveNumber = null;
		if (typeof move === "number") {
			if (move !== Move.Struggle.number) {
				moveNumber = move;
				move = self.currentMoves()[move].move;
			} else {
				move = "Struggle";
				Textbox.state(self.name() + " has no PP left...");
			}
		}
		if (moveNumber !== null && (moveNumber < 0 || moveNumber >= self.currentMoves().length || self.currentMoves()[moveNumber].PP === 0))
			return;
		if (moveNumber !== null && self.battler.moveStage === 0 && self.currentMoves()[moveNumber].disabled) {
			Textbox.state("The move " + self.name() + " attempted to use is disabled!");
		} else {
			if (moveNumber !== null)
				-- self.currentMoves()[moveNumber].PP;
			var used;
			if (arguments.length >= 2)
				used = Move.use(move, self.battler.moveStage, self, target);
			else
				used = Move.use(move, self.battler.moveStage, self);
			if (used)  {
				self.battler.previousMoves.push({
					move : move,
					failed : false
				});
				++ self.battler.moveStage;
				if (self.battler.moveStage >= _(Moves, self.battler.previousMoves.last().move).effect.use.length)
					self.battler.moveStage = 0;
			} else {
				self.battler.previousMoves.push({
					move : move,
					failed : true
				});
				self.battler.moveStage = 0;
			}
		}
	};

	self.disobey = function () {
		if (self.trainer !== null && (self.trainer.unique !== self.caught.trainer && self.trainer.holdsControlOverPokemonUpToLevel() < self.level && srandom.chance(2))) {
			return srandom.choose(
				function (poke) {
					Textbox.state(poke.name() + srandom.choose(" is loafing around!", " turned away!", " won't obey!"));
				},
				function (poke) {
					Textbox.state(poke.name() + " began to nap!");
					Battle.inflict(Statuses.asleep);
				},
				function (poke) {
					Textbox.state(poke.name() + " won't obey!");
					poke.hurtInConfusion();
				}
			);
		}
		return false;
	};

	self.hurtInConfusion = function () {
		Textbox.state(self.name() + " hurt " + self.selfPronoun() + " in the confusion!");
		Move.use("_Confused", 0, self, self);
	};

	self.recoil = function (move, damage) {
		damage = Move.exactDamage(self, self, move, Math.floor(damage));
		Textbox.state(self.name() + " took recoil damage!");
		Battle.damage(self, damage);
	};

	self.crash = function (damage) {
		damage = Math.floor(damage);
		Textbox.state(self.name() + " took crash damage!");
		Battle.damage(self, {damage : damage});
	};

	self.usableMoves = function () {
		var usableMoves = [];
		foreach(self.currentMoves(), function (move, i) {
			if (move.PP > 0 && !move.disabled)
				usableMoves.push(move);
		});
		return (usableMoves.notEmpty() ? usableMoves : [Move.Struggle]);
	};

	self.useHeldItem = function () {
		var item = Items._(self.item);
		Textbox.state(self.name() + " used the " + item.fullname + " " + self.pronoun() + " was holding on " + self.selfPronoun() + "!");
		var response = item.effect(self.item, self);
		if (item.onetime)
			self.item = null;
		return response;
	};

	self.respondToEvent = function (event, data, other) {
		var responses = [];
		if (self._("-> battler ~> transform => ability"))
			responses = responses.concat(self.respondToEventWith(event, data, other, Abilities._(self._("-> battler ~> transform => ability"))));
		if (self.item && self.respondToEventWith(event, data, other, Items._(self.item)).contains(true))
			responses.push(self.useHeldItem());
		return responses;
	};

	self.respondToEventWith = function (event, data, other, property) {
		// Checks to see if the property in question (e.g. Ability, Item) responds to the event and, if it does, responds.
		data.event = event;
		data.oneself = (self === other);
		var effects = property.effects, responses = [], response;
		foreach(effects, function (effect) {
			if (!forevery(effect, function (value, key) {
				if (typeof value !== "function" && data[key] !== value) {
					return true;
				}
			})) {
				response = effect.action(data, self, other);
				if (typeof response !== "undefined")
					responses.push(response);
			}
		});
		return responses;
	};

	self.inBattle = function () {
		return self.battler.battling;
	};

	self.fainted = function () {
		return self.health === 0;
	};

	self.heal = function () {
		self.health = self.stats[Stats.health](); // Restore the Pokémon's health
		self.status = Statuses.none; // Heal any status conditions
		// Restore the PP of all the Pokémon's moves
		foreach(self.moves, function (move) {
			move.PP = Moves[move.move].PP * (1 + 0.2 * move.PPups);
		})
	};

	self.cry = function () {
		Sound.play(self.paths.cry());
	};
}