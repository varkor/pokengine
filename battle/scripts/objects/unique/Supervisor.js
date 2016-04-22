"use strict";

let Supervisor = {
	identification : 0,
	processes : {},
	send : function (party, message, data, identifier) {
		/* <CONNECTION-FOR-(party)>.send({
			identifier : identifier,
			message : message,
			data : data
		}); */
	},
	receive : function (message, data, identifier) {
		// Supervisor.receive, for the most part, does not guarantee that any function that is invoked directly by the server is validated (although it does do some checking for convenience).
		var unsuccessful = function (reason) {
			return {
				success : false,
				reason : reason
			};
		};
		if (arguments.length < 2 || arguments.length > 3) {
			// This is actually an issue with the way Supervisor is invoked
			return unsuccessful("Supervisor.receive() expects 2 or 3 arguments, but received " + arguments.length + ".");
		}
		// Check the format of the arguments
		if (typeof message !== "string")
			return unsuccessful("The parameter `message` should have been a string, but had type `" + (typeof message) + "`.");
		if (typeof data !== "object")
			return unsuccessful("The parameter `data` should have been an object, but had type `" + (typeof data) + "`.");
		if (arguments.length >= 3) {
			if (typeof identifier !== "number")
				return unsuccessful("The parameter `identifier` should have been a number, but had type `" + (typeof identifier) + "`.");
			if (identifier !== Math.floor(identifier) || identifier < 0)
				return unsuccessful("The parameter `identifier` should have been a natural number, but had value `" + identifier + "`.");
		}
		switch (message) {
			case "initiate":
				// Initiate a battle between two parties
				// data: parties, data, rules, flags, callback
				identifier = Supervisor.identification;
				// Check that all the rules are matched
				var valid = true;
				// data.rules.banned.items
				// Pokémon (form(e)s)
				// moves
				// abilities
				if (!data.hasOwnProperty("rules"))
					return unsuccessful("The parameter `data` should have had a `rules` property.");
				if (typeof data.rules !== "object")
					return unsuccessful("The parameter `data.rules` should have been an object, but had type `" + (typeof data.rules) + "`.");
				if (!data.rules.hasOwnProperty("clauses"))
					return unsuccessful("The parameter `data.rules` should have had a `clauses` property.");
				if (!Array.isArray(data.rules.clauses))
					return unsuccessful("The parameter `data.rules.clauses` should have been an array.");
				if (data.rules.timer !== null && typeof data.rules.timer !== "number")
					return unsuccessful("The parameter `data.rules.timer` should have been a number or null, but had type `" + (typeof data.rules.timer) + "`.");
				if (foreach(data.rules.clauses, function (clause) {
					if (typeof clause !== "object")
						return true;
					if (!clause.hasOwnProperty("regards"))
						return true;
					switch (clause.regards) {
						case "Pokémon":
							break;
						case "party":
							break;
						case "move":
							break;
					}
				})) {
					return unsuccessful("One of the elements of `data.rules.clauses` was malformed.");
				}
				if (valid) {
					if (!data.hasOwnProperty("parties"))
						return unsuccessful("The parameter `data` should have had a `parties` property.");
					if (!Array.isArray(data.parties))
						return unsuccessful("The parameter `data.parties` should have been an array.");
					if (!data.hasOwnProperty("data"))
						return unsuccessful("The parameter `data` should have had a `data` property.");
					if (typeof data.data !== "object")
						return unsuccessful("The parameter `data.data` should have been an object, but had type `" + (typeof data.data) + "`.");
					var battle = BattleContext();
					Supervisor.processes[identifier] = {
						parties : data.parties,
						parameters : data.data,
						rules : data.rules,
						relay : [],
						relayed : 0,
						battle : battle,
						timer : null
					};
					if (!data.data.hasOwnProperty("teamA"))
						return unsuccessful("The parameter `data.data` should have had a `teamA` property.");
					if (typeof data.data.teamA !== "object")
						return unsuccessful("The parameter `data.data.teamA` should have been an object, but had type `" + (typeof data.data.teamA) + "`.");
					if (!data.data.hasOwnProperty("teamB"))
						return unsuccessful("The parameter `data.data` should have had a `teamB` property.");
					if (typeof data.data.teamA !== "object")
						return unsuccessful("The parameter `data.data.teamB` should have been an object, but had type `" + (typeof data.data.teamB) + "`.");
					// It would be good to validate teamA and teamB, but we're trusting the server anyway — the responses in `initialise` are really just to help out anyone debugging the function
					var teamA = new trainer(data.data.teamA.trainer), teamB = new trainer(data.data.teamB.trainer);
					teamA.type = data.data.teamA.type;
					teamB.type = data.data.teamB.type;
					var callback = function (flags, trainers) {
						Supervisor.countdown(identifier, true);
						data.callback(flags, trainers, Supervisor.record(identifier));
						battle.destroy();
						delete Supervisor.processes[identifier];
					};
					if (!data.data.hasOwnProperty("seed"))
						return unsuccessful("The parameter `data.data` should have had a `seed` property.");
					if (typeof data.data.seed !== "number")
						return unsuccessful("The parameter `data.data.seed` should have been a number, but had type `" + (typeof data.data.seed) + "`.");
					if (!data.data.hasOwnProperty("parameters"))
						return unsuccessful("The parameter `data.data` should have had a `parameters` property.");
					if (typeof data.data.parameters !== "object")
						return unsuccessful("The parameter `data.data.parameters` should have been an object, but had type `" + (typeof data.data.parameters) + "`.");
					battle.random.seed = data.data.seed;
					var illegalBattle;
					if (teamA.identification === 0) { /* Code for wild battles */
						illegalBattle = !battle.beginWildBattle(teamB, teamA.party.pokemon, data.data.parameters, callback);
					} else if (teamB.identification === 0) {
						illegalBattle = !battle.beginWildBattle(teamA, teamB.party.pokemon, data.data.parameters, callback);
					} else {
						illegalBattle = !battle.beginOnline(data.data.seed, teamA, teamB, data.data.parameters, callback);
					}
					if (illegalBattle) {
						return unsuccessful("The battle was illegal in some form (probably due to one of the trainers not having any valid Pokémon).");
					}
					foreach(data.parties, function (party) {
						Supervisor.send(party, "initiate", {
							rules : data.rules,
							data : data.data
						}, identifier);
					});
					Supervisor.countdown(identifier);
					return {
						success : true,
						identification : Supervisor.identification ++
					};
				} else {
					return {
						success : false,
						reason : "The parties did not conform to the battle rules."
					};
				}
			case "spectate":
				// Another party joins a battle (as a spectator)
				// data: spectators
				if (!data.hasOwnProperty("spectators"))
					return unsuccessful("The parameter `data` should have had a `spectators` property.");
				if (!Array.isArray(data.spectators))
					return unsuccessful("The parameter `data.spectators` should have been an array.");
				var process = Supervisor.processes[identifier], parties = [];
				foreach(data.spectators, function (spectator) {
					var party = spectator.party;
					parties.push(party);
					// Initiate the party's battle
					var recording = JSONCopy(process.parameters);
					if (spectator.perspective !== recording.teamA.trainer.identification) {
						if (spectator.perspective === recording.teamB.trainer.identification) {
							var temp = recording.teamA;
							recording.teamA = recording.teamB;
							recording.teamB = temp;
						} else {
							return unsuccessful("One of the spectators was trying to observe from the perspective of a trainer who was not battling.");
						}
					}
					Supervisor.send(party, "initiate", {
						rules : process.rules,
						data : recording
					}, identifier);
					// Bring the party up to date on all the actions taken so far
					Supervisor.send(party, "actions", process.relay.slice(0, process.relayed), identifier);
				});
				process.parties = process.parties.concat(parties);
				return {
					success : true
				};
			case "leave":
				// A party stops spectating a battle
				// data: parties
				if (!data.hasOwnProperty("parties"))
					return unsuccessful("The parameter `data` should have had a `parties` property.");
				if (!Array.isArray(data.parties))
					return unsuccessful("The parameter `data.parties` should have been an array.");
				var process = Supervisor.processes[identifier];
				foreach(data.parties, function (party) {
					process.parties.removeElementsOfValue(party);
					Supervisor.send(party, "terminate", "stopped spectating", identifier);
				});
				return {
					success: true
				};
			case "terminate":
				// Terminates a battle that is in progress
				// data: reason
				if (!data.hasOwnProperty("reason"))
					return unsuccessful("The parameter `data` should have had a `reason` property.");
				var process = Supervisor.processes[identifier];
				process.battle.end({
					"outcome" : "termination"
				}, true);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "terminate", data.reason, identifier);
				});
				delete Supervisor.processes[identifier];
				return {
					success : true,
					process : process
				};
			case "force":
				// Forces a particular outcome during a battle
				// There is very little good reason to use this, apart from for testing reasons. It can be easily abused.
				var process = Supervisor.processes[identifier];
				var alliedVictory = null;
				if (data !== null) {
					if ((data.hasOwnProperty("winner") && data.winner === process.battle.alliedTrainers.first().identification) || (data.hasOwnProperty("loser") && data.loser === process.battle.opposingTrainers.first().identification))
						alliedVictory = true;
					else if ((data.hasOwnProperty("winner") && data.winner === process.battle.opposingTrainers.first().identification) || (data.hasOwnProperty("loser") && data.loser === process.battle.alliedTrainers.first().identification))
						alliedVictory = false;
				}
				process.battle.end({
					"outcome" : alliedVictory === null ? "draw" : (alliedVictory === true ? "allied victory" : (alliedVictory === false ? "opposing victory" : "termination")),
					"forced" : true
				}, true);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "force", data, identifier);
				});
				delete Supervisor.processes[identifier];
				return {
					success : true,
					process : process
				};
			case "relay":
				// Sends data between two battling parties
				// data: party, team, data (party here being not a Pokémon party, but a participant)
				// Assumes the party sending the data was one of the parties involved in the process it is sending to
				// The party should be an identifier matches up with a trainer team
				var process = Supervisor.processes[identifier], valid = true;
				if (!data.hasOwnProperty("data"))
					return unsuccessful("The parameter `data` should have had a `data` property.");
				if (!Array.isArray(data.data))
					return unsuccessful("The parameter `data.data` should have been an array.");
				if (!foreach(data.data, function (datum) {
					if (typeof datum !== "object" || datum === null)
						return true;
				})) {
					foreach(data.data, function (action) {
						action.trainer = data.team;
					});
					// Assumes that the correct number of actions will be sent at once (i.e. no split data packets)
					var issues = [];
					var selection = process.relay.slice(process.relayed).filter(action => action.action === "command" && action.trainer === data.team).length;
					if (process.battle.communicationForTrainerIsValid(data.team, data.data, selection, issues)) {
						process.relay = process.relay.concat(data.data);
						var actionsToSend = process.relay.slice(process.relayed);
						if (process.battle.state.kind === "waiting" && process.battle.hasCommunicationForTrainers(process.battle.state.for, actionsToSend)) {
							process.battle.receiveActions(actionsToSend);
							foreach(process.parties, function (party) {
								Supervisor.send(party, "actions", actionsToSend, identifier);
							});
							Supervisor.countdown(identifier, process.battle.finished);
							process.relayed = process.relay.length;
						}
					} else {
						return {
							success : false,
							reason : "The input sent by the client was invalid.",
							party : data.party,
							input : data.data,
							issues : issues
						};
					}
				} else {
					return unsuccessful("One of the elements of `data.data` was not an object.");
				}
				return {
					success : true
				};
			case "sync":
				// Checks the clients for the different parties are in sync with the main battle
				// data: party, data : { state }
				var process = Supervisor.processes[identifier], battle = process.battle, issues = [];
				var assert = function (parameter, server, client) {
					if ((typeof server !== "object" && client !== server) || (typeof server === "object" && JSON.stringify(server) !== JSON.stringify(client))) {
						issues.push({
							"reason" : "desynchronised",
							"party" : data.party,
							"state" : parameter,
							"server" : server,
							"client" : client
						});
					}
				};
				assert("turn", battle.turns, data.state.turn);
				assert("seed", battle.random.seed, data.state.seed);
				assert("weather", battle.weather, data.state.weather);
				foreach(battle.allTrainers(), function (trainer) {
					assert("trainer: " + trainer.identification, trainer.store(), data.state.trainers[trainer.identification]);
				});
				if (issues.notEmpty()) {
					return {
						success : false,
						reason : "Not every process was in sync.",
						issues : issues
					};
				} else {
					return {
						success : true
					};
				}
			case "replay":
				// Plays a recorded battle for a player
				// data: recording, spectators
				if (!data.hasOwnProperty("spectators"))
					return unsuccessful("The parameter `data` should have had a `spectators` property.");
				if (!Array.isArray(data.spectators))
					return unsuccessful("The parameter `data.spectators` should have been an array.");
				if (!data.hasOwnProperty("recording"))
					return unsuccessful("The parameter `data` should have had a `recording` property.");
				if (typeof data.recording !== "object")
					return unsuccessful("The parameter `data.recording` should been an object, but had type `" + (typeof data.recording) + "`.");
				var process = data.recording, parties = [];
				foreach(data.spectators, function (spectator) {
					var party = spectator.party;
					parties.push(party);
					// Initiate the party's battle
					var recording = JSONCopy(process.parameters);
					if (spectator.perspective !== recording.teamA.trainer.identification) {
						if (spectator.perspective === recording.teamB.trainer.identification) {
							var temp = recording.teamA;
							recording.teamA = recording.teamB;
							recording.teamB = temp;
						} else {
							return unsuccessful("One of the spectators was trying to observe from the perspective of a trainer who was not battling.");
						}
					}
					Supervisor.send(party, "initiate", {
						rules : process.rules,
						data : recording
					}, identifier);
					// Bring the party up to date on all the actions taken so far
					Supervisor.send(party, "actions", process.relay, identifier);
				});
				process.parties = process.parties.concat(parties);
				return {
					success : true
				};
			default:
				// An invalid `message` value has been sent
				return {
					success : false,
					reason : "The `message` parameter was not valid (" + message + ")."
				};
		}
	},
	countdown : function (identifier, cancel) {
		var unsuccessful = function (reason) {
			return {
				success : false,
				reason : reason
			};
		};
		if (Supervisor.processes.hasOwnProperty(identifier)) {
			var process = Supervisor.processes[identifier];
			if (process.timer !== null) {
				clearTimeout(process.timer);
				process.timer = null;
				foreach(process.parties, function (party) {
					Supervisor.send(party, "countdown", null, identifier);
				});
			}
			if (!cancel && process.rules.timer !== null) {
				process.timer = setTimeout(function () {
					var waitingFor = process.battle.trainersWaitingFor(process.battle.state.for, process.relay.slice(process.relayed));
					if (waitingFor.notEmpty()) {
						Supervisor.receive("force", waitingFor.length === 1 ? {
							loser : waitingFor.first()
						} : null, identifier);
					}
				}, process.rules.timer);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "countdown", {
						correction : 0, // Should be some estimation of the time it takes to send a message to the party
						duration : process.rules.timer
					}, identifier);
				});
			}
		} else {
			return unsuccessful("No battle existed with the provided identifier `" + identifier + "`.");
		}
	},
	record : function (identifier, recordUnfinishedBattle) {
		var unsuccessful = function (reason) {
			return {
				success : false,
				reason : reason
			};
		};
		if (Supervisor.processes.hasOwnProperty(identifier)) {
			var process = Supervisor.processes[identifier];
			if (!process.battle.active || recordUnfinishedBattle) {
				return {
					success : true,
					recording : JSONCopy({
						parameters : process.parameters,
						rules : process.rules,
						relay : process.relay
					})
				};
			} else {
				return unsuccessful("The battle you tried to record has not finished yet.");
			}
		} else {
			return unsuccessful("No battle existed with the provided identifier `" + identifier + "`.");
		}
	}
};