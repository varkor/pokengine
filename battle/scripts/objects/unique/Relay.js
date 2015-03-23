Relay = {
	identification : null,
	processes : {},
	pass : function (identifier, message, data) {
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
					data : {
						ally,
						opponent,
						seed,
						parameters
					}
				*/
				var battle = BattleContext(true);
				Relay.processes[identifier] = {
					battle : battle
				};
				battle.identifier = identifier;
				var ally = new trainer(data.ally), opponent = new trainer(data.opponent);
				if (ally.identification !== Relay.identification) {
					ally.type = Trainers.type.online;
				} else {
					Game.takePossessionOf(ally);
				}
				opponent.type = Trainers.type.online;
				ally.team = ally.identification;
				opponent.team = opponent.identification;
				battle.canvas.focus();
				Battle = battle;
				battle.beginOnline(data.seed, ally, opponent, data.parameters, function () {
					battle.destroy();
				});
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