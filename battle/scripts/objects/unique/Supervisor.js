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
				// data: parties, data, rules
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
					var battle = BattleContext(true);
					Supervisor.processes[identifier] = {
						parties : data.parties,
						parameters : data.data,
						relay : [],
						battle : BattleContext()
					};
					var ally = new trainer(data.data.ally), opponent = new trainer(data.data.opponent);
					ally.type = opponent.type = Trainers.type.online;
					battle.beginOnline(data.data.seed, ally, opponent, data.data.parameters);
					foreach(data.parties, function (party) {
						Supervisor.send(party, "initiate", data.parameters, identifier);
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
				foreach(process.parties, function (party) {
					Supervisor.send(party, "terminate", data.reason, identifier);
				});
				delete Supervisor.processes[identifier];
				return process;
				break;
			case "relay":
				// Sends data between two battling parties
				// data: actor, data
				// Assumes the party sending the data was one of the parties involved in the process it is sending to
				var process = Supervisor.processes[identifier];
				foreach(data.data, function (action) {
					action.trainer = data.actor;
				});
				process.relay.push(data.data);
				process.battle.receiveActions(data.data);
				foreach(process.parties, function (party) {
					Supervisor.send(party, "actions", {
						actor : data.actor,
						data : data.data
					}, identifier);
				});
				break;
			case "sync":
				// Checks the clients for the different parties are in sync with the main battle
				// data: party, state
				var battle = Supervisor.processes[identifier].battle;
				var assert = function (local, external) {
					if (local !== external) {
						return {
							message : "desynchronised",
							party : data.party
						}
					}
				};
				assert(battle.random.seed, state.seed);
				assert(battle.weather, state.weather);
				forevery(battle.allTrainers(), function (trainer) {
					assert(trainer.store(), state.trainers[trainer.identification]);
				});
				break;
		}
		return null; // There were no issues raised
	}
};