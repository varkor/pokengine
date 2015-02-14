TheWild = new trainer({
	name : "The Wild"
});

Battle = FunctionObject.new({
	active : false,
	finished : true,
	kind : null,
	state : {
		kind : "inactive"
	},
	situation : null,
	style : null,
	flags : [],
	allies : [],
	alliedTrainers : [],
	opponents : [],
	opposingTrainers : [],
	participants : [],
	levelUppers : [],
	weather : null,
	turns : 0,
	callback : null,
	selection : 0,
	delayForInput : false, // Delay asking the player what they'd like to do until a potentially breaking change has been made (such as learning a new move, which needs to wait, so that the new move will show up in the Pokémon's move list)
	queue : [],
	actions : [],
	recording : [],
	inputs : [],
	communication : [],
	evolving : [],
	scene : null,
	rules : [],
	hazards : {
		near : [],
		far : []
	},
	effects : {
		near : [],
		far : [],
		specific : []
	},
	display : {
		weather : false
	},
	cache : null,
	drawing : {
		positions : {
			sideNear : {
				x : 90,
				y : 220,
				z : 0
			},
			sideFar : {
				x : 230,
				y : 220,
				z : 115
			}
		},
		transition : function (object, property, to, duration) {
			var from = object[property];
			return function () {
				if (duration !== 0) {
					var clamp = from < to ? Math.min : Math.max;
					object[property] = clamp(object[property] + (to - from) / duration, to);
				} else {
					object[property] = to;
				}
				return object[property] === to;
			};
		},
		complexShape : function (canvas, shapes, right, y, shift) {
			var context = canvas.getContext("2d"), current = { x : 0, y : 0 }, width = 0;
			foreach(shapes, function (shape) {
				if (shape.hasOwnProperty("points")) {
					foreach(shape.points, function (point) {
						if (point.x > width)
							width = point.x;
					});
				}
			});
			foreach(shapes, function (shape) {
				context.fillStyle = shape.colour;
				if (shape.hasOwnProperty("points")) {
					context.beginPath();
					foreach(shape.points, function (point) {
						if (point.hasOwnProperty("x"))
							current.x = point.x;
						if (point.hasOwnProperty("y"))
							current.y = point.y;
						context.lineTo(canvas.width * (right ? 1 : 0) + ((current.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + current.y) * Game.zoom);
					});
					context.fill();
				}
				if (shape.hasOwnProperty("text")) {
					context.font = shape.font;
					context.textAlign = shape.align.x;
					context.textBaseline = shape.align.y;
					context.fillText(shape.text, canvas.width * (right ? 1 : 0) + ((shape.position.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + shape.position.y) * Game.zoom);
				}
			});
		},
		partyBar : function (canvas, trainer, right, y) {
			var context = canvas.getContext("2d");
			var shapes = [
				{
					points : [{ x : 0, y : -8 }, { x : 102 }, { x : 118, y : 8 }, { x : 0 }],
					colour : "hsla(0, 0%, 0%, 0.6)"
				}
			];
			var transition = 1 - trainer.display.position.x / -200;
			Battle.drawing.complexShape(canvas, shapes, right, y, transition);
			for (var i = 0, pos; i < trainer.party.pokemon.length; ++ i) {
				pos = (!right ? 0 : canvas.width) + (12 + i * 16 - 118 * (1 - transition)) * Game.zoom * (!right ? 1 : -1);
				context.fillStyle = "red";
				context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom);
				context.fillStyle = "white";
				context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom, Math.PI);
				if (trainer.party.pokemon[i].fainted()) {
					context.fillStyle = "hsla(0, 0%, 0%, 0.3)";
					context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom);
				}
			}
		},
		bar : function (canvas, poke, right, y, detailed) {
			var context = canvas.getContext("2d"), pixelWidth = 16, percentageHealth = poke.health / poke.maximumHealth(), percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
			do {
				context.font = pixelWidth + "px " + Settings._("font").typeface
				pixelWidth -= 1;
			} while (context.measureText(poke.name()).width > 60);
			var shapes = [
				{
					points : [{ x : 0, y : -16 }, { x : 82 }, { x : 98, y : 0 }, { x : 162 }, { x : 146, y : 16 }, { x : 0 }],
					colour : "hsla(0, 0%, 0%, 0.6)"
				},
				{
					text :  poke.name(),
					position : { x : (78 + 20) / 2, y : (-16 + 6) / 2 },
					align : { x : "center" , y : "middle" },
					colour : "white",
					font : Font.load(pixelWidth * Game.zoom, null, "")
				},
				{
					points : [{ x : 0, y : 6 }, { x : 148 - 148 * (1 - percentageHealth) }, { x : 144 - 148 * (1 - percentageHealth), y : 10 }, { x : 0 }],
					colour : (percentageHealth > 1 / 2 ? "hsl(110, 100%, 40%)" : percentageHealth > 1 / 4 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)")
				},
				{
					text :  "Lv.",
					position : { x : 4, y : -16 },
					align : { x : (right ? "right" : "left") , y : "top" },
					colour : "white",
					font : Font.load(8 * Game.zoom)
				},
				{
					text :  poke.level,
					position : { x : 4, y : -8 },
					align : { x : (right ? "right" : "left") , y : "top" },
					colour : "white",
					font : Font.load(10 * Game.zoom)
				},
			];
			var gender = poke._("-> battler ~> transform => gender");
			if (gender !== "neuter")
				shapes = shapes.concat([
					{
						points : [{ x : 82, y : -16 }, { x : 106 }, { x : 122, y : 0 }, { x : 98 }],
						colour : (gender === "male" ? "hsl(195, 100%, 45%)" : "hsl(325, 100%, 80%)")
					},
					{
						text :  (gender === "male" ? "♂" : "♀"),
						position : { x : (82 + 122) / 2, y : (-16 + 0) / 2 },
						align : { x : "center", y : "middle" },
						colour : (gender === "male" ? "hsl(195, 100%, 5%)" : "hsl(325, 100%, 40%)"),
						font : Font.load(12 * Game.zoom)
					}
				]);
			if (right) {
				shapes = shapes.concat([
					{
						points : [{ x : 146, y : 16 }, {x  : 138, y : 24 }, { x : 90 }, { x : 82, y : 16 }],
						colour : "hsla(0, 0%, 0%, 0.6)"
					},
					{
						text :  Math.round(poke.health) + " / " + poke.maximumHealth(),
						position : { x : (138 + 90) / 2, y : 22 },
						align : { x : "center" , y : "bottom" },
						colour : "white",
						font : Font.load(8 * Game.zoom)
					}
				]);
				if (Battle.kind !== Battles.kind.online) {
					shapes = shapes.concat([{
						points : [{ x : 0, y : 18 }, { x : 80 }, { x : 86, y : 24 }, { x : 0 }],
						colour : "hsla(0, 0%, 0%, 0.6)"
					}]);
					if (percentageExperience > 0) {
						shapes = shapes.concat([{
							points : [{ x : 0, y : 20 }, { x : 78 - 80 * (1 - percentageExperience) }, { x : 80 - 80 * (1 - percentageExperience), y : 22 }, { x : 0 }],
							colour : "hsl(190, 100%, 50%)"
						}]);
					}
				}
			}
			Battle.drawing.complexShape(canvas, shapes, right, y, poke.battler.display.transition);
		},
		position : function (entity, display) {
			var position;
			if (entity instanceof pokemon) {
				var poke = entity;
				display = display || Display.state.current;
				var ally = display.allies.contains(entity), place, count = Battle.pokemonPerSide();
				if (ally) {
					place = display.allies.indexOf(poke);
					position = {
						x : Battle.drawing.positions.sideNear.x + poke.battler.display.position.x + place * 100 - (count - 1) * 40,
						y : Battle.drawing.positions.sideNear.y - poke.battler.display.position.y,
						z : Battle.drawing.positions.sideNear.z + poke.battler.display.position.z
					};
				} else {
					place = display.opponents.indexOf(poke);
					position = {
						x : Battle.drawing.positions.sideFar.x - poke.battler.display.position.x - place * 80 + (count - 1) * 40,
						y : Battle.drawing.positions.sideFar.y - poke.battler.display.position.y,
						z : Battle.drawing.positions.sideFar.z - poke.battler.display.position.z
					};
				}
				position.scale = 2 / Math.pow(2, position.z / (Battle.drawing.positions.sideFar.z - Battle.drawing.positions.sideNear.z));
			} else {
				var trainer = entity;
				position = Battle.drawing.positions;
				if (Battle.alliedTrainers.contains(trainer)) {
					position = {
						x : Battle.drawing.positions.sideNear.x + trainer.display.position.x,
						y : Battle.drawing.positions.sideNear.y - trainer.display.position.y,
						z : Battle.drawing.positions.sideNear.z + trainer.display.position.z
					};
				} else {
					position = {
						x : Battle.drawing.positions.sideFar.x - trainer.display.position.x,
						y : Battle.drawing.positions.sideFar.y - trainer.display.position.y,
						z : Battle.drawing.positions.sideFar.z - trainer.display.position.z
					};
				}
				position.scale = 1;
			}
			return position;
		}
	},
	all : function (excludeNoPokemon) {
		var all = [].concat(Battle.allies, Battle.opponents);
		if (excludeNoPokemon)
			all = all.filter(onlyPokemon);
		return all;
	},
	allTrainers : function () {
		return [].concat(Battle.alliedTrainers, Battle.opposingTrainers);
	},
	alliesTo : function (poke) {
		if (Battle.allies.indexOf(poke) > -1)
			return Battle.allies;
		if (Battle.opponents.indexOf(poke) > -1)
			return Battle.opponents;
		return [];
	},
	opponentsTo : function (poke) {
		if (Battle.allies.indexOf(poke) > -1)
			return Battle.opponents.filter(onlyPokemon);
		if (Battle.opponents.indexOf(poke) > -1)
			return Battle.allies.filter(onlyPokemon);
		return [];
	},
	load : function (alliedTrainers, opposingTrainers, settings) {
		Battle.active = true;
		Battle.state = {
			kind : "loading",
			progress : 0,
			failed : []
		};
		var resources = [Scenes._(settings.scene).paths.sprite(true)], loaded = 0;
		foreach([].concat(alliedTrainers, opposingTrainers), function (trainer) {
			resources.push(trainer.paths.sprite(alliedTrainers.contains(trainer) ? "back" : null, true));
			foreach(trainer.party.pokemon, function (poke) {
				resources.push(poke.paths.sprite("front", true), poke.paths.sprite("back", true), poke.paths.cry(true));
			});
		});
		var timeout = 3 * Time.seconds, unloadedResources = resources.slice(0);
		var finish = function () {
			Textbox.stateUntil("", function () { return Battle.state.kind !== "opening"; });
			Battle.state = {
				kind : "opening",
				transition : 0
			};
		}, progress = function (resource) {
			unloadedResources.remove(unloadedResources.indexOf(resource));
			Battle.state.progress = ++ loaded / resources.length;
			if (loaded === resources.length) {
				finish();
			}
		};
		foreach(resources, function (resource) {
			File.load(resource, function (resource) { return function () {
				progress(resource);
			}; }(resource), function (resource, message) {
				Battle.state.failed.push(resource);
				if (Settings._("ignore missing files"))
					progress();
				Debugger.error("There was an error loading one of the files", resource);
			});
		});
		setTimeout(function () {
			if (unloadedResources.notEmpty() && Battle.state.kind === "loading") {
				foreach(unloadedResources, function (file) {
					Battle.state.failed.pushIfNotAlreadyContained(file);
				});
				if (Settings._("ignore missing files"))
					finish();
			}
		}, timeout);
	},
	playRecording : function (recording, alliedTrainers, opposingTrainers, callback) {
		recording.teamA = alliedTrainers;
		recording.teamB = opposingTrainers;
		Battle.recording = recording;
		srandom.seed = Battle.recording.seed;
		Battle.initiate(Battle.recording.teamA, Battle.recording.teamB, Battle.recording.settings, Battles.kind.recording, callback);
	},
	beginOnline : function (seed, alliedTrainers, opposingTrainers, settings, callback) {
		srandom.seed = seed;
		Battle.initiate(alliedTrainers, opposingTrainers, settings, Battles.kind.online, callback);
	},
	beginWildBattle : function (alliedTrainers, pokes, settings, callback) {
		pokes = wrapArray(pokes);
		TheWild.party.empty();
		foreach(pokes, function (poke) {
			TheWild.give(poke);
		});
		Battle.initiate(alliedTrainers, TheWild, settings, Battles.kind.local, callback);
	},
	beginTrainerBattle : function (alliedTrainers, opposingTrainers, settings, callback) {
		Battle.initiate(alliedTrainers, opposingTrainers, settings, Battles.kind.local, callback);
	},
	initiate : function (alliedTrainers, opposingTrainers, settings, kind, callback) {
		if (!Battle.active) {
			Textbox.setStyle("battle");
			if (arguments.length < 3 || typeof settings === "undefined" || settings === null)
				settings = {};
			if (!settings.hasOwnProperty("scene"))
				settings.scene = "Field Clearing";
			if (!settings.hasOwnProperty("style"))
				settings.style = "normal";
			if (!settings.hasOwnProperty("weather"))
				settings.weather = "clear";
			Battle.finished = false;
			if (arguments.length >= 4)
				Battle.kind = kind;
			else
				Battle.kind = Battles.kind.local;
			if (arguments.length >= 5)
				Battle.callback = callback;
			else
				Battle.callback = null;
			Battle.rules = settings.rules;
			Battle.scene = settings.scene;
			Battle.situation = Battles.situation.wild;
			Battle.style = settings.style;
			Battle.flags = settings.flags;
			Battle.changeWeather(settings.weather);
			alliedTrainers = wrapArray(alliedTrainers);
			opposingTrainers = wrapArray(opposingTrainers);
			Battle.alliedTrainers = alliedTrainers;
			Battle.opposingTrainers = opposingTrainers;
			if (!Battle.opposingTrainers.contains(TheWild))
				Battle.situation = Battles.situation.trainer;
			if (Battle.kind !== Battles.kind.recording) {
				var teamA = [], teamB = [];
				foreach(Battle.alliedTrainers, function (trainer) {
					teamA.push(trainer.store());
				});
				foreach(Battle.opposingTrainers, function (trainer) {
					teamB.push(trainer.store());
				});
				Battle.recording = {
					seed : srandom.seed,
					settings : settings,
					teamA : teamA,
					teamB : teamB,
					actions : []
				};
			}
			foreach(Battle.alliedTrainers, function (participant) {
				participant.display.visible = true;
				for (var i = 0, newPoke; i < Math.min((Battle.style === "normal" ? 1 : 2) / Battle.alliedTrainers.length, participant.healthyPokemon().length); ++ i) {
					newPoke = participant.healthyPokemon()[i];
					Battle.queue.push({
						poke : newPoke,
						doesNotRequirePokemonToBeBattling : true,
						priority : 1 - (1 / (Battle.alliedTrainers.length + 3)) * (i + 1),
						action : function (which) {return function () {
							Battle.enter(which, true, null, true);
						}; }(newPoke)
					});
				}
			});
			if (foreach(Battle.opposingTrainers, function (participant) {
				participant.display.visible = true;
				if (!participant.hasHealthyPokemon()) {
					Textbox.state(participant.name + " doesn't have any Pokémon! The battle must be stopped!", function () {
						Battle.end(false, {
							"outcome" : "illegal battle"
						});
					});
					Battle.finish();
					return true;
				} else {
					for (var i = 0, newPoke; i < Math.min((Battle.style === "normal" ? 1 : 2) / Battle.opposingTrainers.length, participant.healthyPokemon().length); ++ i) {
						newPoke = participant.healthyPokemon()[i];
						if (newPoke.trainer === TheWild)
							Battle.enter(newPoke, true, null, true);
						else Battle.queue.push({
							poke : newPoke,
							doesNotRequirePokemonToBeBattling : true,
							priority : (1 - (1 / (Battle.opposingTrainers.length + 3)) * (i + 1)) / 10,
							action : function (which) {return function () {
								Battle.enter(which, true, null, true);
							}; }(newPoke)});
					}
				}
			}))
				return;
			Display.state.load(Display.state.save());
			Battle.load(alliedTrainers, opposingTrainers, settings);
		} else
			throw "You've tried to start a battle when one is already in progress!";
	},
	begin : function () {
		Battle.state = {
			kind : "running"
		};
		Display.state.load(Display.state.save());
		var names = [], number = 0;
		switch (Battle.situation) {
			case Battles.situation.wild:
				var wildPokemon = TheWild.healthyPokemon();
				if (wildPokemon.length === 1)
					Textbox.state("A wild " + wildPokemon.first().name() + " appeared!");
				else {
					foreach(wildPokemon, function (poke) {
						names.push(poke.name());
						++ number;
					});
					Textbox.state("A " + (wildPokemon.length === 2 ? "pair of" : "group of " + number) + " wild Pokémon appeared: " + commaSeparatedList(names) + "!");
				}
				break;
			case Battles.situation.trainer:
				foreach(Battle.opposingTrainers, function (trainer) {
					trainer.display.visible = true;
					names.push(trainer.fullname());
					++ number;
				});
				if (names.length === 1)
					Textbox.state(names.first() + " is challenging " + Battle.alliedTrainers.first().pronoun() + " to a battle!");
				if (names.length > 1)
					Textbox.state(commaSeparatedList(names) + " are challenging " + Battle.alliedTrainers.first().pronoun() + " to a battle!");
				break;
		}
		Battle.race(Battle.queue);
		Battle.queue = [];
		Battle.startTurn();
	},
	finish : function () {
		Battle.finished = true;
	},
	end : function (forcefully, flags) {
		if (Battle.active) {
			Battle.active = false;
			if (forcefully)
				Textbox.clear();
			Textbox.setStyle("standard");
			Battle.draw();
			Battle.situation = null;
			foreach(Battle.all(true), function (poke) {
				if (poke.status === "badly poisoned")
					poke.status = "poisoned";
				poke.battler.reset();
			});
			Battle.allies = [];
			Battle.opponents = [];
			foreach(Battle.allTrainers(), function (participant) {
				foreach(participant.party.pokemon, function (poke) {
					if (Battle.participants.contains(poke) && Battle.levelUppers.contains(poke)) {
						var mayEvolve = poke.attemptEvolution("level");
						if (mayEvolve) {
							Battle.evolving.push({
								from : poke,
								into : new pokemon(mayEvolve)
							});
						}
					}
				});
				participant.resetDisplay(); // Reset the trainer's display
				foreach(participant.bag, function (item) {
					item.intentToUse = 0;
				});
			});
			Battle.handler = Keys.addHandler(function (key, pressed) {
				if (pressed && Battle.state.kind === "evolution" && !["stopped", "finishing", "after"].contains(Battle.state.stage) && Textbox.dialogue.empty()) {
					Battle.state = {
						kind : "evolution",
						stage : "stopped",
						transition: 0,
						evolving : Battle.state.evolving,
						into : Battle.state.into
					};
					Textbox.state("...what? " + Battle.state.evolving.name() + " has stopped evolving!", function () {
						Battle.continueEvolutions();
					});
				}
			}, Settings._("keys => secondary"));
			Battle.continueEvolutions();
			Battle.alliedTrainers = [];
			Battle.opposingTrainers = [];
			Battle.participants = [];
			Battle.levelUppers = [];
			Battle.queue = [];
			Battle.inputs = [];
			Battle.rules = [];
			Battle.escapeAttempts = 0;
			Battle.turns = 0;
			Battle.communication = [];
			if (Battle.callback) {
				/*
				Possible values for the "outcome" flag:
					"termination" [forceful terminal of the battle by an outside event]
					"allied victory" [the allied side won the battle]
					"opposing victory" [the opposing side won the battle]
					"draw" [it was a complete draw]
					"escape" [the allies escaped from a wild battle]
				*/
				Battle.callback(arguments.length >= 2 ? flags : {
					"outcome" : "termination"
				});
			}
		}
	},
	continueEvolutions : function () {
		if (Battle.evolving.notEmpty()) {
			var evolver = Battle.evolving.shift();
			Battle.state = {
				kind : "evolution",
				stage : "before",
				transition: 0,
				evolving : evolver.from,
				into : evolver.into
			};
			Textbox.state("What? " + evolver.from.name() + " is evolving!", function () {
				Battle.state.stage = "preparation";
			});
		} else {
			Keys.removeHandler(Battle.handler);
			delete Battle.handler;
			Battle.state = {
				kind : "inactive"
			};
		}
	},
	input : function (primary, secondary, tertiary, character, selection) {
		var advance = true, reprompt = true;
		var inBattle = [], all = Battle.all(true);
		if (arguments.length < 4) {
			character = Game.player;
			selection = Battle.selection;
		}
		foreach(all, function (poke) {
			if (poke.trainer === character)
				inBattle.push(poke);
		});
		var names, positions, currentBattler = inBattle[selection];
		switch (primary) {
			case "Fight":
				var chosenMove = currentBattler.usableMoves()[secondary], chosenActualMove = Moves._(chosenMove.move);
				var who = null;
				if (typeof tertiary !== "undefined" && tertiary !== null) {
					who = tertiary;
				} else {
					if (chosenActualMove.targets !== Move.targets.opposingSide && chosenActualMove.targets !== Move.targets.alliedSide) {
						var targets = [], targetNames = [], place, affected, partOfTarget, names, all = Battle.all(true);
						foreach(all, function (poke) {
							place = Battle.placeOfPokemon(poke);
							if (Battle.pokemonInRangeOfMove(currentBattler, poke, chosenActualMove)) {
								affected = chosenActualMove.affects;
								partOfTarget = [];
								if (affected.contains(Move.target.directTarget)) {
									partOfTarget.push(place);
								}
								foreach(Battle.alliesTo(currentBattler).filter(onlyPokemon), function (adjacent) {
									var distance = Math.floor(Battle.distanceBetween(currentBattler, adjacent));
									if (((affected.contains(Move.target.self) && distance === 0) || (affected.contains(Move.target.adjacentAlly) && distance === 1) || ((affected.contains(Move.target.farAlly) && distance === 2))))
										partOfTarget.push(Battle.placeOfPokemon(adjacent));
								});
								foreach(Battle.opponentsTo(currentBattler).filter(onlyPokemon), function (adjacent) {
									var distance = Math.floor(Battle.distanceBetween(currentBattler, adjacent));
									if (((affected.contains(Move.target.directOpponent) && distance === 0) || (affected.contains(Move.target.adjacentOpponent) && distance === 1) || ((affected.contains(Move.target.farOpponent) && distance === 2))))
										partOfTarget.push(Battle.placeOfPokemon(adjacent));
								});
								names = [];
								foreach(partOfTarget, function (part) {
									names.push(Battle.pokemonInPlace(part).name());
								});
								partOfTarget = partOfTarget.removeDuplicates();
								if (!foreach(targets, function (who) {
									if (who.affects.isSimilarTo(partOfTarget))
										return true;
								})) {
									targetNames.push(commaSeparatedList(names, true));
									targets.push({
										target : place,
										affects : partOfTarget
									});
								}
							}
						});
						if (Battle.style !== "normal" || targets.length > 1) {
							targets.reverse();
							targetNames.reverse();
							var displayAll = [].concat(Display.state.current.allies, Display.state.current.opponents), hotkeys = {};
							hotkeys[Settings._("keys => secondary")] = "Cancel";
							Textbox.ask("Whom do you want " + currentBattler.name() + " to attack?", targetNames, function (response, i, major) {
								if (response !== "Cancel")
									Battle.input("Fight", secondary, targets[i].target);
								else
									Battle.prompt();
							}, ["Cancel"], null, hotkeys, "Target: " + currentBattler.unique, function (i, major) {
								foreach(displayAll.filter(onlyPokemon), function (poke) {
									poke.battler.display.outlined = false;
								});
								if (major) {
									foreach(targets[i].affects, function (affected) {
										Display.pokemonInState(Battle.pokemonInPlace(affected)).battler.display.outlined = true;
									});
								}
							});
						} else {
							if (targets.notEmpty())
								who = targets[0].target;
							else
								who = NoPokemon;
						}
					} else {
						// The move targets an entire side
						var ally = Battle.allies.contains(currentBattler);
						who = Battles.side[(chosenActualMove.targets === Move.targets.opposingSide && ally) || (chosenActualMove.targets === Move.targets.alliedSide && !ally) ? "far" : "near"];
					}
				}
				if (who !== null) {
					if (!currentBattler.battler.disobeying) {
						Battle.actions.push({
							poke : currentBattler,
							priority : chosenActualMove.priority,
							action : function (poke) {
								poke.attemptMove(chosenMove, who);
							}
						});
					}
				} else {
					advance = false;
					reprompt = false;
				}
				break;
			case "Bag":
				if (arguments.length === 1) {
					advance = false;
					reprompt = false;
					if (character.bag.empty()) {
						Textbox.messageWithId(Textbox.state("You don't have any items.")).showTextImmediately = true;
						reprompt = true;
					} else {
						var usableItems = character.bag.usableItems(), actualItem, items = [], indices = [], hotkeys = {};
						hotkeys[Settings._("keys => secondary")] = "Cancel";
						foreach(usableItems, function (item) {
							actualItem = Items._(item.item);
							if (actualItem.direct) { // If the item can be used directly, instead of when being held
								items.push(actualItem.fullname + " ×" + (item.quantity - item.intentToUse));
								indices.push(character.bag.indexOfItem(item.item));
							}
						});
						Textbox.ask("Which item do you want to use?", items, function (response, i, major) {
							if (response !== "Cancel")
								Battle.input("Bag", indices[i]);
							else
								Battle.prompt();
						}, ["Cancel"], null, hotkeys, "Item", null, true);
					}
				} else {
					if (arguments.length === 2) {
						var targets = Items._(character.bag.items[secondary].item).targets;
						if (targets === Move.targets.party) {
							targets = character.party.pokemon;
						} else if (targets === Move.targets.opponents) {
							targets = [];
							foreach(Battle.opponents, function (opponent) {
								targets.push(opponent);
							});
							targets.reverse();
						}
						names = [];
						positions = [];
						var displayAll = [].concat(Display.state.current.allies, Display.state.current.opponents), hotkeys = {};
						hotkeys[Settings._("keys => secondary")] = "Cancel";
						foreach(targets, function (poke) {
							names.push(poke.name());
							positions.push(Battle.placeOfPokemon(poke));
						});
						Textbox.ask("On which Pokémon do you want to use the " + Items._(character.bag.items[secondary].item).fullname + "?", names, function (response, i) {
							if (response !== "Cancel")
								Battle.input("Bag", secondary, positions[i]);
							else
								Battle.prompt();
						}, ["Cancel"], null, hotkeys, null, function (i, major) {
							foreach(displayAll.filter(onlyPokemon), function (poke) {
								poke.battler.display.outlined = false;
							});
							if (major) {
								var poke = Battle.pokemonInPlace(positions[i]);
								if (poke.inBattle())
									Display.pokemonInState(poke).battler.display.outlined = true;
							}
						}, true);
						advance = false;
						reprompt = false;
					}
					if (typeof tertiary !== "undefined" && tertiary !== null) {
						Battle.actions.push({
							poke : tertiary,
							doesNotRequirePokemonToBeBattling : true,
							priority : 6.1, // Using items should be slightly higher priority than switching Pokémon in
							action : function (poke) {
								character.bag.use(secondary, poke, character);
							},
							undo : function () {
								character.bag.intendToUse(secondary, -1);
							}
						});
						character.bag.intendToUse(secondary);
					}
				}
				break;
			case "Pokémon":
				if (currentBattler.battler.isTrapped()) {
					Textbox.state(currentBattler.name() + " is trapped and cannot switch out!");
					advance = false;
				} else if (arguments.length === 1) {
					names = [];
					positions = [];
					foreach(character.healthyPokemon(true), function (poke, i) {
						names.push(poke.name());
						positions.push(character.party.pokemon.indexOf(poke));
					});
					advance = false;
					var hotkeys = {};
					hotkeys[Settings._("keys => secondary")] = "Cancel";
					if (names.length) {
						Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
							if (response !== "Cancel")
								Battle.input("Pokémon", positions[i]);
							else
								Battle.prompt();
						}, ["Cancel"], null, hotkeys, null, null, true);
						reprompt = false;
					} else {
						Textbox.state("All your Pokémon are already battling!");
						reprompt = true;
					}
				}  else {
					if (secondary >= character.pokemon()) {
						Textbox.state("There's no Pokémon in that slot!");
						advance = false;
					} else if (character.party.pokemon[secondary].health === 0) {
						Textbox.state("That Pokémon has fainted — you can't use that one!");
						advance = false;
					} else if (currentBattler.battler.isTrapped()) {
						Textbox.state(currentBattler.name() + " is trapped and can't switch out!");
						advance = false;
					} else if (!foreach(character.battlers(), function (battler) {
						if (battler.pokemon === character.party.pokemon[secondary]) {
							Textbox.state("That Pokémon is already battling — you can't send it out again!");
							advance = false;
						}
					})) {
						currentBattler.battler.switching = true;
						Battle.actions.push({
							poke : currentBattler,
							priority : 6,
							action : function (poke) {
								Battle.swap(currentBattler, character.party.pokemon[secondary]);
							}
						});
					}
					else
						advance = false;
				}
				break;
			case "Run":
				if (Battle.escape(currentBattler))
					advance = false;
				break;
			case "Back":
				var previous = Battle.actions.pop();
				if (previous.hasOwnProperty("undo"))
					previous.undo();
				Battle.inputs.pop();
				-- Battle.selection;
				advance = false;
				break;
		}
		if (Battle.kind !== Battles.kind.online || character === Game.player) {
			if (advance) {
				if (Battle.kind !== Battles.kind.recording) {
					var action = {
						action : "command",
						primary : primary
					};
					if (typeof secondary !== "undefined")
						action.secondary = secondary;
					if (typeof tertiary !== "undefined")
						action.tertiary = tertiary;
					Battle.inputs.push(action);
				}
				Battle.advance();
			} else if (reprompt)
				Battle.prompt();
		}
	},
	flushInputs : function () {
		// Sends any inputs the player has made since the inputs were last flushed, to the server
		// This is done after every set of inputs has been made at the start of the turn, and whenever extra input is required, such as when a Pokémon faints and the player has to decide which one to send out next
		if (Battle.kind === Battles.kind.online) {
			if (Battle.inputs.notEmpty())
				Client.send({
					action : "actions",
					seed : srandom.seed,
					actions : Battle.inputs
				});
		}
		Battle.inputs = [];
	},
	advance : function () {
		if (++ Battle.selection === Game.player.battlers().length) {
			Battle.queue = Battle.queue.concat(Battle.actions);
			Battle.actions = [];
			var display = Display.state.save();
			Textbox.effect(function () { Display.state.load(display); });
			Battle.flushInputs();
			Textbox.effect(function () {
				if (Battle.kind !== Battles.kind.online || Battle.communication.length >= Battle.trainersRequiringActions())
					Battle.giveTrainersActions();
				else {
					Battle.state = {
						"kind" : "waiting",
						"for" : "command"
					};
					Textbox.stateUntil("Waiting for the other player to make a decision...", function () { return Battle.state.kind !== "waiting"; });
				}
			});
		} else
			Battle.prompt();
	},
	trainersRequiringActions : function () {
		var requiredActions = 0;
		foreach(Battle.allTrainers(), function (trainer) {
			if (trainer.type === Trainers.type.online) {
				for (var i = 0; i < trainer.battlers().length; ++ i) {
					if (!Battle.pokemonForcedIntoAction(trainer.battlers()[i], true)) {
						++ requiredActions;
					}
				}
			}
		});
		return requiredActions;
	},
	giveTrainersActions : function () {
		foreach(Battle.allTrainers(), function (trainer) {
			if (trainer.isAnNPC())
				Battle.AI.action(trainer);
			else if (trainer.type === Trainers.type.online) {
				for (var i = 0, action; i < trainer.battlers().length; ++ i) {
					if (!Battle.pokemonForcedIntoAction(trainer.battlers()[i])) {
						action = Battle.communication.shift();
						Battle.input(action.primary, action.secondary, action.tertiary, trainer, i);
					}
				}
			}
		});
		Battle.queue = Battle.queue.concat(Battle.actions);
		Battle.actions = [];
		if (Battle.state.kind === "waiting") {
			Battle.state = {
				kind : "running"
			};
			Textbox.update();
		}
		Battle.processTurn();
	},
	receiveActions : function (actions) {
		// Receive the opponent's actions, in an online battle
		if (actions.notEmpty()) {
			Battle.communication = Battle.communication.concat(actions);
			if (Battle.state.kind === "waiting") {
				if (Battle.state.for === "command" && Battle.communication.length >= Battle.trainersRequiringActions())
					Battle.giveTrainersActions();
				else if (Battle.state.for === "send" && Battle.communication.length >= Battle.opponents.filter(onlyNoPokemon).length)
					Battle.continueToNextTurn(true);
			}
		}
	},
	changeWeather : function (weather) {
		Battle.weather = weather;
		Weather.weather = Battle.weather;
		Weather.time = 1;
	},
	pokemonOnSameSide : function (pokeA, pokeB) {
		return pokeA.battler.side === pokeB.battler.side;
	},
	distanceBetween : function (pokeA, pokeB) {
		var posA = (pokeA.battler.side === Battles.side.near ? Battle.allies.indexOf(pokeA) * 2 : Battle.opponents.length * 2 - 1 - Battle.opponents.indexOf(pokeA) * 2), posB = (pokeB.battler.side === Battles.side.near ? Battle.allies.indexOf(pokeB) * 2 : Battle.opponents.length * 2 - 1 - Battle.opponents.indexOf(pokeB) * 2);
		return (Math.abs(Math.floor(posA / 2) - Math.floor(posB / 2)) + ((posA & 1) === (posB & 1) ? 0 : 0.5));
	},
	pokemonInRangeOfMove : function (pokeA, pokeB, move) {
		var range = move.targets, distance = Battle.distanceBetween(pokeA, pokeB);
		switch (distance) {
			case 0:
				return range.contains(Move.target.self);
			case 0.5:
				return range.contains(Move.target.directOpponent);
			case 1:
				return range.contains(Move.target.adjacentAlly);
			case 1.5:
				return range.contains(Move.target.adjacentOpponent);
			case 2:
				return range.contains(Move.target.farAlly);
			case 2.5:
				return range.contains(Move.target.farOpponent);
			default:
				return false;
		}
	},
	targetsForMove : function (user, move, excludeAlliesIfPossible) {
		// Returns an array of all the Pokémon that the user could target with the move
		if (move.targets !== Move.targets.opposingSide && move.targets !== Move.targets.alliedSide) {
			var inRange = {
				allies : [],
				opponents : []
			}, all = Battle.all(true);
			foreach(all, function (poke) {
				if (Battle.pokemonInRangeOfMove(user, poke, move)) {
					(Battle.pokemonOnSameSide(user, poke) ? inRange.allies : inRange.opponents).push({
						poke : poke,
						place : Battle.placeOfPokemon(poke)
					});
				}
			});
			return (excludeAlliesIfPossible ? (inRange.opponents.length > 0 ? inRange.opponents : inRange.allies) : [].concat(inRange.opponents, inRange.allies));
		} else {
			var ally = Battle.allies.contains(user);
			return [{
				poke : NoPokemon,
				place : (move.targets === Move.targets.opposingSide && ally) || (move.targets === Move.targets.alliedSide && !ally) ? Battles.side.far : Battles.side.near
			}];
		}
	},
	affectedByMove : function (user, target, move) {
		// Returns an array of the Pokémon who will be affected by the user's move if they target a certain Pokémon
		var targets = [], partOfTarget = [], all = Battle.all();
		if (target !== NoPokemon && Battle.pokemonInRangeOfMove(user, target, move)) {
			if (move.affects.contains(Move.target.directTarget)) {
				partOfTarget.push(all.indexOf(target));
			}
			foreach(Battle.alliesTo(user).filter(onlyPokemon), function (poke) {
				var distance = Math.floor(Battle.distanceBetween(user, poke));
				if (((move.affects.contains(Move.target.self) && distance === 0) || (move.affects.contains(Move.target.adjacentAlly) && distance === 1) || ((move.affects.contains(Move.target.farAlly) && distance === 2))))
					partOfTarget.push(all.indexOf(poke));
			});
			foreach(Battle.opponentsTo(user).filter(onlyPokemon), function (poke) {
				var distance = Math.floor(Battle.distanceBetween(user, poke));
				if (((move.affects.contains(Move.target.directOpponent) && distance === 0) || (move.affects.contains(Move.target.adjacentOpponent) && distance === 1) || ((move.affects.contains(Move.target.farOpponent) && distance === 2))))
					partOfTarget.push(all.indexOf(poke));
			});
			partOfTarget = partOfTarget.removeDuplicates().reverse();
		}
		var affected = [];
		foreach(partOfTarget, function (index) {
			affected.push(all[index]);
		});
		return affected;
	},
	pokemonPerSide : function () {
		switch (Battle.style) {
			case "normal":
			case Battles.style.inverse:
			case Battles.style.sky:
				return 1;
			case "double":
				return 2;
			case Battles.style.triple:
				return 3;
			case Battles.style.rotation: // Only one Pokémon is battling at a time
				return 1;
			case Battles.style.horde:
				return 5;
		}
	},
	placeOfPokemon : function (poke) {
		if (poke.inBattle())
			return {
				side : poke.battler.side,
				team : poke.trainer.team,
				position : (poke.battler.side === Battles.side.near ? Battle.allies : Battle.opponents).indexOf(poke)
			};
		else
			return {
				team : poke.trainer.team,
				position : poke.trainer.party.pokemon.indexOf(poke)
			};
	},
	pokemonInPlace : function (place) {
		return (place.hasOwnProperty("side") ? (place.team === Game.player.team ? Battle.allies : Battle.opponents)[place.position] : Battle.trainerOfTeam(place.team).party.pokemon[place.position]);
	},
	trainerOfTeam : function (team) {
		var trainerOfTeam = null, all = Battle.allTrainers();
		foreach(all, function (trainer) {
			if (trainer.team === team) {
				trainerOfTeam = trainer;
				return true;
			}
		});
		return trainerOfTeam;
	},
	AI : {
		action : function (trainer) {
			// Decide whether to use a move, item, switch out, etc.
			var group = (arguments.length < 1 ? Battle.opponents : trainer.battlers());
			foreach(group, function (poke) {
				var disobey = poke.battler.disobeying;
				if (!disobey) {
					var usableMoves = poke.usableMoves(), use = srandom.chooseFromArray(usableMoves), useActual = Moves._(use.move), againstWhom;
					againstWhom = srandom.chooseFromArray(Battle.targetsForMove(poke, useActual, true));
					if (!Battle.pokemonForcedIntoAction(poke)) {
						Battle.queue.push({
							poke : poke,
							priority : useActual.priority,
							action : function (poke) {
								poke.attemptMove(use, againstWhom.place);
							}
						});
					}
				} else {
					Battle.actions.push({
						poke : poke,
						priority : 0,
						action : function (poke) {
							if (poke.notHinderedByAilments(poke))
								disobey(poke);
						}
					});
				}
			});
		}
	},
	pokemonForcedIntoAction : function (poke, doNotQueue) {
		// Check if this Pokémon is forced into making a certain move, because they need to recharge, etc.
		if (poke.battler.recharging) {
			if (!doNotQueue)
				Battle.queue.push({
					poke : poke,
					priority : 0,
					action : function (poke) {
						Textbox.state(poke.name() + " must recharge!");
					}
				});
			return true;
		}
		if (poke.battler.moveStage > 0) {
			if (!doNotQueue)
				Battle.queue.push({
					poke : poke,
					priority : Moves._(poke.battler.previousMoves.last().move).priority,
					action : function (poke) {
						poke.use(poke.battler.previousMoves.last().move, poke.battler.previousTarget);
					}
				});
			return true;
		}
	},
	prompt : function () {
		// Get the player to submit an action, such as Fight, or Run, etc.
		if (Battle.finished)
			return;
		var inBattle = [], currentBattler, allies = Battle.allies.filter(onlyPokemon);
		foreach(allies, function (poke) {
			if (!poke.trainer.isAnNPC())
				inBattle.push(poke);
		});
		currentBattler = inBattle[Battle.selection];
		if (Battle.pokemonForcedIntoAction(currentBattler)) {
			Battle.advance();
			return;
		}
		if (Battle.style !== "normal") {
			currentBattler.battler.display.outlined = true;
			var display = Display.state.save();
			Textbox.effect(function () { Display.state.load(display); });
			currentBattler.battler.display.outlined = false;
		}
		if (Battle.kind !== Battles.kind.recording) {
			var actions = ["Run"], hotkeys = {};
			if (!Widgets.isAvailable("Pokémon"))
				actions = ["Pokémon"].concat(actions);
			if (Battle.rules.items === "allowed" && !Widgets.isAvailable("Bag"))
				actions.push("Bag");
			hotkeys[Settings._("keys => secondary")] = "Run";
			var moves = [];
			foreach(currentBattler.usableMoves(), function (move) {
				moves.push(move.move);
			});
			if (Battle.style === "double" && Battle.selection > 0)
				actions.insert(0, "Back");
			Textbox.ask("What do you want " + currentBattler.name() + " to do?", moves, function (response, i, major) {
				if (major) {
					Battle.input("Fight", i);
				} else
					Battle.input(response);
			}, actions, null, hotkeys, "Action: " + currentBattler.unique, null, true);
		} else {
			var action = Battle.recording.actions.shift()[Battle.selection];
			Battle.input(action.primary, action.secondary, action.tertiary);
		}
	},
	processTurn : function () {
		Battle.selection = 0;
		foreach(Battle.effects.specific, function (effect, i, deletion) {
			if (!effect.target.battler.battling) {
				deletion.push(i);
			} else if ((effect.repeating && effect.due === Battles.when.startOfTurn) || (!effect.repeating && Battle.turns >= effect.due)) {
				if (effect.hasOwnProperty("data"))
					effect.type(effect.target, effect.data);
				else
					effect.type(effect.target);
				if (!effect.repeating)
					deletion.push(i);
			}
		});
		var all = Battle.all(true)
		foreach(all, function (poke) {
			if (poke.battler.recharging) {
				if (poke.battler.recharging > 1)
					poke.battler.recharging = 0;
			}
		});
		// Execute all the actions in the queue
		// By the time race() gets to fainted Pokémon, they will be recorded as fainted, so their actions will not execute
		Battle.race(Battle.queue);
		Battle.queue = [];
		Battle.survey();
		Battle.endTurn();
	},
	startTurn : function () {
		Battle.queue = [];
		var all = Battle.all(true);
		foreach(all, function (poke) {
			foreach(Battle.opponentsTo(poke).filter(onlyPokemon), function (opponent) {
				poke.battler.opponents.pushIfNotAlreadyContained(opponent);
				opponent.battler.opponents.pushIfNotAlreadyContained(poke);
			});
		});
		foreach(all.filter(function (poke) {
			return poke.battler.battlingForDuration === 0;
		}), function (poke) {
			Battle.queue.push({
				poke : poke,
				priority : 0,
				action : function (poke) {
					Battle.triggerEvent(Triggers.entrance, {}, poke);
				}
			});
		});
		Battle.race(Battle.queue);
		Battle.queue = [];
		var all = Battle.all(true);
		all.sort(function (a, b) {
			return a.trainer.team - b.trainer.team;
		});
		foreach(all, function (poke) {
			var disobey = poke.disobey();
			poke.battler.disobeying = disobey ? disobey : false;
			if (disobey) {
				Battle.actions.push({
					poke : poke,
					priority : 0,
					action : function (poke) {
						if (poke.notHinderedByAilments(poke))
							disobey(poke);
					}
				});
			}
		});
		if (!Battle.delayForInput)
			Battle.prompt();
	},
	endTurn : function () {
		if (!Battle.active || Battle.finished)
			return;
		foreach(Battle.effects.near, function (effect, i, deletion) {
			if (Battle.turns >= Math.floor(effect.expiration)) {
				Textbox.state(Battle.alliedTrainers[0].possessivePronoun(true) + effect.type + " ran out.");
				deletion.push(i);
			}
		});
		foreach(Battle.effects.far, function (effect, i, deletion) {
			if (Battle.turns >= Math.floor(effect.expiration)) {
				Textbox.state(Battle.opposingTrainers[0].possessivePronoun(true) + effect.type + " ran out.");
				deletion.push(i);
			}
		});
		foreach(Battle.effects.specific, function (effect, i, deletion) {
			if (!effect.target.battler.battling) {
				deletion.push(i);
			} else if ((effect.repeating && effect.due === Battles.when.endOfTurn) || (!effect.repeating && Battle.turns >= Math.floor(effect.due))) {
				if (!effect.target.fainted()) {
					if (!effect.expired) {
						if (effect.hasOwnProperty("data"))
							effect.type(effect.target, effect.data);
						else
							effect.type(effect.target);
					}
					if (!effect.repeating)
						deletion.push(i);
				}
			}
		});
		Battle.survey();
		var all = Battle.all(true)
		foreach(all, function (poke) {
			if (!Battle.active || Battle.finished)
				return true;
			++ poke.battler.battlingForDuration;
			if (poke.status !== "frozen" && poke.status !== "asleep" && !poke.flinching && !poke.battler.recharging) {
				foreach(poke.currentMoves(), function (move) {
					if (move.disabled) {
						if (-- move.disabled === 0)
							Textbox.state(poke.name() + "'s " + move.move + " was re-enabled!");
					}
				});
			}
			switch (poke.status) {
				case "asleep":
					++ poke.sleep;
					break;
				case Statuses.burn:
					Textbox.state(poke.name() + " is hurt by " + poke.possessivePronoun() + " burn!");
					Battle.damage(poke, Move.percentageDamage(target, 1 / 8));
					break;
				case "poisoned":
					Textbox.state(poke.name() + " is hurt by the poison!");
					Battle.damage(poke, Move.percentageDamage(target, 1 / 8));
					break;
				case "badly poisoned":
					Textbox.state(poke.name() + " is hurt by the toxic poison!");
					Battle.damage(poke, Move.percentageDamage(target, poke.poison / 16));
					++ poke.poison;
					break;
			}
			if (poke.battler.recharging)
				++ poke.battler.recharging;
			if (poke.battler.protected)
				poke.battler.protected = false;
			poke.battler.damaged[Move.category.physical] = 0;
			poke.battler.damaged[Move.category.special] = 0;
		});
		Battle.survey();
		Battle.display.weather = true;
		var displayWeather = Display.state.save(), displayAfterWeather;
		Textbox.effect(function () { Display.state.load(displayWeather); });
		var all = Battle.all(true);
		switch (Battle.weather) {
			case "intenseSunlight":
				if (!Settings._("visual weather effects"))
					Textbox.state("The sun is blazing fiercely in the sky!");
				break;
			case "rain":
				if (!Settings._("visual weather effects"))
					Textbox.state("The rain is pouring down in torrents!");
				break;
			case "sandstorm":
				if (!Settings._("visual weather effects"))
					Textbox.state("The sandstorm is raging all around!");
				foreach(all, function (poke) {
					if (!Battle.active || Battle.finished)
						return true;
					if (!poke.ofType("Steel", "Rock", "Ground")) {
						Textbox.state(poke.name() + " was damaged by the sandstorm!");
						Battle.damage(poke, {
							damage : Math.ceil(poke.maximumHealth() / 16),
							infiltrates : true
						});
					}
				});
				break;
			case "hail":
				if (!Settings._("visual weather effects"))
					Textbox.state("The hail is falling heavily!");
				foreach(all, function (poke) {
					if (!Battle.active || Battle.finished)
						return true;
					if (!poke.ofType("Ice")) {
						Textbox.state(poke.name() + " was damaged by the hail!");
						Battle.damage(poke, {
							damage : Math.ceil(poke.maximumHealth() / 16),
							infiltrates : true
						});
					}
				});
				break;
		}
		Battle.display.weather = false;
		displayAfterWeather = Display.state.save();
		Textbox.effect(function () { Display.state.load(displayAfterWeather); });
		Battle.survey();
		Battle.fillEmptyPlaces(true); // Fill the player's empty places
	},
	fillEmptyPlaces : function (player) {
		var emptyPlaces = [];
		foreach(player ? Battle.allies : Battle.opponents, function (poke, i) {
			if (poke === NoPokemon)
				emptyPlaces.push(i);
		});
		if (player) {
			var trainer = Game.player, progress = false;
			if (emptyPlaces.notEmpty()) {
				var healthyPokemon = trainer.healthyPokemon(true);
				if (healthyPokemon.length > emptyPlaces.length) {
					var names = [], positions = [];
					foreach(trainer.healthyPokemon(true), function (poke, i) {
						names.push(poke.name());
						positions.push(i);
					});
					if (names.empty()) {
						progress = true;
					} else {
						Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
							Battle.inputs.push({
								action : "send",
								which : i
							});
							Battle.enter(trainer.healthyPokemon(true)[i], true, emptyPlaces.first());
							Battle.fillEmptyPlaces(true);
						}, null, null, null, null, null, true);
					}
				} else {
					foreach(healthyPokemon, function (poke) {
						Battle.enter(poke, true, emptyPlaces.shift());
					});
					progress = true;
				}
			} else
				progress = true;
			if (progress) {
				Battle.flushInputs();
				Battle.fillEmptyPlaces(false); // Fill the opponent's empty places
			}
		} else {
			var anyQueries = false;
			// Queueing here is necessary so that the player can switch out their Pokémon before the opponent if the "switching chance" setting is on
			if (emptyPlaces.notEmpty()) {
				if (Battle.kind !== Battles.kind.online) {
					foreach(Battle.opposingTrainers, function (trainer) {
						if (!emptyPlaces.length)
							return true;
						var sendingOut = 0;
						while (trainer.battlers().length + sendingOut < Math.min((Battle.style === "normal" ? 1 : 2) / Battle.opposingTrainers.length) && trainer.hasHealthyPokemon(true) && emptyPlaces.length) {
							var poke = trainer.healthyPokemon(true).first(), immediatelyAfter;
							if (Battle.kind !== Battles.kind.online && Settings._("switching chance")) {
								var character = Game.player;
								if (character.healthyPokemon(true).notEmpty()) {
									if (poke.trainer !== TheWild)
										Textbox.state(trainer.name + " is about to send out " + poke.name() + ".");
									else
										Textbox.state("A wild " + poke.name() + " is about to appear!");
									anyQueries = true;
									immediatelyAfter = Textbox.confirm("Do you want to switch a different Pokémon in?", function (yes) {
										if (yes) {
											var names = [], positions = [];
											foreach(character.healthyPokemon(true), function (poke, i) {
												names.push(poke.name());
												positions.push(character.party.pokemon.indexOf(poke));
											});
											var hotkeys = {}, appendAfter;
											hotkeys[Settings._("keys => secondary")] = "Cancel";
											Textbox.insertAfter(appendAfter = Textbox.ask("Which Pokémon do you want to switch in?", names, function (response, i) {
												if (response !== "Cancel") {
													if (character.battlers().length > 1) {
														names = [];
														foreach(character.battlers(), function (replace) {
															names.push(replace.name());
														});
														Textbox.insertAfter(Textbox.ask("Which Pokémon do you want to switch out for " + character.party.pokemon[positions[i]].name() + "?", names, function (response, j) {
															if (response !== "Cancel") {
																Battle.queue.push({
																	poke : poke,
																	doesNotRequirePokemonToBeBattling : true,
																	priority : 2,
																	action : function (which, withWhat) {return function () {
																		Battle.swap(character.battlers()[which], character.party.pokemon[positions[withWhat]]);
																	}; }(j, i)
																});
																Battle.continueToNextTurn(false);
															} else Battle.continueToNextTurn(false);
														}, ["Cancel"], null, hotkeys, null, null, true), appendAfter);
													} else {
														Battle.queue.push({
															poke : poke,
															doesNotRequirePokemonToBeBattling : true,
															priority : 2,
															action : function (which) {return function () {
																Battle.swap(character.battlers().first(), character.party.pokemon[positions[which]]);
															}; }(i)
														});
														Battle.continueToNextTurn(false);
													}
												} else Battle.continueToNextTurn(false);
											}, ["Cancel"], null, hotkeys, null, null, true), immediatelyAfter);
										} else Battle.continueToNextTurn(false);
									}, null, null, null, true);
								}
							}
							var pressureSpeech = (Battle.situation === Battles.situation.trainer && trainer.healthyPokemon().length === 1 && trainer._("pressure speech?"));
							Battle.queue.push({
								poke : poke,
								doesNotRequirePokemonToBeBattling : true,
								priority : 1,
								action : function (which) {return function () {
									Battle.enter(which, true, emptyPlaces.shift());
									if (pressureSpeech) {
										Textbox.effect(function () {
											trainer.display.visible = true;
										}, Battle.drawing.transition(poke.trainer.display.position, "x", -(Battle.style === "double" ? 80 : 40), Settings._("switch transition duration") * Time.framerate));
										Textbox.spiel(trainer._("pressure speech"), null, Battle.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
											trainer.display.visible = false;
										});
										Textbox.say("", 0); // Little hack to make sure the right textbox displays, not the next (menu) one
									}
								}; }(poke)
							});
							poke.battler.reserved = true;
							++ sendingOut;
						}
					});
				} else {
					var healthyPokemon = Battle.opposingTrainers.first().healthyPokemon(true);
					if (healthyPokemon.length > emptyPlaces.length) {
						Textbox.effect(function () {
							if (Battle.communication.length >= emptyPlaces.length) {
								Battle.continueToNextTurn(true);
							} else {
								Battle.state = {
									"kind" : "waiting",
									"for" : "send"
								};
								Textbox.stateUntil("Waiting for the other player to make a decision...", function () { return Battle.state.kind !== "waiting"; });
							}
						});
						anyQueries = true;
					} else {
						foreach(healthyPokemon, function (poke, which) {
							Battle.enter(poke, true, emptyPlaces.shift());
						});
					}
				}
			}
			if (!anyQueries)
				Battle.continueToNextTurn();
		}
	},
	continueToNextTurn : function (sendOutOpponentPokemon) {
		if (sendOutOpponentPokemon) {
			var emptyPlaces = [];
			foreach(Battle.opponents, function (poke, i) {
				if (poke === NoPokemon)
					emptyPlaces.push(i);
			});
			var healthyPokemon = Battle.opposingTrainers.first().healthyPokemon(true);
			foreach(emptyPlaces, function (place) {
				Battle.enter(healthyPokemon[Battle.communication.shift().which], true, place);
			});
		}
		Battle.race(Battle.queue);
		Battle.queue = [];
		if (Battle.state.kind === "waiting") {
			Battle.state = {
				kind : "running"
			};
			Textbox.update();
		}
		if (Battle.survey()) {
			Battle.fillEmptyPlaces(true);
		} else {
			++ Battle.turns;
			Battle.startTurn();
		}
	},
	damage : function (poke, damage, displayMessages) {
		var amount = damage.damage;
		if (amount < 0)
			return;
		amount = Math.floor(amount);
		if (damage.critical && damage.effectiveness > 0)
			Textbox.state("It's a critical hit!");
		if (arguments.length < 3 || displayMessages) {
			switch (damage.effectiveness) {
				case 4:
					Textbox.state("It's super effective!");
					break;
				case 2:
					Textbox.state("It's super effective!");
					break;
				case 1:
					break;
				case 0.5:
					Textbox.state("It's not very effective...");
					break;
				case 0.25:
					Textbox.state("It's not very effective...");
					break;
				case 0:
					Textbox.state("It doesn't affect " + poke.name() + "!");
					return;
			}
		}
		if (poke.battler.substitute > 0 && !damage.infiltrates) {
			Textbox.state(poke.name() + "'s Substitute took the damage!");
			poke.battler.substitute -= amount;
			if (poke.battler.substitute <= 0) {
				Textbox.state(poke.name() + "'s Substitute broke!");
				poke.battler.substitute = 0;
			}
			return;
		}
		var previousHealth = poke.health;
		poke.health = Math.max(0, poke.health - amount);
		if (typeof damage.category !== "undefined" && damage.category !== null)
			poke.battler.damaged[damage.category] += amount;
		var display = Display.state.save();
		Textbox.effect(function () { return Display.state.transition(display); });
		if (!poke.fainted()) {
			Battle.triggerEvent(Triggers.health, {
				change : -amount
			}, damage.cause, poke);
		}
	},
	survey : function () {
		/*
			Battle.survey() looks at all the Pokémon after a move has been used to check whether any of the Pokémon should faint.
			This means that fainting happens when all Pokémon have been damaged, rather than after each individual effect of damage
			has been dealt out.
		*/
		if (!Battle.finished) {
			var cleanedUp = false, drawnBattle = !Battle.alliedTrainers.first().hasHealthyPokemon() && !Battle.opposingTrainers.first().hasHealthyPokemon();
			foreach(Battle.all(true), function (poke) {
				if (poke.fainted()) {
					poke.battler.display.transition = 0;
					poke.battler.display.height = 0;
					var displayFaint = Display.state.save();
					Textbox.state(poke.name() + " fainted!", function () { return Display.state.transition(displayFaint); });
					poke.alterFriendship(-1);
					Battle.removeFromBattle(poke, drawnBattle);
					cleanedUp = true;
				}
			});
			if (drawnBattle) {
				if (Battle.opposingTrainers.contains(TheWild)) {
					Textbox.state(Battle.alliedTrainers[0].pronoun(true) + " defeated the wild Pokémon, but at heavy costs...");
				} else {
					Textbox.state("What?! There aren't any Pokémon left to fight!");
					Textbox.state("The battle is a complete draw!");
				}
				Textbox.effect(function () {
					Battle.end(false, {
						"outcome" : "draw"
					});
				});
				Battle.finish();
			}
			return cleanedUp;
		} else {
			return false;
		}
	},
	heal : function (poke, amount, cause) {
		if (amount < 0)
			return;
		amount = Math.ceil(amount);
		if (Battle.triggerEvent(Triggers.health, {
			change : amount
		}, cause, poke).contains(true))
			return;
		poke.health = Math.min(poke.maximumHealth(), poke.health + amount);
		var message = "Some of " + poke.name() + "'s health was restored.";
		if (poke.battler.battling) {
			var display = Display.state.save();
			Textbox.state(message, function () { return Display.state.transition(display); });
		} else
			Textbox.state(message);
	},
	healPercentage : function (poke, percentage, cause) {
		Battle.heal(poke, poke.maximumHealth() * percentage, cause);
	},
	escapeAttempts : 0,
	escape : function (currentBattler) {
		if (Battle.situation === Battles.situation.trainer) {
			Textbox.state("You can't run from a trainer battle!");
			return true;
		}
		if (currentBattler.battler.isTrapped()) {
			Battle.queue.push({
				priority : 6, action : function () {
					Textbox.state(currentBattler.name() + " is trapped and can't escape!");
				}
			});
		} else {
			var maxSpeed = 0;
			foreach(Battle.opponents.filter(onlyPokemon), function (poke) {
				if (poke.stats.speed(true) > maxSpeed)
					maxSpeed = poke.stats.speed(true);
			});
			var escapeChance = (currentBattler.stats.speed(true) * 32) / ((maxSpeed / 4) % 256) + 30 * (Battle.escapeAttempts ++);
			if (escapeChance > 255 || randomInt(255) < escapeChance) {
				Battle.queue.push({priority : 6, action : function () {
					Textbox.state(Battle.alliedTrainers[0].pronoun(true) + " escaped successfully!", function () {
						Battle.end(false, {
							"outcome" : "escape"
						});
					}); Battle.finish(); }
				});
			} else
				Battle.queue.push({priority : 6, action : function () {
					Textbox.state(Battle.alliedTrainers[0].pronoun(true) + " couldn't get away!");
				}});
		}
	},
	attemptCapture : function (poke, ball, trainer) {
		if (arguments.length < 3)
			trainer = Game.player;
		var modifiers = {
			status : 1,
			species : Pokedex._(poke.species)["catch rate"],
			ball : (typeof ball["catch rate"] === "number" ? ball["catch rate"] : ball["catch rate"]())
		};
		switch (poke.status) {
			case "asleep":
			case "frozen":
				modifiers.status = 2.5;
				break;
			case "paralysed":
			case "poisoned":
			case "badly poisoned":
			case "burned":
				modifiers.status = 1.5;
				break;
		}
		var modifiedCatchRate = (((3 * poke.maximumHealth() - 2 * poke.health) * modifiers.species * modifiers.ball) / (3 * poke.maximumHealth())) * modifiers.status, shakeProbability = 65536 / Math.pow(255 / modifiedCatchRate, 1 / 4), caught = true;
		var criticalCaptureChance = modifiedCatchRate, criticalCapture = false;
		if (trainer.dex.caught.length > 600)
			criticalCaptureChance *= 2.5;
		else if (trainer.dex.caught.length > 450)
			criticalCaptureChance *= 2;
		else if (trainer.dex.caught.length > 300)
			criticalCaptureChance *= 1.5;
		else if (trainer.dex.caught.length > 150)
			criticalCaptureChance *= 1;
		else if (trainer.dex.caught.length > 30)
			criticalCaptureChance *= 0.5;
		else
			criticalCaptureChance *= 0;
		if (srandom.number(2047) < criticalCapture)
			criticalCapture = true;
		if (modifiedCatchRate < 255) {
			for (var shakes = 0; shakes < (criticalCapture ? 1 : 4); ++ shakes) {
				if (srandom.number(65535) > shakeProbability) {
					caught = false;
					break;
				}
			}
		} else
			shakes = 4;
		if (!caught) {
			switch (shakes) {
				case 0:
					Textbox.state((trainer === Game.player ? "Oh no! " : "") + "The Pokémon broke free!");
					break;
				case 1:
					Textbox.state((trainer === Game.player ? "Aww! " : "") + "It appeared to be caught!");
					break;
				case 2:
					Textbox.state((trainer === Game.player ? "Aargh! " : "") + "Almost had it!");
					break;
				case 3:
					Textbox.state((trainer === Game.player ? "Gah! " : "") + " It was so close, too!");
					break;
			}
		} else {
			poke.battler.display.transition = 0;
			var display = Display.state.save();
			Textbox.state((trainer === Game.player ? "Gotcha! " : "") + poke.name() + " was caught!", function () { return Display.state.transition(display); });
			Battle.removeFromBattle(poke, false);
			poke.caught.ball = ball;
			trainer.give(poke);
		}
		return caught;
	},
	removeFromBattle : function (poke, drawnBattle) {
		// Stops a Pokémon battling, either because they've fainted, or because they've been caught in a Poké ball
		if (Battle.kind !== Battles.kind.online) {
			foreach(poke.battler.opponents, function (gainer) {
				if (!gainer.fainted()) {
					if (gainer.gainExperience(poke, poke.battler.opponents.length, true)) // If a level was gained
						Battle.levelUppers.pushIfNotAlreadyContained(gainer);
				}
			});
		}
		var place;
		if (poke.battler.side === Battles.side.near) {
			place = Battle.allies.indexOf(poke);
			Battle.allies[place] = NoPokemon;
		} else {
			place = Battle.opponents.indexOf(poke);
			Battle.opponents[place] = NoPokemon;
		}
		poke.battler.reset();
		if (!poke.trainer.hasHealthyPokemon(false, poke)) {
			var playerHasBeenDefeated = (poke.trainer === Battle.alliedTrainers.first()), trainerBattle = (Battle.situation === Battles.situation.trainer), playerName = Battle.alliedTrainers.first().pronoun(true), endBattleFlags;
			if (trainerBattle) {
				var opponents = [];
				foreach(Battle.opposingTrainers, function (opposer) {
					opponents.push(opposer.fullname());
				});
			}
			if (!drawnBattle) {
				if (playerHasBeenDefeated) {
					if (trainerBattle)
						Textbox.state(opponents + " " + (opponents.length !== 1 ? "have" : "has") + " defeated " + playerName + "!");
					else
						Textbox.state(playerName + " " + (poke.trainer === Game.player ? "have" : "has") + " been defeated by the wild Pokémon!");
					if (Battle.kind !== Battles.kind.online) {
						var highestLevel = 0;
						foreach(poke.trainer.party.pokemon, function (pkmn) {
							if (pkmn.level > highestLevel)
								highestLevel = pkmn.level;
						});
						var basePayout;
						switch (Math.min(8, poke.trainer.badges.length)) { // May have greater than 8 badges due to multiple regions
							case 0: basePayout = 8; break;
							case 1: basePayout = 16; break;
							case 2: basePayout = 24; break;
							case 3: basePayout = 36; break;
							case 4: basePayout = 48; break;
							case 5: basePayout = 64; break;
							case 6: basePayout = 80; break;
							case 7: basePayout = 100; break;
							case 8: basePayout = 120; break;
						}
						var priceOfDefeat = highestLevel * basePayout;
						if (poke.trainer.money > 0) {
							priceOfDefeat = Math.min(priceOfDefeat, poke.trainer.money);
							Textbox.state(playerName + " " + (trainerBattle ? "paid out" : "dropped") + " $" + priceOfDefeat + " " + (trainerBattle ? "to " + commaSeparatedList(opponents) : "in " + poke.trainer.possessiveGenderPronoun() + " panic to get away") + ".");
							Battle.alliedTrainers.first().money -= priceOfDefeat;
						} else if (trainerBattle) {
							Textbox.state(playerName + " didn't have any money to pay " + opponents + "!");
						}
						Textbox.state(playerName + " blacked out!");
					}
					endBattleFlags = {
						"outcome" : "opposing victory"
					};
				} else {
					Textbox.state(playerName + " " + (Battle.alliedTrainers.first() !== Game.player ? "has" : "have") + " defeated " + (trainerBattle ? opponents : "the wild Pokémon") + "!");
					if (Battle.kind !== Battles.kind.online) {
						if (trainerBattle) {
							foreach(Battle.opposingTrainers, function (opposer, i) {
								Textbox.effect(function () {
									poke.trainer.display.visible = true;
								}, Battle.drawing.transition(poke.trainer.display.position, "x", 0, Settings._("switch transition duration") * Time.framerate));
								Textbox.spiel(opposer._("defeat speech"));
								if (i !== Battle.opposingTrainers.length - 1) {
									Textbox.effect(null, Battle.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
										poke.trainer.display.visible = false;
									});
								}
							});
							var prizeMoney = 0;
							foreach(Battle.opposingTrainers, function (opposer) {
								prizeMoney += opposer.party.pokemon.last().level * Classes[opposer.class].payout;
							});
							Textbox.state(opponents + " paid " + Battle.alliedTrainers.first().pronoun(false) + " $" + prizeMoney + " as a reward.");
							Battle.alliedTrainers.first().money += prizeMoney;
						}
					}
					endBattleFlags = {
						"outcome" : "allied victory"
					};
				}
				Textbox.effect(function () {
					Battle.end(false, endBattleFlags);
				});
				Battle.finish();
				return;
			}
		}
	},
	swap : function (out, replacement, forced) {
		Battle.enter(replacement, false, Battle.withdraw(out, forced));
	},
	enter : function (poke, startOrEndOfTurn, place, initial) {
		Battle.participants.pushIfNotAlreadyContained(poke);
		poke.battler.reset();
		poke.battler.battling = true;
		var ally = Battle.alliedTrainers.contains(poke.trainer);
		poke.battler.side = (ally ? Battles.side.near : Battles.side.far);
		if (arguments.length < 3 || place === null) {
			if (ally) {
				if (Battle.allies.indexOf(NoPokemon) !== -1)
					Battle.allies[Battle.allies.indexOf(NoPokemon)] = poke;
				else
					Battle.allies.push(poke);
			} else {
				if (Battle.opponents.indexOf(NoPokemon) !== -1)
					Battle.opponents[Battle.opponents.indexOf(NoPokemon)] = poke;
				else
					Battle.opponents.push(poke);
			}
		} else {
			if (ally)
				Battle.allies[place] = poke;
			else
				Battle.opponents[place] = poke;
		}
		// The start of the battle
		if (poke.trainer !== TheWild) {
			poke.battler.display.transition = 0;
			var displayInitial = Display.state.save();
			poke.battler.display.transition = 1;
			var display = Display.state.save();
			Textbox.state(poke.trainer.pronoun(true) + " sent out " + poke.name() + "!");
		} else if (!initial) {
			var displayInitial = Display.state.save();
			Textbox.state("A wild " + poke.name() + " was right behind!", function () { Display.state.load(displayInitial); });
		}
		if (initial) {
			Textbox.effect(null, Battle.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
				poke.trainer.display.visible = false;
			});
		}
		if (poke.trainer !== TheWild)
			Textbox.effect(function () { Display.state.load(displayInitial); return Display.state.transition(display); });
		Textbox.effect(function () {
			poke.cry();
		});
		foreach(Battle.opponentsTo(poke), function (opponent) {
			poke.battler.opponents.pushIfNotAlreadyContained(opponent);
			opponent.battler.opponents.pushIfNotAlreadyContained(poke);
		});
		foreach((poke.battler.side === Battles.side.near ? Battle.hazards.near : Battle.hazards.far), function (hazard) {
			hazard.type.effects.hazard(poke, hazard.stack);
		});
		if (!startOrEndOfTurn)
			Battle.triggerEvent(Triggers.entrance, {}, poke);
		Battle.recoverFromStatus(poke);
	},
	withdraw : function (poke, forced) {
		poke.battler.display.transition = 0;
		var display = Display.state.save(), place;
		if (poke.battler.side === Battles.side.near) {
			place = Battle.allies.indexOf(poke);
			Battle.allies[place] = NoPokemon;
		} else {
			place = Battle.opponents.indexOf(poke);
			Battle.opponents[place] = NoPokemon;
		}
		poke.battler.reset();
		var displayWithdrawn = Display.state.save();
		if (poke.health > 0) {
			Textbox.state((!forced ? (Game.player === poke.trainer ? "Come back " + poke.name() + "!" : poke.trainer.name + " withdrew " + poke.name() + ".") : poke.name() + " was forced to retreat from the battle!"), function () { return Display.state.transition(display); }, null, function () { Display.state.load(displayWithdrawn); });
		}
		return place;
	},
	race : function (entrants, action) {
		foreach(entrants, function (entrant) {
			if (entrant.hasOwnProperty("poke") && !(entrant.poke instanceof pokemon))
				entrant.poke = Battle.pokemonInPlace(entrant.poke);
		});
		entrants.sort(function (a, b) {
			if (a.hasOwnProperty("poke") && b.hasOwnProperty("poke")) {
				return a.poke.trainer.team - b.poke.trainer.team;
			}
		});
		foreach(entrants, function (entrant) { // If Pokémon have exactly the same speed, they should go randomly
			if (entrant.hasOwnProperty("poke")) {
				entrant.poke.battler.speed = srandom.number(0.5);
			}
		});
		entrants.sort(function (a, b) {
			if (a.priority !== b.priority)
				return b.priority - a.priority;
			else {
				if (a.hasOwnProperty("poke") && b.hasOwnProperty("poke"))
					return (Math.floor(b.poke.stats.speed(true) * (b.poke.status === "paralysed" ? 0.25 : 1)) + b.poke.battler.speed) - (Math.floor(a.poke.stats.speed(true) * (a.poke.status === "paralysed" ? 0.25 : 1)) + a.poke.battler.speed);
				else
					return 0;
			}
		});
		foreach(entrants, function (racer) {
			if (!Battle.active || Battle.finished)
				return true;
			if (racer.hasOwnProperty("poke") && (!racer.poke.battler.battling && !racer.doesNotRequirePokemonToBeBattling))
				return;
			if (action)
				action(racer.poke);
			else
				racer.action(racer.poke);
			Battle.survey();
		});
	},
	triggerEvent : function (event, data, cause, subjects) {
		if (arguments.length < 4)
			subjects = Battle.all(true);
		subjects = wrapArray(subjects);
		var responses = [];
		foreach(subjects, function (poke) {
			responses = responses.concat(poke.respondToEvent(event, data, cause));
			data.oneself = (cause === poke);
			foreach((poke.battler.side === Battles.side.near ? Battle.effects.near : Battle.effects.far), function (effect) {
				if (effect.type.uponTrigger.event === event)
					if (!effect.type.uponTrigger.hasOwnProperty("oneself") || effect.type.uponTrigger.oneself === data.oneself)
						responses.push(effect.type.uponTrigger.action(data, poke));
			});
		});
		return responses;
	},
	stat : function (poke, stat, change, cause) {
		// A change of zero will reset the stat
		if (poke.battler.substitute > 0 && cause !== poke) {
			Textbox.state(poke.name() + "'s Substitute isn't affected by the stat change.");
			return;
		}
		if (Battle.triggerEvent(Triggers.stat, {
			stat : stat,
			change : change
		}, cause, poke).contains(true))
			return true;
		if (change !== 0) {
			if (Math.abs(poke.battler.statLevel[stat]) === 6 && Math.sign(change) === Math.sign(poke.battler.statLevel[stat])) {
				Textbox.state(poke.name() + "'s " + stat + " can't go any " + (change > 0 ? "higher" : "lower") + "!");
				return;
			}
			poke.battler.statLevel[stat] += change;
			poke.battler.statLevel[stat] = Math.clamp(-6, poke.battler.statLevel[stat], 6);
			Textbox.state(poke.name() + "'s " + stat + " was " + (Math.abs(change) > 1 ? "sharply " : "") + (change > 0 ? "raised" : "lowered") + ".");
		} else {
			poke.battler.statLevel[stat] = 0;
			Textbox.state(poke.name() + "'s " + stat + " was reset.");
		}
	},
	teammates : function (pokeA, pokeB) {
		return Battle.alliesTo(pokeA) === Battle.alliesTo(pokeB);
	},
	flinch : function (poke) {
		if (!poke.battler.flinching && poke.battler.substitute === 0) {
			poke.battler.flinching = true;
			Textbox.state(poke.name() + " flinched!");
		}
	},
	confuse : function (poke) {
		if (poke.battler.confused) {
			Textbox.state(poke.name() + " is already confused!");
		} else {
			Textbox.state(poke.name() + " has become confused!");
			poke.battler.confused = true;
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " broke out of " + target.possessivePronoun() + " confusion!");
				target.battler.confused = false;
			}, srandom.int(1, 4), poke);
		}
	},
	infatuate : function (poke) {
		if (poke.battler.infatuated) {
			Textbox.state(poke.name() + " is already infatuated!");
		} else {
			Textbox.state(poke.name() + " has become infatuated!");
			poke.battler.infatuated = true;
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " broke out of " + target.possessivePronoun() + " infatuation!");
				target.battler.infatuated = false;
			}, srandom.int(1, 4), poke);
		}
	},
	placeHazard : function (hazard, maximum, side) {
		var hazardSide = (side === Battles.side.near ? Battle.hazards.near : Battle.hazards.far), maxedOut = false;
		if (!foreach(hazardSide, function (which) {
			if (which.type ===  Moves._(hazard)) {
				if (which.stack < maximum)
					++ which.stack;
				else
					maxedOut = true;
				return true;
			}
		}))
			hazardSide.push({
				type : Moves._(hazard),
				stack : 1
			});
		return !maxedOut;
	},
	bringIntoEffect : function (effect, duration, side) {
		var effectSide = (side === Battles.side.near ? Battle.effects.near : Battle.effects.far);
		if (!foreach(effectSide, function (which) {
			if (which.type === effect) {
				which.expiration = Battle.turns + duration;
				return true;
			}
		}))
			effectSide.push({
				type : effect,
				expiration : Battle.turns + duration
			});
	},
	moveHaveEffect : function (move, when, target, data, repeating) {
		if (!repeating)
			repeating = false;
		if (data)
			Battle.effects.specific.push({
				type : Moves._(move).effects.effect,
				due : (!repeating ? Battle.turns : 0) + when,
				target : target,
				data : data,
				expired : false,
				repeating : repeating
			});
		else
			Battle.effects.specific.push({
				type : Moves._(move).effects.effect,
				due : (!repeating ? Battle.turns : 0) + when,
				target : target,
				expired : false,
				repeating : repeating
			});
	},
	moveHaveRepeatingEffect : function (move, when, target, data) {
		Battle.moveHaveEffect(move, when, target, data, true);
	},
	moveHasEffect : function (move, target) {
		return Battle.hasEffect(Moves._(move).effects.effect, target);
	},
	haveEffect : function (effect, when, target) {
		Battle.effects.specific.push({type : effect, due : Battle.turns + when, target : target, expired : false});
	},
	hasEffect : function (effect, target) {
		return foreach(Battle.effects.specific, function (which) {
			if (which.type === effect && which.target === target)
				return true;
		});
	},
	hasEffectOnSide : function (effect, side) {
		side = (side === Battles.side.near ? Battle.effects.near : Battle.effects.far);
		return foreach(side, function (which) {
			if (which.type === effect)
				return true;
		});
	},
	inflict : function (poke, status) {
		var types = Pokedex._(poke.species).types;
		if ((status !== "burned" || !types.contains("Fire")) && (status !== "paralysed" || !types.contains("Electric")) && status !== "frozen" || !types.contains("Ice") && ((status !== "poisoned" && status !== "badly poisoned") || (!types.contains("Poison") && !types.contains("Steel")))) {
			poke.status = status;
			Battle.recoverFromStatus(poke);
		}
	},
	recoverFromStatus : function (poke) {
		if (poke.status === "asleep") {
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " woke up!");
				target.status = "none";
			}, srandom.int(1, 5), poke);
		}
		if (poke.status === "frozen") {
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " thawed!");
				target.status = "none";
			}, srandom.int(1, 5), poke);
		}
	}
}, {
	initialise : function () {
		Battle.sketching = [];
		for (var i = 0; i < 4; ++ i) {
			Battle.sketching[i] = document.createElement("canvas");
			Battle.sketching[i].width = Settings._("screen dimensions => width");
			Battle.sketching[i].height = Settings._("screen dimensions => height");
			Battle.sketching[i].getContext("2d").imageSmoothingEnabled = false;
		}
	},
	update : function () {
		if (Battle.active && Battle.state.kind === "opening") {
			Battle.state.transition += 1 / (Time.framerate * Settings._("segue transition duration"));
			Battle.state.transition = Math.clamp(0, Battle.state.transition, 1);
			if (Battle.state.transition === 1)
				Battle.begin();
		}
	},
	drawing : {
		canvas : {
			width : Settings._("screen dimensions => width") * Game.zoom,
			height : Settings._("screen dimensions => height") * Game.zoom,
			selector : "#game-battle",
			className : "centre",
			smoothing : false
		},
		draw : function (_canvas) {
			var originalCanvas = _canvas, originalContext = originalCanvas.getContext("2d"), drawAfterwards = [];
			var canvas = Battle.sketching[0], context = canvas.getContext("2d"), display = Display.state.current, now = performance.now();
			var shadowCanvas = Battle.sketching[1], shadowContext = shadowCanvas.getContext("2d");
			shadowContext.textAlign = "center";
			shadowContext.textBaseline = "bottom";
			for (var i = 0; i < Battle.sketching.length; ++ i)
				Battle.sketching[i].getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
			originalContext.fillStyle = context.fillStyle = "black";
			originalContext.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
			if (Battle.state.kind !== "inactive") {
				if (Battle.state.kind === "loading") {
					originalContext.fillStyle = "hsl(0, 0%, 20%)";
					originalContext.fillRect(40 * Game.zoom, originalCanvas.height / 2 - 10 * Game.zoom, originalCanvas.width - 80 * Game.zoom, 20 * Game.zoom);
					originalContext.fillStyle = "hsl(0, 0%, 90%)";
					originalContext.fillRect(40 * Game.zoom, originalCanvas.height / 2 - 10 * Game.zoom, (originalCanvas.width - 80 * Game.zoom) * Battle.state.progress, 20 * Game.zoom);
					originalContext.textAlign = "center";
					originalContext.textBaseline = "middle";
					originalContext.font = Font.load(12 * Game.zoom);
					originalContext.strokeStyle = "hsl(0, 0%, 90%)";
					originalContext.lineWidth = 5;
					originalContext.strokeText((Battle.state.progress * 100).toFixed(0) + "%", originalCanvas.width / 2, originalCanvas.height / 2);
					originalContext.fillStyle = "black";
					originalContext.fillText((Battle.state.progress * 100).toFixed(0) + "%", originalCanvas.width / 2, originalCanvas.height / 2);
					if (Battle.state.failed.notEmpty()) {
						originalContext.textBaseline = "top";
						originalContext.fillStyle = "hsl(0, 0%, 90%)";
						originalContext.fillText("Failed to load " + Battle.state.failed.length + " file" + (Battle.state.failed.length !== 1 ? "s" : "") + ":", originalCanvas.width / 2, originalCanvas.height / 2 + (20 + 6) * Game.zoom);
						originalContext.fillStyle = "hsl(0, 0%, 50%)";
						foreach(Battle.state.failed, function (failed, i) {
							originalContext.fillText(failed, originalCanvas.width / 2, originalCanvas.height / 2 + (20 + 6 + 16 * (i + 1)) * Game.zoom);
						});
					}
				} else if (Battle.state.kind === "evolution") {
					var strips = 8, pan = (now / 500 % 1), distortion = 4;
					for (var i = - distortion * 4, j; i < (strips + distortion * 4 + 1); ++ i) {
						j = i - pan;
						context.fillStyle = "hsl(" + Math.min(50, ((j / (strips)) * 50)) + ", 100%, " + (35 + (j / (strips)) * (60 - 35)) + "%)";
						context.beginPath();
						context.moveTo(0, canvas.height);
						context.lineTo(0, Math.round((canvas.height / strips) * j));
						context.quadraticCurveTo(canvas.width / 2, Math.round((canvas.height / strips) * j) - (j - strips / 2) * 10 * distortion, canvas.width, Math.round((canvas.height / strips) * j));
						context.lineTo(canvas.width, canvas.height);
						context.fill();
					}
					context.textAlign = "center";
					context.textBaseline = "middle";
					if (Battle.state.stage === "before" || Battle.state.stage === "preparation" || Battle.state.stage === "stopped")
						Sprite.draw(canvas, Battle.state.evolving.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, null, null, now);
					if (Battle.state.stage === "finishing" || Battle.state.stage === "after")
						Sprite.draw(canvas, Battle.state.into.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, null, null, now);
					if (Battle.state.stage === "preparation")
						Battle.state.transition += 0.05;
					if (Battle.state.stage === "evolving")
						Battle.state.transition += 0.0025;
					if (Battle.state.stage === "finishing")
						Battle.state.transition -= 0.05;
					if (Battle.state.stage === "preparation" && Battle.state.transition >= 2) {
						Battle.state.stage = "evolving";
						Battle.state.transition = 0;
					}
					if (Battle.state.stage === "evolving" && Battle.state.transition >= 1) {
						Battle.state.stage = "finishing";
						Battle.state.transition = 4;
					}
					if (Battle.state.stage === "finishing" && Battle.state.transition <= 0) {
						Battle.state.stage = "after";
						Battle.state.evolving.evolve(Battle.state.into._("species"));
						Textbox.effect(function () {
							Battle.continueEvolutions();
						});
					}
					var transformationRate = Math.PI * Math.pow(2, Battle.state.transition * 7);
					if (Battle.state.stage !== "after") {
						var scale = 1, fade = 0;
						if (Battle.state.stage === "preparation")
							fade = Battle.state.transition;
						if (Battle.state.stage === "evolving") {
							fade = Math.sin(Battle.state.transition * (transformationRate / 2) + Math.PI * 0.25) >= 0 ? 1 : 0;
							scale = 1 + Math.sin(Battle.state.transition * transformationRate) * 0.5;
						}
						Sprite.draw(canvas, Battle.state.evolving.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], (new Matrix()).scale(scale).matrix, now);
					}
					if (Battle.state.stage !== "before" && Battle.state.stage !== "preparation") {
						var scale = 1, fade = 0;
						if (Battle.state.stage === "finishing")
							fade = Battle.state.transition;
						if (Battle.state.stage === "evolving") {
							fade = Math.sin(Battle.state.transition * (transformationRate / 2) + Math.PI * 1.25) > 0 ? 1 : 0;
							scale = 1 + Math.sin(Battle.state.transition * transformationRate) * 0.5;
						}
						Sprite.draw(canvas, Battle.state.into.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], (new Matrix()).scale(scale).matrix, now);
					}
					if (Battle.state.stage !== "before" && Battle.state.stage !== "after" && Battle.state.stage !== "stopped") {
						context.fillStyle = "black";
						var enclose = 1;
						if (Battle.state.stage === "preparation" || Battle.state.stage === "finishing")
							enclose = Math.clamp(0, Battle.state.transition, 1);
						context.fillRect(0, 0, canvas.width, canvas.height / 6 * enclose);
						context.fillRect(0, canvas.height, canvas.width, - canvas.height / 6 * enclose);
					}
				} else {
					Sprite.draw(Battle.sketching[2], Scenes._(Battle.scene).paths.sprite(), 0, 0);
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.lineWidth = 2;
					context.strokeStyle = "white";
					var shadowOpacity = Lighting.shadows.opacity(), shadowMatrix = new Matrix ([1, 0.1, -0.6, 0.4, 0, 0]), matrix = new Matrix(), position, transition, side;
					var sortDisplay = Battle.cache || (Battle.cache = Display.states[Display.state.save(Display.state.current)]), poke;
					var all = [].concat(sortDisplay.allies, sortDisplay.opponents.reverse()).filter(onlyPokemon).sort(function (a, b) {
						return Battle.drawing.position(Display.pokemonInState(b)).z - Battle.drawing.position(Display.pokemonInState(a)).z;
					});
					// Pokémon
					foreach(all, function (_poke) {
						poke = Display.pokemonInState(_poke);
						side = (poke.battler.side === Battles.side.near ? "back" : "front");
						position = Battle.drawing.position(poke);
						context.lineWidth = position.scale * 2;
						transition = (poke.fainted() ? 1 : poke.battler.display.transition);
						// Shadow
						Sprite.draw(shadowCanvas, poke.paths.sprite(side), position.x, position.y - position.z + poke.battler.display.position.y, true, [{ type : "fill", colour : "black" }, { type : "crop", heightRatio : poke.battler.display.height }], shadowMatrix.scale(position.scale * transition).scale(Math.pow(2, -poke.battler.display.position.y / 100)).matrix, now);
						// Outline
						if (poke.battler.display.outlined) {
							for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
								Sprite.draw(canvas, poke.paths.sprite(side), position.x + Math.cos(angle) * context.lineWidth, position.y - position.z + Math.sin(angle) * context.lineWidth, true, [{ type : "fill", colour : context.strokeStyle }, { type : "crop", heightRatio : poke.battler.display.height }], matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix, now);
							}
						}
						// Pokémon
						var filters = [];
						if (poke.shiny)
							filters.push({ type : "filter", kind : "shiny", pokemon : poke });
						filters.push({ type : "crop", heightRatio : poke.battler.display.height });
						Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, filters, matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix, now);
						// Lighting
						if (Scenes._(Battle.scene).hasOwnProperty("lighting"))
							Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, [{ type : "fill", colour : Scenes._(Battle.scene).lighting }, { type : "crop", heightRatio : poke.battler.display.height }], matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix, now);
						// Glow / Fade
						if (transition > 0 && transition < 1)
							Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : Math.pow(1 - transition, 0.4) }, { type : "crop", heightRatio : poke.battler.display.height }], matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix, now);
					});
					// Trainers
					foreach(Battle.allTrainers(), function (trainer) {
						if (trainer !== TheWild && trainer.display.visible) {
							position = Battle.drawing.position(trainer);
							side = (Battle.alliedTrainers.contains(trainer) ? "back" : null);
							// Shadow
							Sprite.draw(shadowCanvas, trainer.paths.sprite(side), position.x, position.y - position.z + trainer.display.position.y, true, { type : "fill", colour : "black" }, shadowMatrix.scale(position.scale).scale(Math.pow(2, -trainer.display.position.y / 100)).matrix, now);
							// Trainer
							Sprite.draw(canvas, trainer.paths.sprite(side), position.x, position.y - position.z, true, null, matrix.scale(position.scale).matrix, now);
							// Lighting
							if (Scenes._(Battle.scene).hasOwnProperty("lighting"))
								Sprite.draw(canvas, trainer.paths.sprite(side), position.x, position.y - position.z, true, { type : "fill", colour : Scenes._(Battle.scene).lighting }, matrix.scale(position.scale).matrix, now);
						}
					});
					if (sortDisplay.allies.length === 0 || sortDisplay.opponents.length === 0) {
						foreach(Battle.allTrainers(), function (trainer) {
							if (trainer !== TheWild && trainer.display.visible) {
								drawAfterwards.push(function (canvas) {
									Battle.drawing.partyBar(canvas, trainer, Battle.alliedTrainers.contains(trainer), Battle.alliedTrainers.contains(trainer) ? 120 : 30);
								});
							}
						});
					}
					// Weather effects
					if (Settings._("visual weather effects") || display.flags.weather)
						Weather.draw(context);
					// Status bars
					foreach(display.opponents, function (poke, place) {
						if (poke !== NoPokemon)
							drawAfterwards.push(function (canvas) {
								Battle.drawing.bar(canvas, poke, false, 30 + 34 * place);
							});
					});
					foreach(display.allies, function (poke, place) {
						if (poke !== NoPokemon)
							drawAfterwards.push(function (canvas) {
								Battle.drawing.bar(canvas, poke, true, 120 + 42 * place, true);
							});
					});
					if (Battle.state.kind === "opening") {
						drawAfterwards.push(function (canvas) {
							context.fillStyle = "hsla(0, 0%, 0%, " + (1 - Math.clamp(0, Battle.state.transition, 1)).toFixed(3) + ")";
							context.fillRect(0, 0, canvas.width, canvas.height);
						});
					}
				}
			}
			var smallContext = Battle.sketching[3].getContext("2d");
			smallContext.save();
			smallContext.translate(canvas.width / 2, canvas.height / 2);
			var transformation = new Matrix().rotate(View.angle);
			transformation.applyToContext(smallContext);
			var drawSketchingCanvas = function (i) {
				smallContext.drawImage(Battle.sketching[i], - (View.position.x + canvas.width * (View.zoom - 1) / 2) - canvas.width / 2, - (View.position.y + canvas.height * (View.zoom - 1) / 2) - canvas.height / 2, canvas.width * View.zoom, canvas.height * View.zoom);
			};
			drawSketchingCanvas(2);
			smallContext.globalAlpha = shadowOpacity;
			drawSketchingCanvas(1)
			smallContext.globalAlpha = 1;
			drawSketchingCanvas(0);
			smallContext.restore();
			originalContext.drawImage(Battle.sketching[3], (originalCanvas.width - canvas.width * Game.zoom) / 2, (originalCanvas.height - canvas.height * Game.zoom) / 2, canvas.width * Game.zoom, canvas.height * Game.zoom);
			foreach(drawAfterwards, function (drawing) {
				drawing(originalCanvas);
			});
		}
	}
});