Move = {
	category : {
		physical : q = 0,
		special : ++ q,
		status : ++ q,
		none : ++ q
	},
	target : {
		self : q = 0,
		directOpponent : ++ q,
		directTarget : ++ q,
		adjacentAlly : ++ q,
		adjacentOpponent : ++ q,
		farAlly : ++ q,
		farOpponent : ++ q
	},
	targets : {
		// Filled right after Move object declaration
	},
	action : {
		damage : q = 0,
		inflict : ++ q,
		status : ++ q,
		recoil : ++ q,
		weather : ++ q,
		trap : ++ q,
		fn : ++ q,
		message : ++ q
	},
	amount : {
		standard : q = 0,
		fixed : ++ q,
		percentage : ++ q,
		OHKO : ++ q
	},
	context : {
		user : {
			health : q = 0
		},
		target : {
		},
		move : {
			damage : q = 0
		}
	},
	Struggle : {
		number : -1,
		PP : Infinity,
		PPups : 0
	},
	use : function (move, stage, mover, target) {
		moveName = move;
		move = _(Moves, move);
		if (target instanceof pokemon)
			target = Battle.placeOfPokemon(target);
		var constant = {},
			targetPokemon = (target !== NoPokemon ? Battle.pokemonInPlace(target) : NoPokemon),
			affected = (targetPokemon !== NoPokemon ? Battle.affectedByMove(mover, targetPokemon, move).filter(onlyPokemon) : []),
			completelyFailed = true,
			statedFailureReason = false,
			finalStage = (stage === move.effect.use.length - 1),
			animationEffect = null,
			stateEffect = null;
		// If the move won't hit anything, try aiming for a different target
		if (stage === 0 && affected.empty()) {
			var newTarget = Battle.targetsForMove(mover, move, true);
			if (newTarget.notEmpty()) {
				target = newTarget[0].place;
				targetPokemon = newTarget[0].poke;
				affected = Battle.affectedByMove(mover, targetPokemon, move).filter(onlyPokemon);
			}
		}
		if (finalStage && moveName[0] !== "_") {
			if (affected.notEmpty())
				animationEffect = Textbox.state(mover.name() + " used " + moveName + (move.affects === Move.targets.directTarget && affected.notEmpty() ? " on " + (targetPokemon !== mover ? targetPokemon.name() : mover.selfPronoun()) : "") + "!", function () { return Move.animate(mover, move, stage, targetPokemon, constant); });
			else
				Textbox.state(mover.name() + " tried to use " + moveName + "...");
		} else
			animationEffect = Textbox.effect(function () { return Move.animate(mover, move, stage, targetPokemon, constant); });
		// Makes sure any Display states after the move has been used takes into consideration any movements by any of the Pokémon
		if (targetPokemon !== NoPokemon) {
			Move.renderAnimation(mover, move, stage, targetPokemon, constant);
			var displayRendered = Display.state.save();
			stateEffect = Textbox.effect(function () { Display.state.load(displayRendered); });
		}
		if (move.effect.hasOwnProperty("constant") && targetPokemon !== NoPokemon)
			constant = move.effect.constant(mover, targetPokemon);
		if (typeof constant === "undefined" || !constant.hasOwnProperty("failed") || !constant.failed) {
			if (affected.notEmpty()) {
				foreach(affected, function (targeted) {
					var failed = false, accuracy, evasion;
					if (Battle.triggerEvent(Events.move, {
						move : move,
						affected : true
					}, mover, targeted).contains(true)) {
						failed = true;
						statedFailureReason = true;
					} else {
						if (!move.classification.contains("_")) {
							accuracy = (mover.battler.statLevel[Stats.accuracy] === 0 ? 1 : mover.battler.statLevel[Stats.accuracy] > 0 ? 1 + (1 / 3) * mover.battler.statLevel[Stats.accuracy] : 3 / (Math.abs(mover.battler.statLevel[Stats.accuracy]) + 3));
							evasion = (targeted.battler.statLevel[Stats.evasion] === 0 ? 1 : targeted.battler.statLevel[Stats.evasion] > 0 ? 1 + (1 / 3) * targeted.battler.statLevel[Stats.evasion] : 3 / (Math.abs(targeted.battler.statLevel[Stats.evasion]) + 3));
						} else {
							accuracy = 1;
							evasion = 1;
						}
						var hit = (!finalStage || (move.hasOwnProperty("accuracy") ? move.accuracy * (accuracy / evasion) >= srandom.point() : true));
						if (hit) {
							if (targeted.battler.protected && !move.piercing) {
								Textbox.state(targeted.name() + " protected " + targeted.selfPronoun() + ".");
								failed = true;
								statedFailureReason = true;
							} else if (targeted.invulnerable && !move.despite.contains(targeted.invulnerable)) { // Dig, Fly, etc.
								Textbox.state(targeted.name() + " cannot be found!");
								failed = true;
								statedFailureReason = true;
							} else {
								var response = move.effect.use[stage](mover, targeted, constant);
								if (response && response.hasOwnProperty("failed") && response.failed)
									failed = true;
							}
						} else {
							if (accuracy <= evasion)
								Textbox.state(mover.name() + " missed " + targeted.name() + "!");
							else
								Textbox.state(targeted.name() + " evaded the attack!");
							failed = true;
							statedFailureReason = true;
							if (move.effect.hasOwnProperty("miss"))
								move.effect.miss(mover, targeted);
						}
					}
					if (failed) {
						if (move.effect.hasOwnProperty("fail"))
							move.effect.fail(mover, targeted);
						return false;
					} else
						completelyFailed = false;
				});
			} else {
				Textbox.state("There was no target for " + mover.name() + " to hit...");
			}
		}
		if (completelyFailed) {
			if (!statedFailureReason)
				Textbox.state("But it failed!");
			if (animationEffect !== null)
				Textbox.removeEffects(animationEffect);
			if (stateEffect !== null) {
				battler.resetDisplay(mover);
				foreach(affected, function (targeted) {
					battler.resetDisplay(targeted);
				});
				displayRendered = Display.state.save();
				stateEffect.trigger = function () { Display.state.load(displayRendered); };
			}
		}
		return !completelyFailed;
	},
	renderAnimation : function (mover, move, stage, target, constant, track, last) {
		if (move.animation.length - 1 < stage || move.animation[stage].length === 0)
			return;
		var events = move.animation[stage].deepCopy(), from = Display.state.save();
		foreach(events.sort(function (a, b) {
			if (a.hasOwnProperty("time"))
				aLast = a.time;
			else
				aLast = a.to;
			if (b.hasOwnProperty("time"))
				bLast = b.time;
			else
				bLast = b.to;
			return aLast - bLast;
		}), function (event) {
			if (event.hasOwnProperty("time")) {
				event.animation({
					display : mover.battler.display
				}, {
					display : target.battler.display
				}, constant);
			} else {
				event.transition({
					display : mover.battler.display,
					from : Display.pokemonInState(mover, from).battler.display
				}, {
					display : target.battler.display,
					from : Display.pokemonInState(target, from).battler.display
				}, 1, constant);
			}
		});
		View.reset();
	},
	animate : function (mover, move, stage, target, constant, track, last) {
		if (arguments.length < 6) {
			track = {
				completed : false,
				progress : 0
			};
			if (!_(Settings.client, "animated moves") || move.animation.length - 1 < stage || move.animation[stage].length === 0) {
				track.completed = true;
				return track;
			}
			last = 0; // The shortest length an animation can be (100 = 1 second)
		}
		var start = move.animation[stage][track.progress].hasOwnProperty("time") ? move.animation[stage][track.progress].time : move.animation[stage][track.progress].from;
		if (arguments.length < 6 && start > 0) {
			setTimeout(function () { Move.animate(mover, move, stage, target, constant, track, last); }, Time.second * start / 100);
			return track;
		}
		if (move.animation[stage][track.progress].hasOwnProperty("time")) {
			last = Math.max(move.animation[stage][track.progress].time, last);
			move.animation[stage][track.progress].animation({
				display : Display.pokemonInState(mover).battler.display
			}, {
				display : Display.pokemonInState(target).battler.display
			}, constant);
		} else {
			last = Math.max(move.animation[stage][track.progress].to, last);
			Move.transition(mover, move, stage, target, constant, track.progress, 0, Display.state.save(Display.state.current));
		}
		++ track.progress;
		var completed = (track.progress === move.animation[stage].length);
		if (completed) {
			setTimeout(function () { View.reset(); track.completed = true; }, Time.second * ((last - start) / 100));
		}
		else {
			var startOfNext = move.animation[stage][track.progress].hasOwnProperty("time") ? move.animation[stage][track.progress].time : move.animation[stage][track.progress].from;
			setTimeout(function () { Move.animate(mover, move, stage, target, constant, track, last); }, Time.second * (startOfNext - start) / 100);
		}
		return track;
	},
	transition : function (mover, move, stage, target, constant, start, progress, from) {
		var duration = (move.animation[stage][start].to - move.animation[stage][start].from) / 100, frames = duration * Time.framerate;
		move.animation[stage][start].transition({
			display : Display.pokemonInState(mover).battler.display,
			from : Display.pokemonInState(mover, from).battler.display
		}, {
			display : Display.pokemonInState(target).battler.display,
			from : Display.pokemonInState(target, from).battler.display
		}, Math.min(1, progress), constant);
		if (progress < 1)
			setTimeout(function () { Move.transition(mover, move, stage, target, constant, start, progress + 1 / frames, from); }, Time.refresh)
		else {
			View.reset();
		}
	},
	damage : function (attacker, target, move, power, type, noCritical) {
		move = _(Moves, move);
		var weather = Battle.weather, multiTarget = (Battle.style === Battles.style.double);
		power = power || move.power;
		if (arguments.length < 5)
			type = move.type;
		var modifiers = {
			critical : (srandom.chance(attacker.battler.statLevel[Stats.critical] <= 0 ? 16 : attacker.battler.statLevel[Stats.critical] === 1 ? 8 : attacker.battler.statLevel[Stats.critical] === 2 ? 2 : 1) ? 1.5 : 1),
			multiTarget : (multiTarget ? 0.75 : 1),
			weather : ((Battle.weather === Weathers.intenseSunlight && type === Types.fire) || (Battle.weather === Weathers.rain && type === Types.water) ? 1.5 : (Battle.weather === Weathers.intenseSunlight && type === Types.water) || (Battle.weather === Weathers.rain && type === Types.fire) ? 0.5 : 1),
			sandstorm : (Battle.weather === Weathers.sandstorm && target.ofType(Types.rock) ? 1.5 : 1),
			STAB : (attacker.ofType(type) ? 1.5 : 1),
			burn : (type === Move.category.physical && attacker.status === Statuses.burned ? 0.5 : 1)
		};
		if (noCritical)
			modifiers.critical = 1;
		var min = (target.effectiveness(type) > 0 ? 1 : 0);
		return {
			damage : Math.max(1, Math.floor(Math.floor(Math.floor((Math.floor((2 * attacker.level * modifiers.critical) / 5 + 2) * power * (move.category === Move.category.physical ? attacker.stats[Stats.attack](true) : attacker.stats[Stats.specialAttack](true))) / (move.category === Move.category.physical ? target.stats[Stats.defence](true) : target.stats[Stats.specialDefence](true) * modifiers.sandstorm)) / 50 + 2) * modifiers.STAB * modifiers.weather * modifiers.multiTarget * modifiers.burn * target.effectiveness(type) * (Math.floor(srandom.number(85, 100)) / 100))),
			effectiveness : target.effectiveness(type, attacker),
			critical : (modifiers.critical > 1),
			category : move.category,
			infiltrates : move.infiltrates || move.classification.contains("Sound"),
			cause : attacker,
			targets : move.targets
		};
	},
	exactDamage : function (attacker, target, move, damage, type) {
		if (arguments.length === 1)
			return {
				damage : arguments[0],
				effectiveness : 1,
				critical : false,
				category : Move.category.none,
				infiltrates : true,
				cause : NoPokemon,
				targets : Move.target.none
			};
		move = _(Moves, move);
		if (arguments.length < 5)
			type = move.type;
		return {
			damage : damage,
			effectiveness : (target.effectiveness(type) !== 0 ? 1 : 0),
			critical : false,
			category : move.category,
			infiltrates : move.infiltrates || move.classification.contains("Sound"),
			cause : attacker,
			targets : move.targets
		};
	},
	percentageDamage : function (poke, fraction) {
		return Move.exactDamage(Math.max(1, poke.stats[Stats.health]() * fraction));
	},
	effectiveness : function (attacking, defending) {
		if (Type.effectiveness[attacking].hasOwnProperty("strong") && Type.effectiveness[attacking].strong.contains(defending))
			return 2;
		if (Type.effectiveness[attacking].hasOwnProperty("weak") && Type.effectiveness[attacking].weak.contains(defending))
			return 0.5;
		if (Type.effectiveness[attacking].hasOwnProperty("ineffective") && Type.effectiveness[attacking].ineffective.contains(defending))
			return 0;
		return 1;
	}
};
Move.targets = {
	// A preset list of all the common combinations of targets moves may use
	everyone : [Move.target.self, Move.target.directOpponent, Move.target.adjacentAlly, Move.target.adjacentOpponent, Move.target.farAlly, Move.target.farOpponent],
	allButUser : [Move.target.directOpponent, Move.target.adjacentAlly, Move.target.adjacentOpponent, Move.target.farAlly, Move.target.farOpponent],
	directOpponent : [Move.target.directOpponent],
	adjacentToUser : [Move.target.directOpponent, Move.target.adjacentAlly, Move.target.adjacentOpponent],
	opponents : [Move.target.directOpponent, Move.target.adjacentOpponent, Move.target.farOpponent],
	allies : [Move.target.self, Move.target.adjacentAlly, Move.target.farAlly],
	self : [Move.target.self],
	directTarget : [Move.target.directTarget],
	opponentAndAdjacent : [Move.target.directOpponent, Move.target.adjacentOpponent],
	selfAndAdjacent : [Move.target.self, Move.target.adjacentAlly],
	selfAndTarget : [Move.target.self, Move.target.directTarget],
	noone : [],
	closeBy : [Move.target.self, Move.target.directOpponent, Move.target.adjacentAlly, Move.target.adjacentOpponent],

	 // Special constants
	party : [],
	opposingSide : [],
	alliedSide : []
};