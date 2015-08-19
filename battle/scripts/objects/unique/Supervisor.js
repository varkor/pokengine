Supervisor = {
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
						battle : battle
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
						data.callback(flags, trainers);
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
					if (teamA.identification === 0) { /* Code for wild battles */
						battle.beginWildBattle(teamB, teamA.party.pokemon, data.data.parameters, callback);
					} else if (teamB.identification === 0) {
						battle.beginWildBattle(teamA, teamB.party.pokemon, data.data.parameters, callback);
					} else {
						battle.beginOnline(data.data.seed, teamA, teamB, data.data.parameters, callback);
					}
					foreach(data.parties, function (party) {
						Supervisor.send(party, "initiate", {
							rules : data.rules,
							data : data.data
						}, identifier);
					});
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
					var data = JSONCopy(process.parameters);
					if (spectator.perspective !== data.teamA.trainer.identification) {
						if (spectator.perspective === data.teamB.trainer.identification) {
							var temp = data.teamA;
							data.teamA = data.teamB;
							data.teamB = temp;
						} else {
							return unsuccessful("One of the spectators was trying to observe from the perspective of a trainer who was not battling.");
						}
					}
					Supervisor.send(party, "initiate", {
						rules : process.rules,
						data : data
					}, identifier);
					// Bring the party up to date on all the actions taken so far
					Supervisor.send(party, "actions", process.relay.slice(0, process.relayed), identifier);
				});
				process.parties = process.parties.concat(parties);
				return {
					success : true
				};
			case "terminate":
				// Terminates a battle that is in progress
				// data: reason
				if (!data.hasOwnProperty("reason"))
					return unsuccessful("The parameter `data` should have had a `reason` property.");
				var process = Supervisor.processes[identifier];
				process.battle.end(true);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "terminate", data.reason, identifier);
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
					if (process.battle.communicationForTrainerIsValid(data.team, data.data, issues)) {
						process.relay = process.relay.concat(data.data);
						var actionsToSend = process.relay.slice(process.relayed);
						if (process.battle.state.kind === "waiting" && process.battle.hasCommunicationForTrainers(process.battle.state.for, actionsToSend)) {
							process.battle.receiveActions(actionsToSend);
							foreach(process.parties, function (party) {
								Supervisor.send(party, "actions", actionsToSend, identifier);
							});
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
				var assert = function (parameter, local, external) {
					if (local !== external) {
						issues.push({
							"reason" : "desynchronised",
							"party" : data.party,
							"state" : parameter,
							"local" : local,
							"external" : external
						});
					}
				};
				assert("turn", battle.turns, data.data.state.turn);
				assert("seed", battle.random.seed, data.data.state.seed);
				assert("weather", battle.weather, data.data.state.weather);
				forevery(battle.allTrainers(), function (trainer) {
					assert("trainer: " + trainer.identification, trainer.store(), data.data.state.trainers[trainer.identification]);
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
				break;
			default:
				// An invalid `message` value has been sent
				return {
					success : false,
					reason : "The `message` parameter was not valid (" + message + ")."
				};
		}
	},
	record : function (identifier) {
		var unsuccessful = function (reason) {
			return {
				success : false,
				reason : reason
			};
		};
		if (Supervisor.processes.hasOwnProperty(identifier)) {
			var process = Supervisor.processes[process];
			if (!process.battle.active) {
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