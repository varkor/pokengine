exports.BattleServer = {
	clients : [],
	battles : [],
	receive : function (message, from) {
		switch (message.action) {
			case "connect":
				var newcomer = from, others = [];
				newcomer.user = message.user;
				newcomer.invitations = {};
				exports.BattleServer.clients.forEach(function (client) {
					others.push({
						user : client.user,
						ip : client.ip
					});
					exports.BattleServer.send({
						action : "users",
						user : {
							user : newcomer.user,
							ip : newcomer.ip
						}
					}, client);
				});
				exports.BattleServer.clients.push(newcomer);
				exports.BattleServer.send({
					action : "users",
					users : others
				}, newcomer);
				break;
			case "disconnect":
				var index = exports.BattleServer.clients.indexOf(from);
				if (index >= 0)
					exports.BattleServer.clients.splice(index, 1);
				index = -1;
				exports.BattleServer.battles.forEach(function (battle, i) {
					if (battle.clientA === from) {
						index = i;
						return;
					} else if (battle.clientB === from) {
						index = i;
						return;
					}
				});
				if (index >= 0)
					exports.BattleServer.battles.splice(index, 1);
				exports.BattleServer.clients.forEach(function (client) {
					exports.BattleServer.send({
						action : "disconnect",
						who : {
							user : from.user,
							ip : from.ip
						},
					}, client);
				});
				break;
			case "invite":
				if (exports.BattleServer.battleForClient(from) === null) {
					exports.BattleServer.clients.forEach(function (client) {
						if (client !== from && (!message.hasOwnProperty("who") || (client.ip === message.who.ip && client.user === message.who.user)) && !from.invitations.hasOwnProperty(client.user + ":" + client.ip)) {
							exports.BattleServer.send({
								action : "invitation",
								from : {
									user : from.user,
									ip : from.ip
								}
							}, client);
							from.invitations[client.user + ":" + client.ip] = {
								party : message.party,
								bag : message.bag,
								settings : message.settings
							};
						}
					});
				}
				break;
			case "accept":
				if (exports.BattleServer.battleForClient(from) === null) {
					var clientB = from, clientA = null;
					exports.BattleServer.clients.forEach(function (client) {
						if (client !== from && client.ip === message.who.ip && client.user === message.who.user) {
							clientA = client;
							return;
						}
					});
					if (clientA !== null && exports.BattleServer.battleForClient(clientA) === null && clientA.invitations.hasOwnProperty(clientB.user + ":" + clientB.ip)) {
						var storage = clientA.invitations[clientB.user + ":" + clientB.ip], settings = storage.settings, battle = {
							clientA : clientA,
							clientAParty : storage.party,
							clientABag : storage.bag,
							clientB : clientB,
							clientBParty : message.party,
							clientBBag : message.bag,
							seed : Math.random() * Math.pow(2, 32),
							style : settings.style,
							weather : settings.weather,
							scene : settings.scene
						};
						exports.BattleServer.battles.push(battle);
						exports.BattleServer.send({
							action : "begin",
							team : 0,
							self : {
								user : clientA.user,
								ip : clientA.ip,
								party : battle.clientAParty,
								bag : battle.clientABag
							},
							other : {
								user : clientB.user,
								ip : clientB.ip,
								party : battle.clientBParty,
								bag : battle.clientBBag
							},
							seed : battle.seed,
							style : battle.style,
							weather : battle.weather,
							scene : settings.scene
						}, clientA);
						exports.BattleServer.send({
							action : "begin",
							team : 1,
							self : {
								user : clientB.user,
								ip : clientB.ip,
								party : battle.clientBParty
								bag : battle.clientBBag
							},
							other : {
								user : clientA.user,
								ip : clientA.ip,
								party : battle.clientAParty
								bag : battle.clientABag
							},
							seed : battle.seed,
							style : battle.style,
							weather : battle.weather,
							scene : settings.scene
						}, clientB);
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