"use strict";

let Relay = {
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
				var battle;
				if (typeof Battle !== "undefined" && Battle !== null) {
					if (Battle.active) {
						throw new Error("You can't trigger a battle when there is already one in progress!");
					} else {
						battle = Battle;
					}
				} else {
					battle = BattleContext(true);
				}
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
				} else {
					ally = teamA;
					opponent = teamB;
				}
				ally.team = ally.identification;
				opponent.team = opponent.identification;
				battle.canvas.focus();
				Battle = battle;
				var callback = function (flags, trainers) {
					data.callback(flags, trainers);
				};
				if (opponent.identification === 0) { /* Code for wild battles */
					battle.random.seed = data.data.seed;
					battle.beginWildBattle(ally, opponent.party.pokemon, data.data.parameters, callback);
				} else {
					battle.beginOnline(data.data.seed, ally, opponent, data.data.parameters, callback);
				}
				break;
			case "terminate": // A battle must be stopped
				Relay.processes[identifier].battle.end({
					"outcome" : "termination"
				}, true);
				Battle = null;
				delete Relay.processes[identifier];
				break;
			case "force": // The Supervisor has decided that the result of the battle must be forced (for example, in a time-limited battle)
				var alliedVictory = null;
				if (data !== null) {
					if ((data.hasOwnProperty("winner") && data.winner === Relay.processes[identifier].battle.alliedTrainers.first().identification) || (data.hasOwnProperty("loser") && data.loser === Relay.processes[identifier].battle.opposingTrainers.first().identification))
						alliedVictory = true;
					else if ((data.hasOwnProperty("winner") && data.winner === Relay.processes[identifier].battle.opposingTrainers.first().identification) || (data.hasOwnProperty("loser") && data.loser === Relay.processes[identifier].battle.alliedTrainers.first().identification))
						alliedVictory = false;
				}
				Relay.processes[identifier].battle.end({
					"outcome" : alliedVictory === null ? "draw" : (alliedVictory === true ? "allied victory" : (alliedVictory === false ? "opposing victory" : "termination"))
				}, true);
				Battle = null;
				delete Relay.processes[identifier];
				break;
			case "actions": // Actions from one of the parties has been received
				Relay.processes[identifier].battle.receiveActions(data.filter(function (action) {
					return action.trainer !== Relay.identification || action.action === "forfeit";
				}));
				break;
			case "countdown":
				if (data !== null) {
					var start = performance.now() - data.correction;
					Battle.timer = {
						start: start,
						end: start + data.duration
					};
				} else {
					Battle.timer = null;
				}
				break;
		}
	}
};