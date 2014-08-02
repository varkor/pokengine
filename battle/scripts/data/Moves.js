Moves = {
	_Confused : {
		type : Types.typeless,
		category : Move.category.physical,
		classification : ["_", "special"],
		power : 40,
		contact : true,
		affects : Move.targets.self,
		targets : Move.targets.self,
		effect : {
			use : [
				function (self) {
					Battle.damage(self, Move.damage(self, self, Moves._Confused));
				}
			]
		}
	},
	Struggle : {
		name : "Struggle",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.physical,
		classification : ["_", "special"],
		PP : 1,
		power : 50,
		contact : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Struggle), null, Types.typeless);
					self.recoil(Moves.Struggle, self.stats[Stats.health]() / 4);
				}
			]
		}
	},
	Tackle : {
		name : "Tackle",
		status : Development.incomplete,
		description : "A physical attack in which the user charges and slams into the target with its whole body.",
		type : Types.normal,
		category : Move.category.physical,
		PP : 35,
		power : 50,
		accuracy : 1,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Tackle));
				}
			]
		},
		animation : [[
			/*{
				from : 0,
				to : 30,
				transition : function (self, target, progress) {
					// self {display, from}
					self.display.position.x = self.from.position.x + (-20 - self.from.position.x) * progress;
				}
			},
			{
				from : 40,
				to : 50,
				transition : function (self, target, progress) {
					self.display.position.x = self.from.position.x + (50 - self.from.position.x) * progress;
				}
			},
			{
				from : 45,
				to : 55,
				transition : function (self, target, progress) {
					target.display.position.x = target.from.position.x + (-50 - target.from.position.x) * progress;
				}
			},
			{
				from : 60,
				to : 90,
				transition : function (self, target, progress) {
					self.display.position.x = self.from.position.x + (0 - self.from.position.x) * progress;
				}
			},
			{
				from : 100,
				to : 150,
				transition : function (self, target, progress) {
					target.display.position.x = target.from.position.x + (0 - target.from.position.x) * progress;
				}
			}*/
			/*{
				time: 40,
				animation : function (self, target) {
					self.display.position.x = 50;
				}
			},
			{
				time: 100,
				animation : function (self, target) {
					self.display.position.x = 0;
				}
			}*/
			{
				start : 0,
				duration : 30,
				transition : function (self, target, progress) {
					self.display.position.x = self.from.position.x + (-20 - self.from.position.x) * progress;
					self.display.angle = self.from.angle + (-0.3 - self.from.angle) * progress;
				}
			},
			{
				delay : 10,
				duration : 10,
				transition : function (self, target, progress) {
					self.display.position.x = self.from.position.x + (140 - self.from.position.x) * progress;
					self.display.position.z = self.from.position.z + (95 - self.from.position.z) * progress;
					self.display.angle = self.from.angle + (0.5 - self.from.angle) * progress;
				}
			},
			{
				delay : -5,
				duration : 10,
				transition : function (self, target, progress) {
					target.display.position.x = target.from.position.x + (-50 - target.from.position.x) * progress;
					target.display.position.z = target.from.position.z + (-20 - target.from.position.z) * progress;
					target.display.angle = target.from.angle + (-0.2 - target.from.angle) * progress;
				}
			},
			{
				delay : 5,
				duration : 30,
				transition : function (self, target, progress) {
					self.display.position.x = self.from.position.x + (0 - self.from.position.x) * progress;
					self.display.position.z = self.from.position.z + (0 - self.from.position.z) * progress;
					self.display.angle = self.from.angle + (0 - self.from.angle) * progress;
				}
			},
			{
				delay : 10,
				duration : 50,
				transition : function (self, target, progress) {
					target.display.position.x = target.from.position.x + (0 - target.from.position.x) * progress;
					target.display.position.z = target.from.position.z + (0 - target.from.position.z) * progress;
					target.display.angle = target.from.angle + (0 - target.from.angle) * progress;
				}
			}
		]]
	},
	Roar : {
		name : "Roar",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["Sound"],
		PP : 20,
		priority : -6,
		contact: false,
		piercing : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (!target.trapped || target.ofType(Types.Ghost)) {
						if (Battle.situation === Battles.situation.wild) {
							Textbox.state(self.name() + " blew " + target.name() + " away!", function () { Battle.end(); });
							Battle.finish();
						} else {
							var others = target.trainer.healthyPokemon();
							if (others.length > 1) {
								foreach(others, function (poke, i, deletion) {
									if (poke === target)
										deletion.push(i);
								});
								Battle.swap(target, others[srandom.int(0, others.length - 1)], true);
							} else
								return {
									failed : true
								};
						}
					} else
						Textbox.state(target.name() + " is trapped in place and can't be blown away!");
				}
			]
		}
	},
	Wrap : {
		name : "Wrap",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.physical,
		PP : 20,
		power : 15,
		accuracy : 0.9,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Wrap));
					Textbox.state(target.name() + " was wrapped by " + self.name() + "!");
					target.trapped = true;
					if (!Battle.moveHasEffect(Moves.Wrap, target)) {
						var turns = srandom.int(2, 5);
						for (var i = 0; i < turns; ++ i)
							Battle.moveHaveEffect(Moves.Wrap, i + 0.5, target, {freed : false});
						Battle.moveHaveEffect(Moves.Wrap, turns + 0.5, target, {freed : true});
					}
				}
			],
			effect : function (target, data) {
				if (!data.freed) {
					Textbox.state(target.name() + " is hurt by " + target.possessivePronoun() + " " + Moves.Wrap.name + ".");
					Battle.damage(target, Move.percentageDamage(target, 1 / 16));
				} else {
					Textbox.state(target.name() + " was freed from " + target.possessivePronoun() + " " + Moves.Wrap.name + ".");
					target.trapped = false;
				}
			}
		},
	},
	Disable : {
		name : "Disable",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		PP : 20,
		accuracy : 1,
		contact: false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					var possibilities = [];
					foreach(target.moves, function (move, i) {
						if (move.PP > 0 && !move.disabled)
							possibilities.push(i);
					});
					if (possibilities.length === 0) {
						return {
							failed : true
						};
					} else {
						var which = possibilities[srandom.int(0, possibilities.length - 1)];
						Textbox.state(self.name() + " disabled " + target.name() + "'s " + target.moves[which].move.name + ".");
						target.moves[which].disabled = 4;
					}
				}
			]
		}
	},
	Counter : {
		name : "Counter",
		status : Development.incomplete,
		description : "",
		type : Types.fighting,
		category : Move.category.physical,
		PP : 20,
		accuracy : 1,
		priority : -5,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (self.battler.damaged[Move.category.physical] === 0)
						return {
							failed : true
						};
					else
						Battle.damage(target, Move.exactDamage(self, target, Moves.Counter, self.battler.damaged[Move.category.physical] * 2));
				}
			]
		}
	},
	Feint : {
		name : "Feint",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.physical,
		PP : 10,
		power : 30,
		accuracy : 1,
		priority : 2,
		contact: false,
		piercing : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Feint));
					target.battler.protected = false;
				}
			]
		}
	},
	Pursuit : {
		name : "Pursuit",
		status : Development.incomplete,
		description : "",
		type : Types.dark,
		category : Move.category.physical,
		PP : 20,
		power : 40,
		accuracy : 1,
		priority : 7,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					var damage = (target.switching ? Move.damage(self, target, Moves.Pursuit, 80) : Move.damage(self, target, Moves.Pursuit));
					Battle.damage(target, damage);
				}
			]
		}
	},
	Magnitude : {
		name : "Magnitude",
		status : Development.incomplete,
		description : "",
		type : Types.ground,
		category : Move.category.physical,
		PP : 30,
		accuracy : 1,
		contact: false,
		despite : ["Dig"],
		affects : Move.targets.adjacentToUser,
		effect : {
			constant : function () {
				var constant = {
					magnitude : srandom.chooseWeighted({value : 4, probability: 0.05}, {value : 5, probability: 0.1}, {value : 6, probability: 0.2}, {value : 7, probability: 0.3}, {value : 8, probability: 0.2}, {value : 9, probability: 0.1}, {value : 10, probability: 0.05})
				};
				Textbox.state("It's Magnitude " + constant.magnitude + "!");
				return constant;
			},
			use : [
				function (self, target, constant) {
					Battle.damage(target, Move.damage(self, target, Moves.Magnitude, ((constant.magnitude !== 10 ? (constant.magnitude - 3) * 20 - 10 : 150)) * (target.invulnerable === Moves.Dig ? 2 : 1)));
				}
			]
		},
		animation : [[
			{
				start : 0,
				duration : 100,
				transition : function (self, target, progress, constant) {
					View.position.x = random(-constant.magnitude, constant.magnitude);
					View.position.y = random(-constant.magnitude, constant.magnitude);
				}
			}
		]]
	},
	Synthesis : {
		name : "Synthesis",
		status : Development.incomplete,
		description : "",
		type : Types.grass,
		category : Move.category.status,
		snatchable : true,
		PP : 5,
		contact: false,
		affects : Move.targets.self,
		effect : {
			use : [
				function (self) {
					Battle.healPercentage(self, (Battle.weather === Weathers.clear ? 0.5 : Battle.weather === Weathers.intenseSunlight ? 2 / 3 : 0.25), self);
				}
			]
		}
	},
	Protect : {
		name : "Protect",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		PP : 10,
		contact: false,
		priority : 4,
		affects : Move.targets.self,
		targets : Move.targets.self,
		effect : {
			use : [
				function (self) {
					var sequence = 1;
					for (var i = self.battler.previousMoves.length - 1; i >= 0; -- i) {
						if (!self.battler.previousMoves[i].failed && self.battler.previousMoves[i].move === Moves.Protect)
							++ sequence;
						else
							break;
					}
					if (chance(sequence))
						self.battler.protected = true;
					else
						return {
							failed : true
						};
				}
			]
		}
	},
	Substitute : {
		name : "Substitute",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		PP : 10,
		contact: false,
		affects : Move.targets.self,
		targets : Move.targets.self,
		effect : {
			use : [
				function (self) {
					var sacrificed = Math.floor(self.stats[Stats.health]() / 4);
					if (self.health <= sacrificed) {
						return {
							failed : true
						};
					}
					Textbox.state(self.name() + " created a " + Moves.Substitute.name + ".");
					Battle.damage(self, Move.exactDamage(self, self, Moves.Substitute, sacrificed));
					self.substitute = sacrificed;
				}
			]
		}
	},
	Transform : {
		name : "Transform",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["special"],
		PP : 10,
		contact: false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (target.battler.substitute > 0 || target.battler.transform.transformed) {
						return {
							failed : true
						};
					}
					self.battler.transform = {
						transformed : true,
						species : self.species,
						IVs : self.IVs,
						moves : self.moves,
						shiny : self.shiny,
						ability : self.ability,
						form : self.form,
						gender : self.gender
					};
					self.species = target.species;
					self.IVs = target.IVs.clone();
					self.gender = target.gender;
					self.battler.statLevel = target.battler.statLevel.clone();
					self.moves = target.moves.deepCopy();
					foreach(self.moves, function (move) {
						move.PP = 5;
						move.maximumPP = 5;
					});
					self.shiny = target.shiny;
					self.ability = target.ability;
					self.form = target.form;
					var display = Display.state.save();
					Textbox.state(self.name() + " transformed itself into " + target.species.name + ".", /*transform animation, has finishing transforming, */function () { Display.state.load(display); });
				}
			]
		}
	},
	Sketch : {
		name : "Sketch",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["special"],
		PP : 1,
		contact: false,
		piercing : true,
		infiltrating : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (self.battler.transform.transformed || target.battler.previousMoves.notEmpty() || target.battler.previousMoves.last().failed)
						return {
							failed : true
						};
					else {
						self.forget(self.battler.previousMoves.last().move);
						if (!self.learn(target.battler.previousMoves.last().move)) {
							self.learn(Moves.Sketch);
							return {
								failed : true
							};
						}
					}
				}
			]
		}
	},
	HealBlock : {
		name : "Heal Block",
		status : Development.incomplete,
		description : "",
		type : Types.grass,
		category : Move.category.status,
		snatchable : true,
		PP : 15,
		accuracy : 1,
		contact: false,
		affects : Move.targets.opponents,
		targets : Move.targets.opponents,
		effect : {
			constant : function (self, target) {
				if (!Battle.hasEffectOnSide(Moves.HealBlock, target.battler.side)) {
					Textbox.state(self.name() + " put a " + Moves.HealBlock.name + " into effect.");
					Battle.bringIntoEffect(Moves.HealBlock, Battles.when.afterFiveTurns, target.battler.side);
				} else {
					return {
						failed : true
					};
				}
			},
			use : [
				function (self, target) {
				}
			]
		},
		effects : {
			event : Events.health,
			oneself : true,
			action : function (data, target) {
				if (data.change > 0) {
					Textbox.state("The " + Moves.HealBlock.name + " prevents healing!");
					return true;
				}
			}
		}
	},
	Absorb : {
		name : "Absorb",
		status : Development.incomplete,
		description : "",
		type : Types.grass,
		category : Move.category.special,
		PP : 25,
		power : 20,
		accuracy : 1,
		contact: false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					var damage = Move.damage(self, target, Moves.Absorb);
					Battle.damage(target, damage);
					Battle.heal(self, damage.damage / 2, self);
				}
			]
		}
	},
	Guillotine : {
		name : "Guillotine",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.physical,
		PP : 5,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (self.level >= target.level && (self.level - target.level + 30) / 100 >= srandom.point()) {
						Textbox.state("It's a one-hit knockout!");
						Battle.damage(target, Move.exactDamage(self, target, Moves.Guillotine, target.health));
					} else
						return {
							failed : true
						};
				}
			]
		}
	},
	DragonRage : {
		name : "Dragon Rage",
		status : Development.incomplete,
		description : "",
		type : Types.dragon,
		category : Move.category.special,
		PP : 10,
		accuracy : 1,
		contact: false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.exactDamage(self, target, Moves.DragonRage, 40));
				}
			]
		}
	},
	PerishSong : {
		name : "Perish Song",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["Sound"],
		PP : 5,
		contact: false,
		affects : Move.targets.everyone,
		targets : Move.targets.everyone,
		effect : {
			constant : function () {
				Textbox.state("All Pokémon who hear the song will perish in 3 turns!");
			},
			use : [
				function (self, target) {
					if (!Battle.moveHasEffect(Moves.PerishSong, target)) {
						Battle.moveHaveEffect(Moves.PerishSong, Battles.when.endOfThisTurn, target, {count : 3});
						Battle.moveHaveEffect(Moves.PerishSong, Battles.when.endOfNextTurn, target, {count : 2});
						Battle.moveHaveEffect(Moves.PerishSong, Battles.when.endOfTurnAfterNext, target, {count : 1});
						Battle.moveHaveEffect(Moves.PerishSong, Battles.when.inThreeTurns, target, {count : 0});
					} else
						return {
							failed : true
						};
				}
			],
			effect : function (target, data) {
				Textbox.state(target.name() + "'s Perish Count fell to " + data.count + ".");
				if (data.count === 0)
					Battle.damage(target, Move.percentageDamage(target, 1));
			}
		}
	},
	TakeDown : {
		name : "Take Down",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.physical,
		PP : 20,
		power : 90,
		accuracy : 0.85,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					var damage = Move.damage(self, target, Moves.TakeDown);
					Battle.damage(target, damage);
					self.recoil(Moves.TakeDown, damage.damage / 4);
				}
			]
		}
	},
	Yawn : {
		name : "Yawn",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		PP : 10,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.moveHaveEffect(Moves.Yawn, Battles.when.endOfNextTurn, target);
				}
			],
			effect : function (target) {
				if (target.status === Statuses.none) {
					Textbox.state(target.name() + " yawned and fell asleep.");
					Battle.inflict(target, Statuses.asleep);
				}
			}
		}
	},
	FutureSight : {
		name : "Future Sight",
		status : Development.incomplete,
		description : "",
		type : Types.psychic,
		category : Move.category.special,
		PP : 10,
		power : 120,
		accuracy : 1,
		contact: false,
		piercing : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (!Battle.moveHasEffect(Moves.FutureSight, target)) {
						Textbox.state(self.name() + " has foreseen an attack!");
						Battle.moveHaveEffect(Moves.FutureSight, Battles.when.endOfTurnAfterNext, target, {self : self});
					} else
						return {
							failed : true
						};
				}
			],
			effect : function (target, data) {
				Textbox.state(target.name() + " took the " + Moves.FutureSight.name + " attack!");
				Battle.damage(target, Move.damage(data.self, target, Moves.FutureSight, null, Moves.FutureSight.type, true));
			}
		}
	},
	JumpKick : {
		name : "Jump Kick",
		status : Development.incomplete,
		description : "",
		type : Types.fighting,
		category : Move.category.physical,
		PP : 10,
		power : 100,
		accuracy : 0.95,
		contact: true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.JumpKick));
				}
			],
			miss : function (self, target) {
				self.crash(self.stats[Stats.health]() / 2);
			}
		}
	},
	HyperVoice : {
		name : "Hyper Voice",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.special,
		classification : ["Sound"],
		PP : 10,
		power : 90,
		accuracy : 1,
		contact: false,
		affects : Move.targets.opponentAndAdjacent,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.HyperVoice));
				}
			]
		}
	},
	HyperBeam : {
		name : "Hyper Beam",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.special,
		PP : 5,
		power : 150,
		accuracy : 0.9,
		contact : false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.HyperBeam));
					self.battler.recharging = 1;
				}
			]
		}
	},
	SolarBeam : {
		name : "Solar Beam",
		status : Development.incomplete,
		description : "",
		type : Types.grass,
		category : Move.category.special,
		PP : 10,
		power : 120,
		accuracy : 1,
		contact : false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (Battle.weather === Weathers.intenseSunlight) {
						Move.use(Moves.SolarBeam, ++ self.battler.moveStage, self, target);
						return;
					}
					Textbox.state(self.name() + " began absorbing sunlight.");
				},
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.SolarBeam));
				}
			]
		}
	},
	Fly : {
		name : "Fly",
		status : Development.incomplete,
		description : "",
		type : Types.flying,
		category : Move.category.physical,
		PP : 15,
		power : 90,
		accuracy : 0.95,
		contact : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Textbox.state(self.name() + " flew up high.");
					self.invulnerable = Moves.Fly;
				},
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Fly));
					self.invulnerable = null;
				}
			],
			fail : function (self, target) {
				self.invulnerable = null;
			}
		},
		animation : [
			[
				{
					start : 0,
					duration : 30,
					transition : function (self, target, progress) {
						self.display.position.x = self.from.position.x + (30 - self.from.position.y) * progress;
						self.display.position.y = self.from.position.y + (352 - self.from.position.y) * progress;
						self.display.position.z = self.from.position.z + (30 - self.from.position.z) * progress;
					}
				}
			],
			[
				{
					time : 0,
					animation : function (self, target) {
						self.display.position.x = 140;
						self.display.position.z = 150;
					}
				},
				{
					delay : 0,
					duration : 30,
					transition : function (self, target, progress) {
						self.display.position.y = self.from.position.y + (20 - self.from.position.y) * progress;
						self.display.position.z = self.from.position.z + (115 - self.from.position.z) * progress;
					}
				},
				{
					delay : -5,
					duration : 10,
					transition : function (self, target, progress) {
						target.display.position.x = target.from.position.x + (-50 - target.from.position.x) * progress;
						target.display.position.z = target.from.position.z + (-20 - target.from.position.z) * progress;
						target.display.angle = target.from.angle + (-0.2 - target.from.angle) * progress;
					}
				},
				{
					delay : 0,
					duration : 30,
					transition : function (self, target, progress) {
						self.display.position.x = self.from.position.x + (0 - self.from.position.x) * progress;
						self.display.position.y = self.from.position.y + (0 - self.from.position.y) * progress;
						self.display.position.z = self.from.position.z + (0 - self.from.position.z) * progress;
					}
				},
				{
					delay : 10,
					duration : 30,
					transition : function (self, target, progress) {
						target.display.position.x = target.from.position.x + (0 - target.from.position.x) * progress;
						target.display.position.z = target.from.position.z + (0 - target.from.position.z) * progress;
						target.display.angle = target.from.angle + (0 - target.from.angle) * progress;
					}
				}
			]
		]
	},
	Dive : {
		name : "Dive",
		status : Development.incomplete,
		description : "",
		type : Types.water,
		category : Move.category.physical,
		PP : 10,
		power : 80,
		accuracy : 1,
		contact : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Textbox.state(self.name() + " dived into the water.");
					self.invulnerable = Moves.Dive;
				},
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Dive));
					self.invulnerable = null;
				}
			],
			fail : function (self, target) {
				self.invulnerable = null;
			}
		}
	},
	Dig : {
		name : "Dig",
		status : Development.incomplete,
		description : "",
		type : Types.ground,
		category : Move.category.physical,
		PP : 10,
		power : 90,
		accuracy : 1,
		contact : true,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Textbox.state(self.name() + " burrowed into the ground.");
					self.invulnerable = Moves.Dig;
				},
				function (self, target) {
					Battle.damage(target, Move.damage(self, target, Moves.Dig));
					self.invulnerable = null;
				}
			],
			fail : function (self, target) {
				self.invulnerable = null;
			}
		}
	},
	PinMissile : {
		name : "Pin Missile",
		status : Development.incomplete,
		description : "",
		type : Types.bug,
		category : Move.category.physical,
		PP : 20,
		power : 25,
		accuracy : 0.95,
		contact : false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target, constant, repetitions) {
					if (arguments.length < 4)
						repetitions = 1;
					Battle.damage(target, Move.damage(self, target, Moves.PinMissile), repetitions === 1);
					if (target !== NoPokemon && (repetitions < 2 || (repetitions <= 3 && srandom.chance(3)) || (repetitions <= 5 && srandom.chance(6))))
						Moves.PinMissile.effect.use[0](self, target, constant, ++ repetitions);
				}
			]
		}
	},
	Supersonic : {
		name : "Supersonic",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["Sound"],
		PP : 20,
		accuracy : 0.55,
		contact : false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					Battle.confuse(target);
				}
			]
		}
	},
	Spikes : {
		name : "Spikes",
		status : Development.incomplete,
		description : "",
		type : Types.ground,
		category : Move.category.status,
		snatchable : true,
		classification : ["hazard"],
		PP : 20,
		contact : false,
		affects : Move.targets.opponents,
		targets : Move.targets.opponents,
		effect : {
			use : [
				function (self, target) {
					Textbox.state(self.name() + " scattered sharp spikes around the opponent.");
					Battle.placeHazard(Moves.Spikes, 3, target.battler.side);
				}
			],
			hazard : function (target, stack) {
				if (target.effectiveness(Moves.Spikes.type) > 0) {
					Textbox.state("The sharp spikes hurt " + target.name() + "!");
					Battle.damage(target, {damage : Math.floor(target.stats[Stats.health]() / (8 - 2 * (stack - 1)))});
				}
			}
		}
	},
	Ingrain : {
		name : "Ingrain",
		status : Development.incomplete,
		description : "",
		type : Types.grass,
		category : Move.category.status,
		snatchable : true,
		classification : ["hazard"],
		PP : 20,
		contact : false,
		affects : Move.targets.self,
		effect : {
			use : [
				function (self) {
					if (!Battle.moveHasEffect(Moves.Ingrain, self)) {
						Textbox.state(self.name() + " rooted " + self.selfPronoun() + " firmly.");
						self.battler.grounded = true;
						self.battler.trapped = true;
						Battle.moveHaveRepeatingEffect(Moves.Ingrain, Battles.when.endOfThisTurn, self);
					} else
						return {
							failed : true
						};
				}
			],
			effect : function (poke) {
				Textbox.state(poke.name() + " recovered some of " + poke.possessivePronoun() + " health through " + poke.possessivePronoun() + " ingrained roots!");
				Battle.healPercentage(poke, 1 / 16, poke);
			}
		}
	},
	Curse : {
		name : "Curse",
		status : Development.incomplete,
		description : "",
		type : Types.ghost,
		category : Move.category.status,
		snatchable : true,
		PP : 10,
		contact : false,
		affects : Move.targets.directTarget,
		targets : Move.targets.adjacentToUser,
		effect : {
			use : [
				function (self, target) {
					if (self.ofType(Types.ghost)) {
						if (!Battle.moveHasEffect(Moves.Ingrain, self)) {
							Textbox.state(target.name() + " was put under an evil " + Moves.Curse.name + "!");
							Battle.damage(self, Move.exactDamage(self, self, Moves.Curse, Math.floor(self.stats[Stats.health]() / 2)));
							Battle.moveHaveRepeatingEffect(Moves.Curse, Battles.when.endOfThisTurn, target);
						} else
							return {
								failed : true
							};
					} else {
						Battle.stat(self, Stats.speed, -1, self);
						Battle.stat(self, Stats.attack, 1, self);
						Battle.stat(self, Stats.defence, 1, self);
					}
				}
			],
			effect : function (target) {
				Textbox.state(target.name() + " lost a quarter of " + target.possessivePronoun() + " health to " + target.possessivePronoun() + " curse!");
				Battle.damage(target, Move.percentageDamage(target, 1 / 4));
			}
		}
	},
	Metronome : {
		name : "Metronome",
		status : Development.incomplete,
		description : "",
		type : Types.normal,
		category : Move.category.status,
		snatchable : true,
		classification : ["special"],
		PP : 10,
		contact : false,
		affects : Move.targets.self,
		effect : {
			use : [
				function (self) {
					var moves = [], choice, targets;
					forevery(Moves, function (move) {
						if (!move.classification.contains("special"))
							moves.push(move);
					});
					choice = srandom.chooseFromArray(moves);
					self.battler.previousMove = choice;
					targets = Battle.targetsForMove(self, choice, true);
					targets.sort(function (targetA, targetB) {
						return Battle.distanceBetween(self, targetA.poke) - Battle.distanceBetween(self, targetB.poke);
					});
					if (targets.notEmpty()) {
						Move.use(choice, 0, self, targets[0].place); // Pick the closest target (this shouldn't be an ally unless it's a friendly move)
					} else
						return {
							failed : true
						};
				}
			]
		}
	}
};
forevery(Moves, function (move) {
	if (!move.hasOwnProperty("priority"))
		move.priority = 0;
	if (!move.hasOwnProperty("classification"))
		move.classification = [];
	if (move.hasOwnProperty("despite")) {
		foreach(move.despite, function (affect, i) {
			move.despite[i] = Moves[affect];
		});
	} else
		move.despite = [];
	if (!move.hasOwnProperty("targets")) // The choice of Pokémon the user has to attack
		move.targets = move.affects;
	if (!move.hasOwnProperty("piercing")) // Hits through Protect
		move.piercing = false;
	if (!move.hasOwnProperty("infiltrating")) // Hits through Substitute
		move.infiltrating = false;
	if (!move.hasOwnProperty("animation")) {
		move.animation = [];
		foreach(move.effect.use, function () {
			move.animation.push([]);
		});
	}
	else {
		var lastEnd = 0;
		foreach(move.animation, function (animation) {
			foreach(animation, function (stage) {
				if (stage.hasOwnProperty("delay"))
					stage.from = lastEnd + stage.delay;
				if (stage.hasOwnProperty("start")) {
					stage.from = stage.start;
				}
				/*if (stage.hasOwnProperty("from")) {
					stage.time = stage.from;
				}*/
				if (stage.hasOwnProperty("duration")) {
					stage.to = stage.from + stage.duration;
				}
				lastEnd = stage.hasOwnProperty("time") ? stage.time : stage.to;
			});
		});
	}
	move.classification.push(Type.string(move.type));
});
Move.Struggle.move = Moves.Struggle;