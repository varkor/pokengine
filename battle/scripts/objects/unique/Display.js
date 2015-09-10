Display = {
	store : {
		pokemon : function (poke) {
			if (poke === NoPokemon)
				return NoPokemon;
			var newPoke = new pokemon(poke.store());
			if (poke.hasOwnProperty("original")) {
				newPoke.original = poke.original;
			} else {
				newPoke.original = poke;
			}
			newPoke.battler.side = poke.battler.side;
			newPoke.battler.display = JSONCopy(poke.battler.display);
			newPoke.battler.battle = poke.battler.battle;
			newPoke.mega = poke.mega;
			newPoke.battler.transform = poke.battler.transform;
			newPoke.trainer = poke.trainer;
			return newPoke;
		},
		trainer : function (character) {
			var newTrainer = new trainer(character.store());
			if (character.hasOwnProperty("original")) {
				newTrainer.original = character.original;
			} else {
				newTrainer.original = character;
			}
			var pokes = [];
			foreach(character.party.pokemon, function (poke) {
				pokes.push(Display.store.pokemon(poke));
			});
			newTrainer.party = new party();
			newTrainer.party.pokemon = pokes;
			return newTrainer;
		}
	},
	pokemonInState : function (poke, _state) {
		state = _state;
		if (arguments.length < 2)
			state = Display.state.current;
		else
			state = Display.states[state];
		if (state === null)
			throw "You've tried to find a Pokémon in a state that no longer exists!";
		var match = null;
		foreach([].concat(state.allies, state.opponents), function (compare) {
			if (poke.hasOwnProperty("original") ? poke.original === compare.original : poke === compare.original)
				match = compare;
		});
		return match;
	},
	original : function (poke) {
		return poke.hasOwnProperty("original") ? poke.original : poke;
	},
	refreshWidgetsFromState : function (state) {
		if (Battle.playerIsParticipating()) {
			foreach(state.alliedTrainers, function (character) {
				if (character.identification === Game.player.identification) {
					Widgets.Party.BattleContextDelegate.pokemonHaveUpdated(character.party.pokemon);
					Widgets.Bag.BattleContextDelegate.itemsHaveUpdated(character.bag.items);
					return true;
				}
			});
		}
	},
	state : {
		save : function (state) {
			var self = Display, cloneState = (arguments.length > 0 ? state : Battle), newState = {
				allies : [],
				opponents : [],
				alliedTrainers : [],
				opposingTrainers : [],
				flags : {}
			};
			var trainerParties = {};
			foreach(cloneState.alliedTrainers, function (trainer) {
				var storedTrainer = Display.store.trainer(trainer);
				trainerParties[storedTrainer.identification] = storedTrainer.party.pokemon;
				newState.alliedTrainers.push(storedTrainer);
			});
			foreach(cloneState.opposingTrainers, function (trainer) {
				var storedTrainer = Display.store.trainer(trainer);
				trainerParties[storedTrainer.identification] = storedTrainer.party.pokemon;
				newState.opposingTrainers.push(storedTrainer);
			});
			foreach(cloneState.allies, function (poke) {
				var storedPoke = Display.store.pokemon(poke);
				if (storedPoke !== NoPokemon) {
					foreach(trainerParties[storedPoke.trainer.identification], function (trainerPoke, i) {
						if (trainerPoke.identification === storedPoke.identification) {
							trainerParties[storedPoke.trainer.identification][i] = storedPoke;
						}
					});
				}
				newState.allies.push(storedPoke);
			});
			foreach(cloneState.opponents, function (poke) {
				var storedPoke = Display.store.pokemon(poke);
				if (storedPoke !== NoPokemon) {
					foreach(trainerParties[storedPoke.trainer.identification], function (trainerPoke, i) {
						if (trainerPoke.identification === storedPoke.identification) {
							trainerParties[storedPoke.trainer.identification][i] = storedPoke;
						}
					});
				}
				newState.opponents.push(Display.store.pokemon(storedPoke));
			});
			forevery((arguments.length > 0 ? state.flags : Battle.display), function (value, flag) {
				newState.flags[flag] = value;
			});
			self.states.push(newState);
			return self.states.length - 1;
		},
		load : function (state) {
			var self = Display;
			for (var i = 0; i < state; ++ i)
				self.states[i] = null;
			if (self.states[state] === null)
				throw "You've tried to load an older state than the current one! (State " + state + ")";
			self.state.current = self.states[state];
			self.refreshWidgetsFromState(self.state.current);
			Battle.cache = null;
		},
		transition : function (state, track, original) {
			var self = Display, from = self.state.current, to = self.states[state], fromAll, toAll, originalAll, completed = true;
			if (to === null)
				throw "You've tried to transition to an older state than the current one! (State " + state + ")";
			if (arguments.length < 2) {
				track = {
					completed : false
				};
			}
			if (arguments.length < 3) {
				original = Display.states[Display.state.save(self.state.current)];
			}
			fromAll = [].concat(from.allies, from.opponents);
			toAll = [].concat(to.allies, to.opponents);
			originalAll = [].concat(original.allies, original.opponents);
			var mostBattlers = Math.min(fromAll.length, toAll.length, originalAll.length);
			for (var i = 0; i < mostBattlers; ++ i) {
				if (fromAll[i] === NoPokemon || toAll[i] === NoPokemon || originalAll[i] === NoPokemon)
					continue;
				foreach(["health", "experience"], function (property) {
					var difference = (toAll[i][property] - originalAll[i][property]) * ((1 / Settings._("stat transition duration")) / Time.framerate);
					if (Math.abs(fromAll[i][property] - toAll[i][property]) > Math.abs(difference)) {
						completed = false;
						fromAll[i][property] += difference;
					} else
						fromAll[i][property] = toAll[i][property];
				});
				foreach(["transition", "height"], function (property) {
					var difference = (toAll[i].battler.display[property] - originalAll[i].battler.display[property]) * ((1 / Settings._("switch transition duration")) / Time.framerate);
					fromAll[i].battler.display[property] += difference;
					if (Math.abs(fromAll[i].battler.display[property] - toAll[i].battler.display[property]) > Math.abs(difference))
						completed = false;
					else
						fromAll[i].battler.display[property] = toAll[i].battler.display[property];
				});
			}
			self.refreshWidgetsFromState(from);
			if (completed) {
				self.state.load(state);
				track.completed = true;
			} else {
				setTimeout(function () {
					self.state.transition(state, track, original);
				}, Time.refresh);
			}
			Battle.cache = null;
			return track;
		},
		current : {}
	},
	states : []
};