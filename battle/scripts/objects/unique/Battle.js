/* jshint loopfunc: true */

TheWild = new character("The Wild");

Battle = {
	active : false,
	finished : true,
	kind : null,
	state : 0,
	situation : null,
	style : null,
	allies : [],
	alliedTrainers : [],
	opponents : [],
	opposingTrainers : [],
	weather : null,
	turns : 0,
	selection : 0,
	delayForInput : false, // Delay asking the player what they'd like to do until a potentially breaking change has been made (such as learning a new move, which needs to wait, so that the new move will show up in the Pokémon's move list)
	queue : [],
	actions : [],
	recording : [],
	communication : [],
	scene : "clearing",
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
	draw : {
		bar : function (poke, right, y, detailed) {
			var context = Game.canvas.context, pixelWidth = 14, percentageHealth = poke.health / poke.stats[Stats.health](), percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
			do {
				context.font = "lighter " + pixelWidth + "px Helvetica Neue";
				pixelWidth -= 2;
			} while (context.measureText(poke.name()).width > 60);
			var shapes = [
				{
					points : [{x : 0, y : -16}, {x : 82}, {x : 98, y : 0}, {x : 162}, {x : 146, y : 16}, {x : 0}],
					colour : "hsla(0, 0%, 0%, 0.6)"
				},
				{
					text :  poke.name(),
					position : {x : (78 + 20) / 2, y : (-16 + 4) / 2},
					align : {x : "center" , y : "middle"},
					colour : "white",
					font : "lighter " + pixelWidth + "px Helvetica Neue"
				},
				{
					points : [{x : 0, y : 6}, {x : 148 - 148 * (1 - percentageHealth)}, {x : 144 - 148 * (1 - percentageHealth), y : 10}, {x : 0}],
					colour : (percentageHealth > 1 / 2 ? "hsl(110, 100%, 40%)" : percentageHealth > 1 / 4 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)")
				},
				{
					text :  "Lv.",
					position : {x : 4, y : -16},
					align : {x : (right ? "right" : "left") , y : "top"},
					colour : "white",
					font : "lighter 8px Helvetica Neue"
				},
				{
					text :  poke.level,
					position : {x : 4, y : -8},
					align : {x : (right ? "right" : "left") , y : "top"},
					colour : "white",
					font : "lighter 10px Helvetica Neue"
				},
			], width = 0, current = {x : 0, y : 0};
			if (poke.gender !== Genders.neuter)
				shapes = shapes.concat([
					{
						points : [{x : 82, y : -16}, {x : 106}, {x : 122, y : 0}, {x : 98}],
						colour : (poke.gender === Genders.male ? "hsl(195, 100%, 45%)" : "hsl(325, 100%, 80%)")
					},
					{
						text :  (poke.gender === Genders.male ? "♂" : "♀"),
						position : {x : (82 + 122) / 2, y : (-16 + 0) / 2},
						align : {x : "center", y : "middle"},
						colour : (poke.gender === Genders.male ? "hsl(195, 100%, 5%)" : "hsl(325, 100%, 40%)"),
						font : "lighter 12px Helvetica Neue"
					}
				]);
			if (right) {
				shapes = shapes.concat([
					{
						points : [{x : 146, y : 16}, {x : 138, y : 24}, {x : 90}, {x : 82, y : 16}],
						colour : "hsla(0, 0%, 0%, 0.6)"
					},
					{
						text :  poke.health + " / " + poke.stats[Stats.health](),
						position : {x : (138 + 90) / 2, y : 22},
						align : {x : "center" , y : "bottom"},
						colour : "white",
						font : "lighter 10px Helvetica Neue"
					}
				]);
				if (Battle.kind !== Battles.kind.online) {
					shapes = shapes.concat([{
						points : [{x : 0, y : 18}, {x : 80}, {x : 86, y : 24}, {x : 0}],
						colour : "hsla(0, 0%, 0%, 0.6)"
					}]);
					if (percentageExperience > 0) {
						shapes = shapes.concat([{
							points : [{x : 0, y : 20}, {x : 78 - 80 * (1 - percentageExperience)}, {x : 80 - 80 * (1 - percentageExperience), y : 22}, {x : 0}],
							colour : "hsl(190, 100%, 50%)"
						}]);
					}
				}
			}
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
						context.lineTo(Game.canvas.element.width * (right ? 1 : 0) + (current.x - (width * (1 - poke.battler.display.transition)) + (poke.battler.display.outlined ? 0 : 0)) * (right ? -1 : 1), y + current.y);
					});
					context.fill();
				}
				if (shape.hasOwnProperty("text")) {
					context.font = shape.font;
					context.textAlign = shape.align.x;
					context.textBaseline = shape.align.y;
					context.fillText(shape.text, Game.canvas.element.width * (right ? 1 : 0) + (shape.position.x - (width * (1 - poke.battler.display.transition)) + (poke.battler.display.outlined ? 0 : 0)) * (right ? -1 : 1), y + shape.position.y);
				}
			});
		},
		position : function (poke, display) {
			display = display || Display.state.current;
			var ally = display.allies.contains(poke), position, place, count = Battle.pokemonPerSide();
			if (ally) {
				place = display.allies.indexOf(poke);
				position = {
					x : 90 + poke.battler.display.position.x + place * 100 - (count - 1) * 40,
					y : 220 - poke.battler.display.position.y,
					z : poke.battler.display.position.z
				};
			} else {
				place = display.opponents.indexOf(poke);
				position = {
					x : 230 - poke.battler.display.position.x - place * 80 + (count - 1) * 40,
					y : 220 - poke.battler.display.position.y,
					z : 115 - poke.battler.display.position.z
				};
			}
			position.scale = 2 / Math.pow(2, position.z / 115);
			return position;
		}
	},
	redraw : function () {
		var self = Battle, context = Game.canvas.context, display = Display.state.current;
		context.fillStyle = "black";
		context.fillRect(0, 0, Game.canvas.element.width, Game.canvas.element.height);
		if (!self.active)
			return;
		Game.canvas.draw.sprite("scenes/" + Battle.scene, 0, 0);
		context.textAlign = "center";
		context.textBaseline = "bottom";
		context.strokeWidth = 2;
		context.strokeStyle = "white";
		var shadowOpacity = Lighting.shadows.opacity(), shadowMatrix = new Matrix ([1, 0.1, -0.6, 0.4, 0, 0]), matrix = new Matrix(), position, transition, side;
		var sortDisplay = Display.states[Display.state.save(Display.state.current)], poke;
		var all = [].concat(sortDisplay.allies, sortDisplay.opponents.reverse()).filter(onlyPokemon).sort(function (a, b) {
			return Battle.draw.position(Display.pokemonInState(b)).z - Battle.draw.position(Display.pokemonInState(a)).z;
		});
		foreach(all, function (poke) {
			poke = Display.pokemonInState(poke);
			side = (poke.battler.side === Battles.side.near ? "back" : "front");
			position = Battle.draw.position(poke);
			context.strokeWidth = position.scale * 2;
			transition = (poke.fainted() ? 1 : poke.battler.display.transition);
			Game.canvas.draw.sprite(poke.sprite.path(side), position.x, position.y - position.z + poke.battler.display.position.y, true, [{type : "fill", colour : "hsla(0, 0%, 0%, " + shadowOpacity + ")"}, {type : "crop", heightRatio : poke.battler.display.height}], shadowMatrix.scale(position.scale * transition).scale(Math.pow(2, -poke.battler.display.position.y / 100)).matrix);
			if (poke.battler.display.outlined) {
				for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
					Game.canvas.draw.sprite(poke.sprite.path(side), position.x + Math.cos(angle) * context.strokeWidth, position.y - position.z + Math.sin(angle) * context.strokeWidth, true, [{type : "fill", colour : context.strokeStyle}, {type : "crop", heightRatio : poke.battler.display.height}], matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix);
				}
			}
			Game.canvas.draw.sprite(poke.sprite.path(side), position.x, position.y - position.z, true, {type : "crop", heightRatio : poke.battler.display.height}, matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix);
			if (transition > 0 && transition < 1)
				Game.canvas.draw.sprite(poke.sprite.path(side), position.x, position.y - position.z, true, [{type : "fill", colour : "white"}, {type : "opacity", value : Math.pow(1 - transition, 0.4)}, {type : "crop", heightRatio : poke.battler.display.height}], matrix.scale(position.scale * transition).rotate(poke.battler.display.angle).matrix);
		});
		if (Settings.visualWeather || display.flags.weather)
			Weather.draw(Game.canvas.context);
		foreach(display.opponents, function (poke, place) {
			if (poke !== NoPokemon)
				self.draw.bar(poke, false, 30 + 34 * place);
		});
		foreach(display.allies, function (poke, place) {
			if (poke !== NoPokemon)
				self.draw.bar(poke, true, 120 + 42 * place, true);
		});
		context.fillStyle = "hsla(0, 0%, 0%, " + (1 - Math.clamp(0, Battle.state, 1)).toFixed(3) + ")";
		context.fillRect(0, 0, Game.canvas.element.width, Game.canvas.element.height);
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
			return Battle.opponents;
		if (Battle.opponents.indexOf(poke) > -1)
			return Battle.allies;
		return [];
	},
	update : function () {
		var self = Battle;
		if (self.active && self.state < 1)
			self.state += (1 / Time.framerate) * 4;
		self.state = Math.clamp(0, self.state, 1);
	},
	playRecording : function (recording, alliedTrainers, opposingTrainers) {
		recording.teamA = alliedTrainers;
		recording.teamB = opposingTrainers;
		Battle.recording = recording;
		srandom.seed = Battle.recording.seed;
		Battle.begin(Battle.recording.teamA, Battle.recording.teamB, Battle.recording.style, Battle.recording.weather, Battles.kind.recording);
	},
	beginOnline : function (seed, alliedTrainers, opposingTrainers, style, weather) {
		srandom.seed = seed;
		Battle.begin(alliedTrainers, opposingTrainers, style, weather, Battles.kind.online);
	},
	beginWildBattle : function (pokes) {
		pokes = wrapArray(pokes);
		TheWild.party.empty();
		foreach(pokes, function (poke) {
			TheWild.give(poke);
		});
		Battle.begin(Game.player, TheWild, Battles.style.normal, Weathers.hail);
	},
	begin : function (alliedTrainers, opposingTrainers, style, weather, kind) {
		Battle.active = true;
		Battle.finished = false;
		if (arguments.length >= 5)
			Battle.kind = kind;
		else
			Battle.kind = Battles.kind.local;
		Battle.situation = Battles.situation.wild;
		if (arguments.length >= 3 && typeof style !== "undefined" && style !== null)
			Battle.style = style;
		else
			Battle.style = Battles.style.normal;
		if (arguments.length >= 4 && typeof weather !== "undefined" && weather !== null)
			Battle.weather = weather;
		else
			Battle.weather = Weathers.clear;
		Weather.weather = Battle.weather;
		if (!(alliedTrainers instanceof Array))
			alliedTrainers = [alliedTrainers];
		if (!(opposingTrainers instanceof Array))
			opposingTrainers = [opposingTrainers];
		foreach(alliedTrainers, function (participant) {
			Battle.alliedTrainers.push(participant);
			for (var i = 0, newPoke; i < Math.min((Battle.style === Battles.style.normal ? 1 : 2) / alliedTrainers.length, participant.healthyPokemon().length); ++ i) {
				newPoke = participant.healthyPokemon()[i];
				Battle.queue.push({
					poke : newPoke,
					doesNotRequirePokemonToBeBattling : true,
					priority : 1 - (1 / (alliedTrainers.length + 3)) * (i + 1),
					action : function (which) {return function () {
						Battle.enter(which, true);
					}; }(newPoke)});
			}
		});
		foreach(opposingTrainers, function (participant) {
			if (participant instanceof character) {
				if (!participant.hasHealthyPokemon()) {
					Textbox.state(participant.name + " doesn't have any Pokémon! The battle must be stopped!", function () { Battle.end(); });
					Battle.finish();
					return;
				} else {
					Battle.opposingTrainers.push(participant);
					for (var i = 0, newPoke; i < Math.min((Battle.style === Battles.style.normal ? 1 : 2) / opposingTrainers.length, participant.healthyPokemon().length); ++ i) {
						newPoke = participant.healthyPokemon()[i];
						if (newPoke.trainer === TheWild)
							Battle.enter(newPoke, true);
						else Battle.queue.push({
							poke : newPoke,
							doesNotRequirePokemonToBeBattling : true,
							priority : (1 - (1 / (opposingTrainers.length + 3)) * (i + 1)) / 10,
							action : function (which) {return function () {
								Battle.enter(which, true);
							}; }(newPoke)});
					}
				}
			} else {
				participant.battler.reset();
				participant.battler.side = Battles.side.far;
				Battle.opponents.push(participant);
			}
		});
		if (!Battle.opposingTrainers.contains(TheWild))
			Battle.situation = Battles.situation.trainer;
		Display.state.load(Display.state.save());
		var names = [], number = 0;
		switch (Battle.situation) {
			case Battles.situation.wild:
				var wildPokemon = TheWild.healthyPokemon();
				if (wildPokemon.length === 1)
					Textbox.state("A wild " + wildPokemon[0].name() + " appeared!");
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
					names.push(trainer.name);
					++ number;
				});
				if (names.length === 1)
					Textbox.state(names[0] + " is challenging " + Battle.alliedTrainers[0].pronoun() + " to a battle. " + (Battle.opposingTrainers[0].gender === Genders.male ? "He" : "She") + " has " + numberword(Battle.opposingTrainers[0].pokemon()) + " Pokémon.");
				if (names.length > 1)
					Textbox.state(commaSeparatedList(names) + " are challenging " + Battle.alliedTrainers[0].pronoun() + " to a battle. They have " + number + " Pokémon between them.");
				break;
		}
		if (Battle.kind !== Battles.kind.recording) {
			Battle.recording = {
				seed : srandom.seed,
				style : Battle.style,
				weather : Battle.weather,
				teamA : Battle.alliedTrainers,
				teamB : Battle.opposingTrainers,
				actions : []
			};
		}
		Battle.race(Battle.queue);
		Battle.queue = [];
		Battle.startTurn();
	},
	finish : function () {
		Battle.finished = true;
	},
	end : function (forcefully) {
		if (Battle.active) {
			Battle.active = false;
			if (forcefully)
				Textbox.clear();
			Battle.redraw();
			Battle.situation = null;
			foreach(Battle.all(true), function (poke) {
				if (poke.status === Statuses.badlyPoisoned)
					poke.status = Statuses.poisoned;
				poke.battler.reset();
			});
			Battle.allies = [];
			Battle.opponents = [];
			foreach(Battle.allTrainers(), function (participant) {
				participant.battlers = [];
			});
			Battle.alliedTrainers = [];
			Battle.opposingTrainers = [];
			Battle.queue = [];
			Battle.escapeAttempts = 0;
			Battle.turns = 0;
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
				var chosenMove = currentBattler.usableMoves()[secondary];
				var who = null;
				if (typeof tertiary !== "undefined" && tertiary !== null)
					who = tertiary;
				else {
					var targets = [], targetNames = [], place, affected, partOfTarget, names, all = Battle.all(true);
					foreach(all, function (poke) {
						place = Battle.placeOfPokemon(poke);
						if (Battle.pokemonInRangeOfMove(currentBattler, poke, chosenMove.move)) {
							affected = chosenMove.move.affects;
							partOfTarget = [];
							if (affected.contains(Move.target.directTarget)) {
								partOfTarget.push(place);
							}
							foreach(Battle.alliesTo(currentBattler).filter(onlyPokemon), function (adjacent) {
								var index = all.indexOf(adjacent), distance = Math.floor(Battle.distanceBetween(currentBattler, adjacent));
								if (((affected.contains(Move.target.self) && distance === 0) || (affected.contains(Move.target.adjacentAlly) && distance === 1) || ((affected.contains(Move.target.farAlly) && distance === 2))))
									partOfTarget.push(index);
							});
							foreach(Battle.opponentsTo(currentBattler).filter(onlyPokemon), function (adjacent) {
								var index = all.indexOf(adjacent), distance = Math.floor(Battle.distanceBetween(currentBattler, adjacent));
								if (((affected.contains(Move.target.directOpponent) && distance === 0) || (affected.contains(Move.target.adjacentOpponent) && distance === 1) || ((affected.contains(Move.target.farOpponent) && distance === 2))))
									partOfTarget.push(index);
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
					if (Battle.style !== Battles.style.normal || targets.length > 1) {
						targets.reverse();
						targetNames.reverse();
						var displayAll = [].concat(Display.state.current.allies, Display.state.current.opponents), hotkeys = {};
						hotkeys[Game.key.secondary] = "Cancel";
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
					} else
						who = targets[0].target;
				}
				if (who !== null) {
					if (!currentBattler.battler.disobeying) {
						Battle.actions.push({
							poke : currentBattler,
							priority : chosenMove.move.priority,
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
						Textbox.state("You don't have any items.");
						reprompt = true;
					} else {
						var usableItems = character.bag.usableItems(), items = [], indices = [], hotkeys = {};
						hotkeys[Game.key.secondary] = "Cancel";
						foreach(usableItems, function (item) {
							if (item.item.direct) { // If the item can be used directly, instead of when being held
								items.push(item.item.fullname + " ×" + (item.quantity - item.intentToUse));
								indices.push(character.bag.indexOfItem(item.item));
							}
						});
						Textbox.ask("Which item do you want to use?", items, function (response, i, major) {
							if (response !== "Cancel")
								Battle.input("Bag", indices[i]);
							else
								Battle.prompt();
						}, ["Cancel"], null, hotkeys, "Item");
					}
				} else {
					if (arguments.length === 2) {
						var targets = character.bag.items[secondary].item.targets;
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
						hotkeys[Game.key.secondary] = "Cancel";
						foreach(targets, function (poke) {
							names.push(poke.name());
							positions.push(Battle.placeOfPokemon(poke));
						});
						Textbox.ask("On which Pokémon do you want to use the " + character.bag.items[secondary].item.fullname + "?", names, function (response, i) {
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
						});
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
					hotkeys[Game.key.secondary] = "Cancel";
					if (names.length) {
						Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
							if (response !== "Cancel")
								Battle.input("Pokémon", positions[i]);
							else
								Battle.prompt();
						}, ["Cancel"], null, hotkeys);
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
						Textbox.state(currentBattler.name + " is trapped and can't switch out!");
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
				if (Battle.escape())
					advance = false;
				break;
			case "Back":
				var previous = Battle.actions.pop();
				if (previous.hasOwnProperty("undo"))
					previous.undo();
				Battle.recording.actions[Battle.turns].pop();
				-- Battle.selection;
				advance = false;
				break;
		}
		if (Battle.kind !== Battles.kind.online || character === Game.player) {
			if (advance) {
				if (Battle.kind !== Battles.kind.recording) {
					Battle.recording.actions[Battle.turns].push({
						primary : primary,
						secondary : secondary,
						tertiary : tertiary
					});
				}
				Battle.advance();
			} else if (reprompt)
				Battle.prompt();
		}
	},
	advance : function () {
		if (++ Battle.selection === Game.player.battlers().length) {
			Battle.queue = Battle.queue.concat(Battle.actions);
			Battle.actions = [];
			var display = Display.state.save();
			Textbox.effect(function () { Display.state.load(display); });
			if (Battle.kind === Battles.kind.online) {
				Client.send({
					action : "actions",
					seed : srandom.seed,
					actions : Battle.recording.actions[Battle.turns]
				});
			}
			if (Battle.kind !== Battles.kind.online || Battle.communication.notEmpty())
				Battle.giveTrainersActions();
			else {
				Battle.stage = 2;
				Textbox.stateUntil("Waiting for the other player to make a decision...", function () { return Battle.stage !== 2; });
			}
		} else
			Battle.prompt();
	},
	giveTrainersActions : function () {
		foreach(Battle.allTrainers(), function (trainer) {
			if (trainer.isAnNPC())
				Battle.AI.action(trainer);
			else if (trainer.type === Characters.type.online) {
				for (var i = 0, action; i < trainer.battlers().length; ++ i) {
					action = Battle.communication.shift();
					Battle.input(action.primary, action.secondary, action.tertiary, trainer, i);
				}
			}
		});
		Battle.queue = Battle.queue.concat(Battle.actions);
		Battle.actions = [];
		Battle.stage = 1;
		Battle.processTurn();
	},
	receiveActions : function (actions) {
		// Receive the opponent's actions, in an online battle
		Battle.communication = actions;
		if (Battle.stage === 2)
			Battle.giveTrainersActions();
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
			case Battles.style.normal:
			case Battles.style.inverse:
			case Battles.style.sky:
				return 1;
			case Battles.style.double:
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
					var usableMoves = poke.usableMoves(), use = srandom.chooseFromArray(usableMoves), againstWhom;
					againstWhom = srandom.chooseFromArray(Battle.targetsForMove(poke, use.move, true));
					if (!Battle.pokemonForcedIntoAction(poke)) {
						Battle.queue.push({
							poke : poke,
							priority : use.move.priority,
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
	pokemonForcedIntoAction : function (poke) {
		// Check if this Pokémon is forced into making a certain move, because they need to recharge, etc.
		if (poke.battler.recharging) {
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
			Battle.queue.push({
				poke : poke,
				priority : poke.battler.previousMoves.last().move.priority,
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
		var moves = [];
		foreach(currentBattler.usableMoves(), function (move) {
			moves.push(move.move.name);
		});
		if (Battle.style !== Battles.style.normal) {
			currentBattler.battler.display.outlined = true;
			var display = Display.state.save();
			Textbox.effect(function () { Display.state.load(display); });
			currentBattler.battler.display.outlined = false;
		}
		if (Battle.kind !== Battles.kind.recording) {
			var actions = ["Pokémon", "Run", "Bag"], hotkeys = {};
			hotkeys[Game.key.secondary] = "Run";
			if (Battle.style === Battles.style.double && Battle.selection > 0)
				actions.insert(0, "Back");
			Textbox.ask("What do you want " + currentBattler.name() + " to do?", moves, function (response, i, major) {
				if (major) {
					Battle.input("Fight", i);
				} else
					Battle.input(response);
			}, actions, null, hotkeys, "Action: " + currentBattler.unique);
		} else {
			var action = Battle.recording.actions[Battle.turns][Battle.selection];
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
		Battle.race(Battle.queue);
		Battle.queue = [];
		Battle.endTurn();
		Battle.startTurn();
	},
	startTurn : function () {
		if (Battle.kind !== Battles.kind.recording) {
			Battle.recording.actions.push([]);
		}
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
					Battle.triggerEvent(Events.entrance, {}, poke);
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
				Textbox.state(capitalise(Battle.alliedTrainers[0].possessivePronoun()) + effect.type.name + " ran out.");
				deletion.push(i);
			}
		});
		foreach(Battle.effects.far, function (effect, i, deletion) {
			if (Battle.turns >= Math.floor(effect.expiration)) {
				Textbox.state(capitalise(Battle.opposingTrainers[0].possessivePronoun()) + effect.type.name + " ran out.");
				deletion.push(i);
			}
		});
		foreach(Battle.effects.specific, function (effect, i, deletion) {
			if (!effect.target.battler.battling) {
				deletion.push(i);
			} else if ((effect.repeating && effect.due === Battles.when.endOfTurn) || (!effect.repeating && Battle.turns >= Math.floor(effect.due))) {
				if (!effect.expired) {
					if (effect.hasOwnProperty("data"))
						effect.type(effect.target, effect.data);
					else
						effect.type(effect.target);
				}
				if (!effect.repeating)
					deletion.push(i);
			}
		});
		var all = Battle.all(true)
		foreach(all, function (poke) {
			if (!Battle.active || Battle.finished)
				return true;
			++ poke.battler.battlingForDuration;
			if (poke.status !== Statuses.frozen && poke.status !== Statuses.sleep && !poke.flinching && !poke.battler.recharging) {
				foreach(poke.moves, function (move) {
					if (move.disabled)
						-- move.disabled;
				});
			}
			switch (poke.status) {
				case Statuses.asleep:
					++ poke.sleep;
					break;
				case Statuses.burn:
					Textbox.state(poke.name() + " is hurt by " + poke.possessivePronoun() + " burn!");
					Battle.damage(poke, Move.percentageDamage(target, 1 / 8));
					break;
				case Statuses.poisoned:
					Textbox.state(poke.name() + " is hurt by the poison!");
					Battle.damage(poke, Move.percentageDamage(target, 1 / 8));
					break;
				case Statuses.badlyPoisoned:
					Textbox.state(poke.name() + " is hurt by the toxic poison!");
					Battle.damage(poke, Move.percentageDamage(target, poke.poison / 16));
					++ poke.poison;
					break;
			}
			if (poke.battler.recharging)
				++ poke.battler.recharging;
			if (poke.battler.protected)
				poke.battler.protected = false;
			if (poke.battler.nightmare) {
				if (poke.status === Statuses.asleep) {
					Textbox.state(poke.name() + " lost a quarter of " + poke.possessivePronoun() + " health to " + poke.possessivePronoun() + " nightmare!");
					Battle.damage(poke, Move.percentageDamage(target, 1 / 4));
				} else
					poke.battler.nightmare = false;
			}
			poke.battler.damaged[Move.category.physical] = 0;
			poke.battler.damaged[Move.category.special] = 0;
		});
		Battle.display.weather = true;
		var displayWeather = Display.state.save(), displayAfterWeather;
		Textbox.effect(function () { Display.state.load(displayWeather); });
		var all = Battle.all(true);
		switch (Battle.weather) {
			case Weathers.intenseSunlight:
				if (!Settings.visualWeather)
					Textbox.state("The sun is blazing fiercely in the sky!");
				break;
			case Weathers.rain:
				if (!Settings.visualWeather)
					Textbox.state("The rain is pouring down in torrents!");
				break;
			case Weathers.sandstorm:
				if (!Settings.visualWeather)
					Textbox.state("The sandstorm is raging all around!");
				
				foreach(all, function (poke) {
					if (!Battle.active || Battle.finished)
						return true;
					if (!poke.ofType(Types.steel, Types.rock, Types.ground)) {
						Textbox.state(poke.name() + " was damaged by the sandstorm!");
						Battle.damage(poke, {damage : Math.ceil(poke.stats[Stats.health]() / 16)});
					}
				});
				break;
			case Weathers.hail:
				if (!Settings.visualWeather)
					Textbox.state("The hail is falling heavily!");
				foreach(all, function (poke) {
					if (!Battle.active || Battle.finished)
						return true;
					if (!poke.ofType(Types.ice)) {
						Textbox.state(poke.name() + " was damaged by the hail!");
						Battle.damage(poke, {damage : Math.ceil(poke.stats[Stats.health]() / 16)});
					}
				});
				break;
		}
		Battle.display.weather = false;
		displayAfterWeather = Display.state.save();
		Textbox.effect(function () { Display.state.load(displayAfterWeather); });
		var emptyPlaces = [];
		foreach(Battle.opponents, function (poke, i) {
			if (poke === NoPokemon)
				emptyPlaces.push(i);
		});
		if (emptyPlaces.length) {
			foreach(Battle.opposingTrainers, function (trainer) {
				if (!emptyPlaces.length)
					return true;
				while (trainer.battlers().length < Math.min((Battle.style === Battles.style.normal ? 1 : 2) / Battle.opposingTrainers.length) && trainer.hasHealthyPokemon(true) && emptyPlaces.length) {
					var poke = trainer.healthyPokemon(true)[0];
					Battle.enter(poke, true, emptyPlaces.shift());
					if (trainer === TheWild) {
						var display = Display.state.save();
						Textbox.state("A wild " + poke.name() + " was right behind!", function () { Display.state.load(display); });
					}
				}
			});
		}
		Battle.fillEmptyPlaces();
		++ Battle.turns;
	},
	fillEmptyPlaces : function () {
		// Fills the player's empty places with Pokémon of their choosing
		var trainer = Game.player, empty = null, progress = false;
		foreach(Battle.allies, function (poke, i) {
			if (poke === NoPokemon) {
				empty = i;
				return true;
			}
		});
		if (empty !== null) {
			var names = [], positions = [];
			foreach(trainer.healthyPokemon(true), function (poke, i) {
				names.push(poke.name());
				positions.push(i);
			});
			if (names.length === 0)
				progress = true;
			else if (names.length === 1) {
				Battle.enter(trainer.healthyPokemon(true)[0], true, empty);
				progress = true;
			} else {
				Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
					Battle.enter(trainer.healthyPokemon(true)[i], true, empty);
					Battle.fillEmptyPlaces();
				});
			}
		} else
			progress = true;
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
		if (poke.substitute > 0 && !damage.infiltrates) {
			Textbox.state(poke.name() + "'s " + Moves.Substitute.name + " took the damage!");
			poke.substitute -= amount;
			if (poke.substitute <= 0) {
				Textbox.state(poke.name() + "'s " + Moves.Substitute.name + " broke!");
				poke.substitute = 0;
			}
			return;
		}
		var previousHealth = poke.health;
		poke.health = Math.max(0, poke.health - amount);
		if (typeof damage.category !== "undefined" && damage.category !== null)
			poke.battler.damaged[damage.category] += amount;
		var display = Display.state.save();
		Textbox.effect(function () { return Display.state.transition(display); });
		if (poke.health === 0) {
			poke.battler.display.transition = 0;
			poke.battler.display.height = 0;
			var displayFaint = Display.state.save();
			Textbox.state(poke.name() + " fainted!", function () { return Display.state.transition(displayFaint); });
			if (poke.friendship > 0)
				-- poke.friendship;
			Battle.removeFromBattle(poke);
		} else {
			Battle.triggerEvent(Events.health, {
				change : -amount
			}, damage.cause, poke);
		}
	},
	heal : function (poke, amount, cause) {
		if (amount < 0)
			return;
		amount = Math.ceil(amount);
		if (Battle.triggerEvent(Events.health, {
			change : amount
		}, cause, poke).contains(true))
			return;
		poke.health = Math.min(poke.stats[Stats.health](), poke.health + amount);
		var message = "Some of " + poke.name() + "'s health was restored.";
		if (poke.battler.battling) {
			var display = Display.state.save();
			Textbox.state(message, function () { return Display.state.transition(display); });
		} else
			Textbox.state(message);
	},
	healPercentage : function (poke, percentage, cause) {
		Battle.heal(poke, poke.stats[Stats.health]() * percentage, cause);
	},
	escapeAttempts : 0,
	escape : function () {
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
				if (poke.stats[Stats.speed](true) > maxSpeed)
					maxSpeed = poke.stats[Stats.speed](true);
			});
			var escapeChance = (currentBattler.stats[Stats.speed](true) * 32) / ((maxSpeed / 4) % 256) + 30 * (Battle.escapeAttempts ++);
			if (escapeChance > 255 || randomInt(255) < escapeChance) {
				Battle.queue.push({priority : 6, action : function () {
					Textbox.state(capitalise(Battle.alliedTrainers[0].pronoun()) + " escaped successfully!", function () { Battle.end(); }); Battle.finish(); }
				});
			} else
				Battle.queue.push({priority : 6, action : function () {
					Textbox.state(capitalise(Battle.alliedTrainers[0].pronoun()) + "couldn't get away!");
				}});
		}
	},
	attemptCapture : function (poke, ball, trainer) {
		if (arguments.length < 3)
			trainer = Game.player;
		var modifiers = {
			status : 1,
			species : !poke.battler.transform.transformed ? poke.species.catchRate : poke.battler.transform.species.catchRate,
			ball : (typeof ball.catchRate === "number" ? ball.catchRate : ball.catchRate())
		};
		switch (poke.status) {
			case Statuses.asleep:
			case Statuses.frozen:
				modifiers.status = 2.5;
				break;
			case Statuses.paralysed:
			case Statuses.poisoned:
			case Statuses.badlyPoisoned:
			case Statuses.burned:
				modifiers.status = 1.5;
				break;
		}
		var modifiedCatchRate = (((3 * poke.maximumHealth() - 2 * poke.health) * modifiers.species * modifiers.ball) / (3 * poke.maximumHealth())) * modifiers.status, shakeProbability = 65536 / Math.pow(255 / modifiedCatchRate, 1 / 4), caught = true;
		var criticalCaptureChance = modifiedCatchRate, criticalCapture = false;
		if (Pokedex.caught.length > 600)
			criticalCaptureChance *= 2.5;
		else if (Pokedex.caught.length > 450)
			criticalCaptureChance *= 2;
		else if (Pokedex.caught.length > 300)
			criticalCaptureChance *= 1.5;
		else if (Pokedex.caught.length > 150)
			criticalCaptureChance *= 1;
		else if (Pokedex.caught.length > 30)
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
			Battle.removeFromBattle(poke);
			poke.pokeball = ball;
			trainer.give(poke);
		}
		return caught;
	},
	removeFromBattle : function (poke) {
		// Stops a Pokémon battling, either because they've fainted, or because they've been caught in a Poké ball
		if (Battle.kind !== Battles.kind.online) {
			foreach(poke.battler.opponents, function (gainer) {
				if (!gainer.fainted())
					gainer.gainExperience(poke, poke.battler.opponents.length);
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
		if (!poke.trainer.hasHealthyPokemon(true, poke) && !poke.trainer.hasHealthyPokemon(false, poke)) {
			var defeatedMessage = capitalise(Battle.alliedTrainers[0].pronoun()) + " " + (poke.trainer === Game.player ? "have" : "has") + " ";
			if (poke.trainer === Game.player)
				defeatedMessage += "been defeated!";
			else if (Battle.situation === Battles.situation.trainer)
				defeatedMessage += "defeated " + poke.trainer.name + "!";
			else
				defeatedMessage += "defeated the wild Pokémon!";
			Textbox.state(defeatedMessage, function () {
				Battle.end();
			});
			Battle.finish();
			return;
		}
	},
	swap : function (out, replacement, forced) {
		Battle.enter(replacement, false, Battle.withdraw(out, forced));
	},
	enter : function (poke, startOrEndOfTurn, place) {
		poke.battler.reset();
		poke.battler.battling = true;
		var ally = Battle.alliedTrainers.contains(poke.trainer);
		poke.battler.side = (ally ? Battles.side.near : Battles.side.far);
		if (arguments.length < 3) {
			if (ally)
				Battle.allies.push(poke);
			else
				Battle.opponents.push(poke);
		} else {
			if (ally)
				Battle.allies[place] = poke;
			else
				Battle.opponents[place] = poke;
		}
		if (poke.trainer !== TheWild) {
			poke.battler.display.transition = 0;
			var displayInitial = Display.state.save();
			poke.battler.display.transition = 1;
			var display = Display.state.save();
			Textbox.state(capitalise(poke.trainer.pronoun()) + " sent out " + poke.name() + "!", function () { Display.state.load(displayInitial); return Display.state.transition(display); });
		}
		foreach(Battle.opponentsTo(poke), function (opponent) {
			poke.battler.opponents.pushIfNotAlreadyContained(opponent);
			opponent.battler.opponents.pushIfNotAlreadyContained(poke);
		});
		foreach((poke.battler.side === Battles.side.near ? Battle.hazards.near : Battle.hazards.far), function (hazard) {
			hazard.type.effect.hazard(poke, hazard.stack);
		});
		if (!startOrEndOfTurn)
			Battle.triggerEvent(Events.entrance, {}, poke);
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
					return (Math.floor(b.poke.stats[Stats.speed](true) * (b.poke.status === Statuses.paralysed ? 0.25 : 1)) + b.poke.battler.speed) - (Math.floor(a.poke.stats[Stats.speed](true) * (a.poke.status === Statuses.paralysed ? 0.25 : 1)) + a.poke.battler.speed);
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
				if (effect.type.effects.event === event)
					if (!effect.type.effects.hasOwnProperty("oneself") || effect.type.effects.oneself === data.oneself)
						responses.push(effect.type.effects.action(data, poke));
			});
		});
		return responses;
	},
	stat : function (poke, stat, change, cause) {
		// A change of zero will reset the stat
		if (poke.substitute > 0 && cause !== poke) {
			Textbox.state(poke.name() + "'s " + Moves.Substitute.name + " isn't affected by the stat change.");
			return;
		}
		if (Battle.triggerEvent(Events.stat, {
			stat : stat,
			change : change
		}, cause, poke).contains(true))
			return true;
		if (change !== 0) {
			if (Math.abs(poke.battler.statLevel[stat]) === 6 && Math.sign(change) === Math.sign(poke.battler.statLevel[stat])) {
				Textbox.state(poke.name() + "'s " + Stats.string(stat) + " can't go any " + (change > 0 ? "higher" : "lower") + "!");
				return;
			}
			poke.battler.statLevel[stat] += change;
			poke.battler.statLevel[stat] = Math.clamp(-6, poke.battler.statLevel[stat], 6);
			Textbox.state(poke.name() + "'s " + Stats.string(stat) + " was " + (Math.abs(change) > 1 ? "sharply " : "") + (change > 0 ? "raised" : "lowered") + ".");
		} else {
			poke.battler.statLevel[stat] = 0;
			Textbox.state(poke.name() + "'s " + Stats.string(stat) + " was reset.");
		}
	},
	teammates : function (pokeA, pokeB) {
		return Battle.alliesTo(pokeA) === Battle.alliesTo(pokeB);
	},
	flinch : function (poke) {
		if (!poke.flinching && poke.substitute === 0) {
			poke.flinching = true;
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
	placeHazard : function (hazard, maximum, side) {
		var hazardSide = (side === Battles.side.near ? Battle.hazards.near : Battle.hazards.far);
		if (!foreach(hazardSide, function (which) {
			if (which.type === hazard) {
				++ which.stack;
				which.stack = Math.min(which.stack, maximum);
				return true;
			}
		}))
			hazardSide.push({type : hazard, stack : 1});
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
			Battle.effects.specific.push({type : move.effect.effect, due : Battle.turns + when, target : target, data : data, expired : false, repeating : repeating});
		else
			Battle.effects.specific.push({type : move.effect.effect, due : Battle.turns + when, target : target, expired : false, repeating : repeating});
	},
	moveHaveRepeatingEffect : function (move, when, target, data) {
		Battle.moveHaveEffect(move, when, target, data, true);
	},
	moveHasEffect : function (move, target) {
		return Battle.hasEffect(move.effect.effect, target);
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
		poke.status = status;
		Battle.recoverFromStatus(poke);
	},
	recoverFromStatus : function (poke) {
		if (poke.status === Statuses.asleep) {
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " woke up!");
				target.status = Statuses.none;
			}, srandom.int(1, 5), poke);
		}
		if (poke.status === Statuses.frozen) {
			Battle.haveEffect(function (target) {
				Textbox.state(target.name() + " thawed!");
				target.status = Statuses.none;
			}, srandom.int(1, 5), poke);
		}
	}
};