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
		/* Assumes message is well-formed but may not necessarily contain valid data in the case of relays */
		switch (message) {
			case "initiate":
				// Initiate a battle between two parties
				// data: parties, data, rules, flags, callback, alert
				identifier = Supervisor.identification;
				// Check that all the rules are matched
				var valid = true;
				// data.rules.banned.items
				// Pokémon (form(e)s)
				// moves
				// abilities
				foreach(data.rules.clauses, function (clause) {
					switch (clause.regards) {
						case "Pokémon":
							break;
						case "party":
							break;
						case "move":
							break;
					}
				});
				if (valid) {
					var battle = BattleContext();
					Supervisor.processes[identifier] = {
						parties : data.parties,
						parameters : data.data,
						rules : data.rules,
						relay : [],
						relayed : 0,
						battle : battle,
						alert : data.alert
					};
					var teamA = new trainer(data.data.teamA), teamB = new trainer(data.data.teamB);
					teamA.type = teamB.type = Trainers.type.online;
					var callback = function (flags, trainers) {
						data.callback(flags, trainers);
						delete Supervisor.processes[identifier];
					};
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
					return Supervisor.identification ++;
				}
				break;
			case "join":
				// Another party joins a battle (as a spectator)
				// data: parties
				Supervisor.processes[identifier].parties = Supervisor.processes[identifier].parties.concat(data.parties);
				break;
			case "terminate":
				// Terminates a battle that is in progress
				// data: reason
				var process = Supervisor.processes[identifier];
				process.battle.end(true);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "terminate", data.reason, identifier);
				});
				delete Supervisor.processes[identifier];
				return process;
			case "relay":
				// Sends data between two battling parties
				// data: party, data (party here being not a Pokémon party, but a participant)
				// Assumes the party sending the data was one of the parties involved in the process it is sending to
				// The party should be an identifier matches up with a trainer team
				var process = Supervisor.processes[identifier], valid = true;
				if (Array.isArray(data.data) && !foreach(data.data, function (datum) {
					if (typeof datum !== "object" || datum === null)
						return true;
				})) {
					foreach(data.data, function (action) {
						action.trainer = data.party;
					});
					// Assumes that the correct number of actions will be sent at once (i.e. no split data packets)
					if (process.battle.communicationForTrainerIsValid(data.party, data.data)) {
						process.relay = process.relay.concat(data.data);
						var actionsToSend = process.relay.slice(process.relayed);
						if (process.battle.state.kind === "waiting" && process.battle.hasCommunicationForTrainers(process.battle.state.for, actionsToSend)) {
							process.battle.receiveActions(actionsToSend);
							foreach(process.parties, function (party) {
								Supervisor.send(party, "actions", actionsToSend, identifier);
							});
							process.relayed = process.relay.length;
						}
					} else
						valid = false;
				} else
					valid = false;
				if (!valid) {
					process.alert({
						"reason" : "invalid input",
						"party" : data.party,
						"input" : data.data
					});
				}
				break;
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
				if (issues.notEmpty())
					process.alert(issues);
				break;
		}
	}
};