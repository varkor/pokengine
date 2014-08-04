exports.BattleServer = {
	clients : [],
	battles : [],
	receive : function (message, from) {
		switch (message.action) {
			case "connect":
				exports.BattleServer.clients.push(from);
				break;
			case "disconnect":
				var index = exports.BattleServer.clients.indexOf(from);
				if (index >= 0)
					exports.BattleServer.clients.splice(index, 1);
				index = -1;
				exports.BattleServer.battles.forEach(function (battle, i) {
					if (battle.clientA === from) {
						exports.BattleServer.send({
							action : "disconnect"
						}, battle.clientB);
						index = i;
						return;
					} else if (battle.clientB === from) {
						exports.BattleServer.send({
							action : "disconnect"
						}, battle.clientA);
						index = i;
						return;
					}
				});
				if (index >= 0)
					exports.BattleServer.battles.splice(index, 1);
				break;
			case "invite":
				if (exports.BattleServer.battleForClient(from) === null) {
					if (message.hasOwnProperty("who")) {
						var clientB = from, clientA = null;
						exports.BattleServer.clients.forEach(function (client) {
							if (client !== from && client.ip === message.who) {
								clientA = client;
								return;
							}
						});
						if (clientA !== null && exports.BattleServer.battleForClient(clientA) === null) {
							var battle = {
								clientA : clientA,
								clientB : clientB,
								seed : Math.random() * Math.pow(2, 32)
							};
							exports.BattleServer.battles.push(battle);
							exports.BattleServer.send({
								action : "begin",
								team : 0,
								seed : battle.seed
							}, clientA);
							exports.BattleServer.send({
								action : "begin",
								team : 1,
								seed : battle.seed
							}, clientB);
						}
					} else {
						exports.BattleServer.clients.forEach(function (client) {
							if (client !== from)
								exports.BattleServer.send({
									action : "invitation",
									from : from.ip
								}, client);
						});
					}
				}
				break;
			case "actions":
				exports.BattleServer.battles.forEach(function (battle) {
					if (battle.clientA === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, battle.clientB);
						return;
					} else if (battle.clientB === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, battle.clientA);
						return;
					}
				});
				break;
			default:
				console.log("Received an unknown action from a client: ", message);
				break;
		}
	},
	send : function (message, to) {
		to.send(JSON.stringify([56, message]).slice(1, -1));
	},
	battleForClient : function (client) {
		var which = null;
		exports.BattleServer.battles.forEach(function (battle) {
			if (battle.clientA === client || battle.clientB === client) {
				which = battle;
				return;
			}
		});
		return which;
	}
};