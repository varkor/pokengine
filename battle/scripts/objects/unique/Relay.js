Relay = {
	identification : null,
	processes : {},
	pass : function (message, data, identifier) {
		/* Send message along via the relevant WebSocket connection */
		/* <CONNECTION>.send({
			identifier : identifier,
			message : message,
			data : data
		}); */
	},
	receive : function (message, data, identifier) {
		/* Assumes appropriate validation has been done before it is sent to Relay */
		switch (message) {
			case "identification":
				Relay.identification = data;
				break;
			case "initiate": // Begin a battle
				/*
					{
						rules,
						callback,
						data : {
							ally,
							opponent,
							seed,
							parameters
						}
					}
				*/
				var battle = BattleContext(true);
				Relay.processes[identifier] = {
					battle : battle
				};
				battle.identifier = identifier;
				var ally, opponent;
				if (data.data.teamA.identification === Relay.identification) {
					ally = new trainer(data.data.teamA);
					opponent = new trainer(data.data.teamB);
					Game.takePossessionOf(ally);
				} else if (data.data.teamB.identification === Relay.identification) {
					ally = new trainer(data.data.teamB);
					opponent = new trainer(data.data.teamA);
					Game.takePossessionOf(ally);
				} else {
					ally.type = Trainers.type.online;
				}
				opponent.type = Trainers.type.online;
				ally.team = ally.identification;
				opponent.team = opponent.identification;
				battle.canvas.focus();
				Battle = battle;
				var callback = function (flags, trainers) {
					data.callback(flags, trainers);
					battle.destroy();
				};
				if (opponent.identification === 0) { /* Code for TheWild */
					battle.random.seed = data.data.seed;
					battle.beginWildBattle(ally, opponent.party.pokemon, data.data.parameters, callback);
				} else {
					battle.beginOnline(data.data.seed, ally, opponent, data.data.parameters, callback);
				}
				break;
			case "terminate": // A battle must be stopped
				Relay.processes[identifier].battle.end(true);
				Battle = null;
				delete Relay.processes[identifier];
				break;
			case "actions": // Actions from one of the parties has been received
				if (data.actor !== Relay.identification) {
					Relay.processes[identifier].battle.receiveActions(data.data);
				}
				break;
		}
	}
};