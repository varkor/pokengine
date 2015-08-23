function pokemon (data, validate) {
	var self = this;

	self.battler = new battler(self);

	self._ = function (_path) {
		var path = _path;
		if (/^ ?-> ?battler ?~> ?transform ?=> ?/) {
			if (!self.battler.transform.transformed)
				path = path.replace(/^ ?-> ?battler ?~> ?transform ?=> ?/, "");
		}
		return _(self, path);
	};

	if (arguments.length < 1)
		data = {};

	var setProperty = function (property, value) {
		if (data.hasOwnProperty(property)) {
			self[property] = data[property];
		} else {
			var propertyValue = (typeof value === "function" ? value() : value);
			self[property] = propertyValue;
		}
	};

	var random = new srandom();

	setProperty("species", "Missingno. (Nintendo)");
	var species = function (property) {
		if (self["form(e)"] === null)
			return Pokedex._(self.species)[property];
		else
			return Pokedex._(self.species + " -> form(e)s ~> " + self["form(e)"] + " => " + property);
	};
	setProperty("nickname", null);
	setProperty("identification", typeof Game === "object" ? Game.unique() : null);
	setProperty("nature", function () {
		return random.chooseFromArray(Object.keys(Natures));
	});
	setProperty("gender", function () {
		var genderRatio = species("gender ratio");
		return genderRatio !== null ? (random.point() < genderRatio ? "male" : "female") : "neuter";
	});
	setProperty("form(e)", function () {
		if (Pokedex._(self.species)["form(e)s"] !== null) {
			var forms = Object.keys(Pokedex._(self.species)["form(e)s"]);
			if (forms.contains("Male") && self.gender === "male")
				return "Male";
			if (forms.contains("Female") && self.gender === "female")
				return "Female";
			return forms.first();
		}
		else return null;
	});
	setProperty("level", species("lowestPossibleLevel"));
	setProperty("moves", function () {
		var moveSet = species("moveset"), moves = [];
		foreach(Object.keys(moveSet).sort(function (a, b) { return b - a; }), function (level) {
			if (self.level >= level) {
				var movesAtLevel = moveSet[level];
				if (foreach(movesAtLevel, function (move) {
						moves.push({
							"move" : move
						});
						if (moves.length === 4)
							return true;
				}))
					return true;
			}
		});
		// If the moves are empty now, you've got a problem
		return moves;
	});
	foreach(self.moves, function (move, i) {
		move.number = i;
		if (!move.hasOwnProperty("PP")) {
			move.PP = Moves._(move.move).PP;
		}
		if (!move.hasOwnProperty("PPUps")) {
			move.PPUps = 0;
		}
	});
	setProperty("ability", function () {
		return random.chooseFromArray(species("abilities").normal);
	});
	setProperty("status", "none");
	setProperty("IVs", function () {
		var IVs = {};
		foreach(Stats.permanent, function (stat) {
			IVs[stat] = random.int(0, 31);
		});
		return IVs;
	});
	setProperty("EVs", function () {
		var EVs = {};
		foreach(Stats.permanent, function (stat) {
			EVs[stat] = 0;
		});
		return EVs;
	});
	setProperty("experience", 0);
	setProperty("nationality", "British");
	setProperty("item", null);
	setProperty("friendship", species("friendship"));
	setProperty("shiny", function () {
		return random.chance(8192);
	});
	setProperty("egg", null); // Number of egg cycles, or null (for not an egg)
	setProperty("caught", null);
	setProperty("ribbons", []);
	setProperty("Pokerus", function () {
		return random.chance(3, 65536) ? "infected" : "uninfected";
	});

	self.trainer = null;
	self.stats = {};
	self.mega = null;

	self.currentSpecies = function () {
		return self._("-> battler ~> transform => species");
	};

	self.currentProperty = function (property) {
		if (self.mega === null) {
			if (self["form(e)"] === null)
				return Pokedex._(self.currentSpecies())[property];
			else
				return Pokedex._(self.currentSpecies() + " -> form(e)s ~> " + self["form(e)"] + " => " + property);
		} else {
			return Pokedex._(self.currentSpecies() + " -> mega evolutions ~> " + self.mega + " => " + property);
		}
	};

	self.currentMoves = function () {
		return self._("-> battler ~> transform => moves");
	};
	
	self.stats.health = function () {
		return Math.floor(((self.IVs.health + 2 * species("stats").health + self.EVs.health / 4 + 100) * self.level) / 100 + 10);
	};

	self.maximumHealth = function () {
		return self.stats.health();
	};

	setProperty("health", self.maximumHealth());

	foreach(Stats.permanent, function (stat) {
		if (stat === "health")
			return;
		self.stats[stat] = function (stageModifier) {
			return Math.floor(((((self.IVs[stat] + 2 * self.currentProperty("stats")[stat] + self.EVs[stat] / 4) * self.level) / 100 + 5) * (Natures[self.nature].increased === stat ? 1.1 : Natures[self.nature].decreased === stat ? 0.9 : 1)) * (stageModifier ? (self.battler.statLevel[stat] >= 0 ? 1 + 0.5 * self.battler.statLevel[stat] : 2 / (2 - self.battler.statLevel[stat])) : 1));
		};
	});

	self.validate = function () {
		/*
			Validate the data types involved.
			I.e. check the data types are correct and that they are in the correct range.
		*/
		/*
		 Some of this data may be volatile as creators change things, like level found at in the wild, moveset, etc., so for now, validation is probably not a good idea. This is okay as Pokémon will only be modified by the server anyway.
		*/
		var inRange = function (value, min, max) {
			return value >= min && value <= max;
		}, isInteger = function (value) {
			return typeof value === "number" && Math.floor(value) === value;
		}, isString = function (value) {
			return typeof value === "string" || value instanceof String;
		}, isArray = Array.isArray,
		isBoolean = function (value) {
			return typeof value === "boolean";
		},
		isObject = function (value) {
			return typeof value === "object";
		};

		if (!isString(self.species) || !Pokedex._(self.species + "?")) return false;
		if (!isString(self.nickname)) return false;
		if (!self.hasOwnProperty("identification")) return false;
		if (!isInteger(self.level) || !inRange(self.level, 1, 100)) return false;
		if (!isString(self.nature) || !Natures.hasOwnProperty(self.nature)) return false;
		if (!isString(self.gender) || !Genders.contains(self.gender)) return false;
		if (!isArray(self.moves) || !inRange(self.moves.length, 1, 4)) return false;
		if (foreach(self.moves, function (move, i) {
			return !(isObject(move) && isString(move.move) && Moves._(move.move + "?") && isInteger(move.PP) && inRange(move.PP, 0, Move.maximumPP(move.move, move.PPUps)) && isInteger(move.PPUps) && inRange(move.PPUps, 0, 3) && number === i && Object.keys(move).length === 4);
		})) return false;
		if (!isString(self.ability) || !Ability._(self.ability + "?")) return false;
		if (!Statuses.contains(self.status)) return false;
		if (!isArray(self.IVs) || self.IVs.length !== 6) return false;
		if (foreach(self.IVs, function (IV) {
			return !isInteger(IV) || !inRange(IV, 0, 31);
		})) return false;
		if (!isArray(self.EVs) || self.EVs.length !== 6) return false;
		var EVSum = 0;
		if (foreach(self.EVs, function (EV) {
			return !isInteger(EV) || !inRange(EV, 0, 252) || (EVSum += EV) > 510;
		})) return false;
		if (!isInteger(self.experience) || !inRange(self.experience, 0, self.experienceFromLevelToNextLevel())) return false;
		if (!isString(self.nationality) || !Nationalities._(self.nationality + "?")) return false;
		if (!isString(self.item) || !Items._(self.item + "?")) return false;
		if ((self["form(e)"] !== null && !isString(self["form(e)"])) || (self["form(e)"] !== null && !species["form(e)s"].hasOwnProperty(self["form(e)"])) || (self["form(e)"] === "Male" && self.gender !== "male") || (self["form(e)"] === "Female" && self.gender !== "female")) return false;
		if (!isInteger(self.friendship) || !inRange(self.friendship, 0, 255)) return false;
		if (!isBoolean(self.shiny)) return false;
		if ((self.egg !== null && !isInteger(self.egg)) || (self.egg !== null && !inRange(self.egg, 1, 121))) return false;
		if (self.caught !== null && (!isObject(self.caught) || !isString(self.caught.location) || !Maps.hasOwnProperty(self.caught.location) || !isInteger(self.caught.level) || !inRange(self.caught.level, 1, 100) || self.caught.level > self.level || !self.caught.hasOwnProperty("trainer") || !isString(self.caught.ball) || !Items._(self.caught.ball + "?") || Items._(self.caught.ball).category !== "Ball" || Object.keys(self.caught).length !== 4)) return false;
		if (!isArray(self.ribbons)) return false;
		if (foreach(self.ribbons, function (ribbon) {
			if (!Ribbons._(ribbon + "?"))
				return true;
		})) return false;
		if (!isString(self.Pokerus) || !Pokerus.contains(self.Pokerus)) return false;
		if (!isInteger(self.health) || !inRange(self.health, 0, self.maximumHealth())) return false;

		/*
			Validate the data for this particular Pokémon species.
		*/
		// Match against events database
		var matchedEvent = null;
		foreach(Events, function (event) {
			if (!forevery(event, function (property, key) {
				if (self[key] !== property)
					return true;
			}))
				matchedEvent = event;
		});
		if (matchedEvent) // Events do not have to conform to normal rules
			return true;
		if (self.level < species("lowestPossibleLevel"))
			return false;
		if (!self.rename(self.nickname))
			return false;
		var genderRatio = species("gender ratio");
		switch (self.gender) {
			case "male":
				if (genderRatio === null || genderRatio === 0)
					return false;
				break;
			case "female":
				if (genderRatio === null || genderRatio === 1)
					return false;
				break;
			case "neuter":
				if (genderRatio !== null)
					return false;
				break;
		}
		foreach(self.Moves, function (move) {
			// Due to the changing nature of the content, move validity is not a good thing to test for, as it may change in the future
		});
		if (species("abilities").normal.contains(self.ability) && self.ability !== species("abilities").hidden)
			return false;
		// Due to the changing nature of the content, forme(s) are not good thing to test for, as they may change in the future
		if (self.caught && !["Safari", "Sport", "Park", "Dream", "Cherish"].contains(self.caught.ball)) {
			if (["Park", "Dream"].contains(self.caught.ball))
				return false; // For now, these balls are invalid
			if (self.caught.ball === "Cherish" && matchedEvent === null)
				return false; // Only event Pokémon are distributed with Cherish balls
			if (self.caught.ball === "Sport" && !species("types").contains("Bug"))
				return false; // There may be other competitions involving Sport balls later, but for now, only the Bug-Catching Competition is valid
		}
		// Due to the changing nature of the content, shiny locking is not a good thing to test for, as it may change in the future
		if (self.egg !== null) {
			if (species("egg groups").contains("Undiscovered"))
				return false;
		}
		if (self.caught) {
			// Due to the changing nature of the content, location validation is not a good thing to test for, as it may change in the future
			if (self.caught.level > self.level)
				return false;
		}
		// Due to the changing nature of the content, ribbons are not a good thing to test for, as they may change in the future
		return true; // The Pokémon has passed validation tests
	};

	if (validate) {
		if (!self.validate())
			return NoPokemon;
	}

	self.paths = {
		convert : function (contracted, includeFiletype, which) {
			var region = self.currentSpecies().match(/ \(\w+\)$/).first().match(/\w+/).first(), name = self.currentSpecies().replace(/ \(\w+\)$/, "");
			contracted = contracted.replace("{region}", region);
			contracted = contracted.replace("{species}", name);
			contracted = contracted.replace("{whichform(e)}", self.mega === null && self["form(e)"] === null ? "" : " ({form(e)})");
			contracted = contracted.replace("{form(e)}", self.mega === null ? (self["form(e)"] === null ? "" : self["form(e)"]) : self.mega);
			contracted = contracted.replace("{whichmega}", self.mega === null ? "" : " ({mega})");
			contracted = contracted.replace("{mega}", self.mega === null ? "" : self.mega);
			contracted = contracted.replace("{which}", (which ? "~" + which : ""));
			contracted = contracted.replace(/\{filetype=[a-z0-9]+\}/, (includeFiletype ? "." + contracted.match(/\{filetype=([a-z0-9]+)\}/)[1] : ""));
			if (typeof Dex !== "undefined") {
				// Compatibility with pokéngine
				var IDs = Dex.getPokemonByName(name + "," + region + (self.mega === null ? (self["form(e)"] === null ? "" : "," + self["form(e)"]) : "," + self.mega));
				contracted = contracted.replace("{region-id}", IDs.dex);
				contracted = contracted.replace("{species-id}", IDs.id);
				contracted = contracted.replace("{form(e)-id}", IDs["form(e)"]);
			}
			contracted = contracted.replace("{side}", which ? which : "front");
			contracted = contracted.replace("{animation}", Sprite.shouldAnimate(contracted) ? "animated" : "static");
			return contracted;
		},
		sprite : function (which, includeFiletype) {
			return self.paths.convert(Settings._("paths => Pokemon => image"), includeFiletype, which);
		},
		cry : function (includeFiletype) {
			return self.paths.convert(Settings._("paths => Pokemon => sound"), includeFiletype);
		}
	};

	self.name = function () {
		return (self.egg === null ? (self.nickname || self.species.replace(/ \(\w+\)$/, "")) : "Egg");
	};

	self.rename = function (nickname) {
		// Returns whether or not the new name is valid or not
		// Preventing renaming of a Pokémon that does not belong to you will be done in-overworld. Pokémon may not have a name containing any filtered phrase, or a name of another Pokémon
		if (nickname === null || (!Pokedex._(nickname + "?") && !foreach(Settings._("filter"), function (disallowed) {
			if (new RegExp(disallowed).test(nickname))
				return true;
		}))) {
			self.name = nickname;
			return true;
		}
		return false;
	};

	self.store = function () {
		// Returns an object that contains all the data for the Pokémon, without any methods
		var store = {};
		foreach(["species", "health", "item", "moves", "ability", "nickname", "identification", "level", "nature", "gender", "status", "IVs", "EVs", "experience", "nationality", "form(e)", "friendship", "shiny", "egg", "ribbons", "caught", "Pokerus"], function (property) {
			store[property] = JSONCopy(self._(property));
		});
		foreach(store.moves, function (move) {
			delete move.number;
		});
		return JSONCopy(store);
	};

	self.learn = function (move, initial, learnRegardless) {
		if (foreach(self.moves, function (check) {
			if (check.move === move && !learnRegardless) // Don't learn a move you already know
				return true;
		}))
			return false;
		if (self.moves.length < 4) {
			if (!initial)
				if (!self.battler.battle.process) Textbox.state(self.name() + " learnt " + move + "!");
			self.moves.push({
				move : move,
				number : self.moves.length,
				PP : Moves._(move).PP,
				PPUps : 0
			});
		} else {
			var battleContext = self.battler.battle, immediatelyProceeding, resumeNormalProceedings = null, learnNewMove = function (replacing) {
				if (self.inBattle()) {
					battleContext.inputs.push({
						"action" : "learn",
						"forget" : replacing
					});
				}
				if (!battleContext.process) Textbox.insertAfter(Textbox.state(self.name() + " forgot " + self.moves[replacing].move + " and learnt " + move + "!", resumeNormalProceedings), immediatelyProceeding);
				self.moves[replacing] = {
					move : move,
					number : replacing,
					PP : move.PP,
					PPUps : 0
				};
				if (battleContext.process)
					resumeNormalProceedings();
			}, doNotLearnNewMove = function () {
				if (self.inBattle()) {
					battleContext.inputs.push({
						"action" : "learn",
						"forget" : null
					});
				}
				if (!battleContext.process) Textbox.insertAfter(Textbox.state(self.name() + " didn't learn " + move + ".", resumeNormalProceedings), immediatelyProceeding);
				else
					resumeNormalProceedings();
			};
			if (self.inBattle()) {
				resumeNormalProceedings = function () {
					battleContext.flushInputs();
					-- battleContext.delayForInput;
					battleContext.endDelay();
				};
				++ battleContext.delayForInput;
			}
			if (!battleContext.process) Textbox.state(self.name() + " wants to learn " + move + ". But " + self.name() + " already knows 4 moves!");
			if (!battleContext.playerIsParticipating()) {
				if (!battleContext.process) immediatelyProceeding = Textbox.say("", 0);
				battleContext.waitForActions("learn", function () {
					var decision = battleContext.communication.shift();
					if (decision.forget === null)
						doNotLearnNewMove();
					else
						learnNewMove(decision.forget);
				}, {
					poke : self
				});
			} else {
				immediatelyProceeding = Textbox.confirm("Do you want " + self.name() + " to forget a move to make room for " + move + "?", function (yes) {
					if (yes) {
						var moves = [], hotkeys = {};
						hotkeys[Settings._("keys => secondary")] = "Never mind";
						foreach(self.moves, function (move) {
							moves.push(move.move);
						});
						immediatelyProceeding = Textbox.insertAfter(Textbox.ask("Which move do you want " + self.name() + " to forget?", moves, function (response, i, major) {
							if (major) {
								learnNewMove(i);
							} else {
								doNotLearnNewMove();
							}
						}, ["Never mind"], null, hotkeys), immediatelyProceeding);
					} else
						doNotLearnNewMove();
				});
			}
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
				if (!self.battler.battle.process) Textbox.state(self.name() + " forgot " + move + "!");
			return true;
		}
	};

	self.totalEVs = function () {
		var sum = 0;
		forevery(self.EVs, function (value) {
			sum += value;
		});
		return sum;
	};

	self.gainExperience = function (defeated, sharedBetween, participated) {
		if (self.trainer === null || self.trainer.isAnNPC())
			return;
		sharedBetween = sharedBetween || 1;
		var eventModifiers = product(defeated.battler.battle.triggerEvent(Triggers.experience, {}, defeated, self)), OPower = self.trainer.OPowers["Exp. Point"];
		var gain = Math.ceil((((!defeated.battler.battle.isWildBattle() ? 1.5 : 1) * defeated.currentProperty("yield").experience * defeated.level) / (5 * (participated ? 1 : 2)) * Math.pow((2 * defeated.level + 10) / (defeated.level + self.level + 10), 2.5) + 1) * (self.caught && self.trainer.identification === self.caught.trainer ? 1 : self.trainer.nationality === self.nationality ? 1.5 : 1.7) * (OPower === 1 ? 1.2 : OPower === 2 ? 1.5 : OPower === 3 ? 2 : 1) * eventModifiers / sharedBetween);
		if (defeated.battler.battle.active && !defeated.battler.battle.process)
			Textbox.state(self.name() + " gained " + gain + " experience!");
		var levelledUp = false;
		while (self.level < 100 && self.experience + gain >= self.experienceFromLevelToNextLevel()) {
			levelledUp = true;
			gain -= self.experienceFromLevelToNextLevel() - self.experience;
			self.experience = self.experienceFromLevelToNextLevel();
			if (!defeated.battler.battle.process) {
				var display = Display.state.save();
				Textbox.effect(function (display) { return function () { return Display.state.transition(display); }; }(display));
			}
			self.raiseLevel();
			self.experience = 0;
			if (defeated.battler.battle.active && !defeated.battler.battle.process) {
				var display = Display.state.save();
				Textbox.state(self.name() + " has grown to level " + self.level + "!", function (display) { return function () { Display.state.load(display); }; }(display));
			}
			if (species("moveset").hasOwnProperty(self.level)) {
				foreach(species("moveset")[self.level], function (move) {
					self.learn(move);
				});
			}
		}
		if (self.level < 100)
			self.experience += gain;
		var previousMaximumHealth = self.maximumHealth(), maximumEVgain = 510 - self.totalEVs(), maximumEVgainForStat;
		forevery(defeated.currentProperty("yield").EVs, function (boost, stat) {
			maximumEVgainForStat = Math.max(0, Math.min(maximumEVgain, boost * (self.Pokerus === "infected" ? 2 : 1)));
			maximumEVgainForStat = Math.min(maximumEVgainForStat, 252 - maximumEVgainForStat);
			maximumEVgain -= maximumEVgainForStat;
			self.EVs[stat] += maximumEVgainForStat;
		});
		self.health = Math.min(self.maximumHealth(), self.health + self.maximumHealth() - previousMaximumHealth);
		if (defeated.battler.battle.active && !defeated.battler.battle.process) {
			var display = Display.state.save();
			Textbox.effect(function () { return Display.state.transition(display); });
		}
		return levelledUp;
	};

	self.attemptEvolution = function (method, specific) {
		// Returns the species the Pokémon is going to attempt to evolve into, or null if it cannot evolve at the moment
		if (self.trainer === null || self.trainer.isAnNPC())
			return null;
		var evolution = null;
		// Cycle through all the available evolutions
		foreach(species("evolutions"), function (evo) {
			if (evo.method === method) {
				if (method === "item" && self.item !== specific)
					return;
				// Cycle through all the conditions for evolutions, e.g. levelling up and/while having a high friendship
				// The Pokémon must satisfy *every one* of the methods
				if (!forevery(evo.requirements, function (requirement, property) {
					switch (property) {
						case "level":
							return self.level < requirement;
						case "friendship":
							return self.friendship < (requirement !== null ? requirement : 220);
						case "item":
							return self.item !== requirement;
					}
				})) {
					evolution = evo;
					return true;
				}
			}
		});
		return evolution;
	};

	self.alterFriendship = function (boosts) {
		if (!Array.isArray(boosts))
			boosts = [boosts, boosts, boosts]; // Gain in 0 – 99 band, 100 – 199 band and 200 – 255 band, respectively
		var boost = (self.friendship < 100 ? boosts[0] : self.friendship < 200 ? boosts[1] : self.friendship < 256 ? boosts[2] : 0);
		self.friendship += boost + (boost > 0 && self.caught && self.ball === "Luxury" ? 1 : 0) /*+ (boost > 0 && self.caught && Game.location === self.caught.location ? 1 : 0)*/;
		self.friendship = Math.clamp(0, self.friendship, 255);
	};

	self.raiseLevel = function () {
		var previousMaximumHealth = self.maximumHealth();
		++ self.level;
		self.health = Math.min(self.maximumHealth(), self.health + self.maximumHealth() - previousMaximumHealth);
		if (self.battler.battling)
			self.alterFriendship([5, 4, 3]);
	};

	self.evolve = function (evolution) {
		var fromName = self.species.replace(/ \(\w+\)$/, ""), intoName = evolution.replace(/ \(\w+\)$/, "");
		if (!self.battler.battle.process) {
			if (self.name() !== fromName)
				Textbox.state("Congratulations! " + self.name() + " evolved from " + article(fromName) + " " + fromName + " into " + article(intoName) + " " + intoName + "!");
			else
				Textbox.state("Congratulations! " + self.name() + " evolved into " + article(intoName) + " " + intoName + "!");
		}
		self.species = evolution;
		var evolutionData = Pokedex._(evolution);
		if (evolutionData["form(e)s"] === null)
			self["form(e)"] = null;
		else if (!evolutionData["form(e)s"].hasOwnProperty(self["form(e)"]))
			self["form(e)"] = Object.keys(Pokedex._(self.species)["form(e)s"]).first();
		if (evolutionData.moveset.hasOwnProperty(self.level)) {
			foreach(evolutionData.moveset[self.level], function (move) {
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
		switch (species("experience")) {
			case "erratic":
				if (n <= 50)
					return Math.ceil(Math.pow(n, 3) * (100 - n) / 50);
				else if (n <= 68)
					return Math.ceil(Math.pow(n, 3) * (150 - n) / 100);
				else if (n <= 98)
					return Math.ceil(Math.pow(n, 3) * ((1911 - 10 * n) / 3) / 500);
				else
					return Math.ceil(Math.pow(n, 3) * (160 - n) / 100);
				break;
			case "fast":
				return Math.ceil(4 * Math.pow(n, 3) / 5);
			case "medium fast":
				return Math.ceil(Math.pow(n, 3));
			case "medium slow":
				return Math.ceil(6 / 5 * Math.pow(n, 3) - 15 * Math.pow(n, 2) + 100 * n - 140);
			case "slow":
				return Math.ceil(5 * Math.pow(n, 3) / 4);
			case "fluctuating":
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
			if (self.currentProperty("types").indexOf(arguments[i]) > -1)
				return true;
		return false;
	};

	self.pronoun = function (capitalised) {
		return (self.gender === "male" ? "he" : self.gender === "female" ? "she" : "it");
	};
	self.possessivePronoun = function (capitalised) {
		var word = (self.gender === "male" ? "his" : self.gender === "female" ? "her" : "its");
		return (capitalised ? capitalise(word) : word);
	};
	self.personalPronoun = function (capitalised) {
		var word = (self.gender === "male" ? "him" : self.gender === "female" ? "her" : "it");
		return (capitalised ? capitalise(word) : word);
	};
	self.selfPronoun = function (capitalised) {
		return self.personalPronoun(capitalised) + "self";
	};

	self.effectiveness = function (attackType, classification, byWhom) {
		var multiplier = 1, current;
		foreach(self.currentProperty("types"), function (type) {
			if (attackType === "Ground" && type === "Flying" && self.battler.grounded)
				return;
			if (classification.contains("Powder") && type === "Grass") {
				multiplier = 0;
				return true;
			}
			multiplier *= Move.effectiveness(attackType, type, self.battler.battle.flags);
		});
		var modification = self.battler.battle.triggerEvent(Triggers.effectiveness, {
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
				ball : null,
				location : null,
				level : self.level,
				trainer : who.identification
			};
		}
		self.trainer = who;
	};

	self.release = function () {
		self.trainer = null;
	};

	self.notHinderedByAilments = function () {
		if (self.status === "asleep") {
			if (!self.battler.battle.process) Textbox.state(self.name() + " is sleeping soundly.");
			return false;
		}
		if (self.status === "frozen") {
			if (!self.battler.battle.process) Textbox.state(self.name() + " is frozen solid.");
			return false;
		}
		if (self.status === "paralysed" && random.chance(4)) {
			if (!self.battler.battle.process) Textbox.state(self.name() + " was paralysed and couldn't move!");
			return false;
		}
		if (self.battler.flinching) {
			if (!self.battler.battle.process) Textbox.state(self.name() + " flinched!");
			return false;
		}
		if (self.battler.confused) {
			if (!self.battler.battle.process) Textbox.state(self.name() + " is confused.");
			if (random.chance(2)) {
				self.hurtInConfusion();
				return false;
			}
		}
		if (self.battler.infatuated) {
			if (!self.battler.battle.process) Textbox.state(self.name() + " is infatuated.");
			if (random.chance(2)) {
				if (!self.battler.battle.process) Textbox.state(self.name() + " couldn't move due to infatuation.");
				return false;
			}
		}
		return true;
	};

	/*
		Used when the Pokémon attempts to use a move primarily—whether through the trainer's choice, or disobediance. Takes into acoount status effects, etc.
	*/
	self.attemptMove = function (move, target) {
		if (self.notHinderedByAilments()) {
			self.battler.previousTarget = target;
			self.use(move.number, target);
		}
	};

	/*
		Actually use a particular move, or Struggle. Makes sure the correct move stage is used.
	*/
	self.use = function (move, target) {
		var moveNumber = null;
		if (typeof move === "number") {
			if (move !== Move.Struggle.number) {
				moveNumber = move;
				move = self.currentMoves()[move].move;
			} else {
				move = "Struggle";
				if (!self.battler.battle.process) Textbox.state(self.name() + " has no PP left...");
			}
		}
		if (moveNumber !== null && (moveNumber < 0 || moveNumber >= self.currentMoves().length || self.currentMoves()[moveNumber].PP === 0))
			return;
		if (moveNumber !== null && self.battler.moveStage === 0 && self.currentMoves()[moveNumber].disabled) {
			if (!self.battler.battle.process) Textbox.state("The move " + self.name() + " attempted to use is disabled!");
		} else {
			if (moveNumber !== null)
				-- self.currentMoves()[moveNumber].PP;
			var used;
			if (arguments.length >= 2)
				used = Move.use(move, self.battler.moveStage, self, target);
			else
				used = Move.use(move, self.battler.moveStage, self);
			if (!used.hasOwnProperty("modifiedMove") || !used.modifiedMove) {
				self.battler.previousMoves.push({
					move : move,
					failed : !used.succeeded
				});
			}
			if (used.succeeded)  {
				++ self.battler.moveStage;
				if (self.battler.moveStage >= _(Moves, self.battler.previousMoves.last().move).effects.use.length)
					self.battler.moveStage = 0;
			} else {
				self.battler.moveStage = 0;
			}
		}
	};

	self.disobey = function () {
		if (self.trainer !== null && (self.trainer.identification !== self.caught.trainer && self.trainer.holdsControlOverPokemonUpToLevel() < self.level && random.chance(2))) {
			return random.choose(
				function (poke) {
					if (!self.battler.battle.process) Textbox.state(poke.name() + random.choose(" is loafing around!", " turned away!", " won't obey!"));
				},
				function (poke) {
					if (!self.battler.battle.process) Textbox.state(poke.name() + " began to nap!");
					self.battler.battle.inflict(self, "asleep", false, true);
				},
				function (poke) {
					if (!self.battler.battle.process) Textbox.state(poke.name() + " won't obey!");
					poke.hurtInConfusion();
				}
			);
		}
		return false;
	};

	self.hurtInConfusion = function () {
		if (!self.battler.battle.process) Textbox.state(self.name() + " hurt " + self.selfPronoun() + " in the confusion!");
		Move.use("Confused", 0, self, self);
	};

	self.recoil = function (move, damage) {
		damage = Move.exactDamage(self, self, move, Math.floor(damage), "Typeless");
		if (!self.battler.battle.process) Textbox.state(self.name() + " took recoil damage!");
		self.battler.battle.damage(self, damage);
	};

	self.crash = function (damage) {
		damage = Math.floor(damage);
		if (!self.battler.battle.process) Textbox.state(self.name() + " took crash damage!");
		self.battler.battle.damage(self, {damage : damage});
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
		if (!self.battler.battle.process) Textbox.state(self.name() + " used the " + item.fullname + " " + self.pronoun() + " was holding on " + self.selfPronoun() + "!");
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

	self.inBattle = function (whichBattle) {
		if (arguments.length >= 1)
			return self.battler.battling && self.battler.battle === whichBattle;
		else return self.battler.battling;
	};

	self.fainted = function () {
		return self.health === 0;
	};

	self.heal = function () {
		self.health = self.maximumHealth(); // Restore the Pokémon's health
		self.status = "none"; // Heal any status conditions
		// Restore the PP of all the Pokémon's moves
		foreach(self.moves, function (move) {
			move.PP = Move.maximumPP(move.move, move.PPUps);
		});
	};

	self.cry = function () {
		Sound.play(self.paths.cry(true));
	};

	self.potentialMegaEvolution = function (intentOnMegaEvolvingSelf) {
		if (self.inBattle() && (self.trainer === null || (self.trainer.ownsKeyStone() && (self.trainer.megaEvolution === false || (intentOnMegaEvolvingSelf && self.trainer.megaEvolution === self)))) && species("mega evolutions") !== null && self.item && Items._(self.item + " => category?") && Items._(self.item + " => category") === "Mega Stone" && Items._(self.item + " => Pokémon") === self.species && species("mega evolutions").hasOwnProperty(Items._(self.item + " => form"))) {
			return Items._(self.item + " => form");
		}
		return null;
	};

	self.megaEvolve = function () {
		var form = self.potentialMegaEvolution(true);
		if (form) {
			self.mega = form;
			if (self.trainer !== null)
				self.trainer.megaEvolution = true;
			var display = Display.state.save();
			Textbox.effect(function () {
				Display.state.load(display);
				self.cry();
			});
			if (!self.battler.battle.process) Textbox.state(self.name() + " Mega Evolved!");
		}
	};

	self.knowsMove = function (moves) {
		moves = wrapArray(moves);
		return foreach(self.moves, function (move) {
			return moves.contains(move.move);
		});
	};

	self.isWild = function () {
		return self.trainer && self.trainer.isWild();
	};
}