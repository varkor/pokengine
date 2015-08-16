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
				var teamA = new trainer(data.data.teamA.trainer), teamB = new trainer(data.data.teamB.trainer);
				teamA.type = data.data.teamA.type;
				teamB.type = data.data.teamB.type;
				var ally, opponent;
				if (data.data.teamA.trainer.identification === Relay.identification) {
					ally = teamA;
					opponent = teamB;
					Game.takePossessionOf(ally);
				} else if (data.data.teamB.trainer.identification === Relay.identification) {
					ally = teamB;
					opponent = teamA;
					Game.takePossessionOf(ally);
				}
				ally.team = ally.identification;
				opponent.team = opponent.identification;
				battle.canvas.focus();
				Battle = battle;
				var callback = function (flags, trainers) {
					data.callback(flags, trainers);
					battle.destroy();
				};
				if (opponent.identification === 0) { /* Code for wild battles */
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
				Relay.processes[identifier].battle.receiveActions(data.filter(function (action) {
					return action.trainer !== Relay.identification;
				}));
				break;
		}
	}
};