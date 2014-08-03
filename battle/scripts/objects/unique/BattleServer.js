exports.BattleServer = {
	clients : [],
	battles = [],
	receive : function (message, from) {
		switch (message.action) {
			case "connect":
				exports.BattleServer.clients.push(from);
				break;
			case "invite":
				if (message.hasOwnProperty("who")) {
					var clientA, clientB = null;
					clientA = from;
					exports.BattleServer.clients.forEach(function (client) {
						if (client !== from && client.ip === message.who) {
							clientB = client;
							return;
						}
					});
					if (clientB !== null) {
						exports.BattleServer.battles.push({
							clientA : clientA,
							clientB : clientB,
							seed : Math.random() * 10000000000000000
						});
						exports.BattleServer.send({
							action : "begin",
							team : 0
						}, clientA);
						exports.BattleServer.send({
							action : "begin",
							team : 1
						}, clientB);
					}
				} else {
					exports.BattleServer.clients.forEach(function (client) {
						if (client !== from)
							exports.BattleServer.send({
								action : "invitation",
								from : client
							});
					});
				}
				break;
			case "actions":
				exports.BattleServer.battles.forEach(function (battle) {
					if (battle.clientA === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, clientB);
						return;
					} else if (battle.clientB === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, clientA);
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
		to.socket.send(JSON.stringify([56, message]).slice(1, -1));
	}
};