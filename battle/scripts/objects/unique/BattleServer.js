BattleServer = {
	clients : [],
	battles = [],
	receive : function (message, from) {
		switch (message.action) {
			case "connect":
				BattleServer.clients.push(from);
				break;
			case "invite":
				if (message.hasOwnProperty("who")) {
					var clientA, clientB = null;
					clientA = from;
					BattleServer.clients.forEach(function (client) {
						if (client !== from && client.ip === message.who) {
							clientB = client;
							break;
						}
					});
					if (clientB !== null) {
						BattleServer.battles.push({
							clientA : clientA,
							clientB : clientB,
							seed : Math.random() * 10000000000000000
						});
						BattleServer.send({
							action : "begin",
							team : 0
						}, clientA);
						BattleServer.send({
							action : "begin",
							team : 1
						}, clientB);
					}
				} else {
					BattleServer.clients.forEach(function (client) {
						if (client !== from)
							BattleServer.send({
								action : "invitation",
								from : client
							});
					});
				}
				break;
			case "actions":
				BattleServer.battles.forEach(function (battle) {
					if (battle.clientA === from) {
						BattleServer.send({
							action : "actions",
							actions : message.actions
						}, clientB);
						break;
					} else if (battle.clientB === from) {
						BattleServer.send({
							action : "actions",
							actions : message.actions
						}, clientA);
						break;
					}
				});
				break;
		}
	},
	send : function (message, to) {
		to.socket.send(JSON.stringify([56, message]).slice(1, -1));
	}
};