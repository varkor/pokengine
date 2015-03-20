exports.BattleServer = {
	Settings : {
		"silently resolve rule exceptions" : true // Whether, if a client sends a party, etc. which breaks some of the set rules, BattleServer should just attempt to align the data with the rules, or whether it should send a warning message back to the client
	},
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
					if (battle.clientA.client === from) {
						index = i;
						return;
					} else if (battle.clientB.client === from) {
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
					if (exports.BattleServer.validateForRules(from, message.trainer, message.settings.rules, message.reference)) {
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
									trainer : message.trainer,
									settings : message.settings
								};
							}
						});
					}
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
						var storage = clientA.invitations[clientB.user + ":" + clientB.ip];
						if (exports.BattleServer.validateForRules(from, message.trainer, storage.settings.rules, message.reference)) {
							var battle = {
								clientA : {
									client : clientA,
									trainer : storage.trainer
								},
								clientB : {
									client : clientB,
									trainer : message.trainer
								},
								seed : Math.random() * Math.pow(2, 32),
								settings : storage.settings
							};
							exports.BattleServer.battles.push(battle);
							var clientAInfo = {
								user : battle.clientA.client.user,
								ip : battle.clientA.client.ip,
								trainer : battle.clientA.trainer
							}, clientBInfo = {
								user : battle.clientB.client.user,
								ip : battle.clientB.client.ip,
								trainer : battle.clientB.trainer
							};
							exports.BattleServer.send({
								action : "begin",
								team : 0,
								self : clientAInfo,
								other : clientBInfo,
								seed : battle.seed,
								settings : battle.settings
							}, clientA);
							exports.BattleServer.send({
								action : "begin",
								team : 1,
								self : clientBInfo,
								other : clientAInfo,
								seed : battle.seed,
								settings : battle.settings
							}, clientB);
						}
					}
				}
				break;
			case "reject":
				exports.BattleServer.clients.forEach(function (client) {
					if (client !== from && client.ip === message.who.ip && client.user === message.who.user) {
						delete client.invitations[from.user + ":" + from.ip];
						exports.BattleServer.send({
							action : "reject",
							who : {
								user : from.user,
								ip : from.ip
							}
						}, client);
						return true;
					}
				});
				break;
			case "actions":
				exports.BattleServer.battles.forEach(function (battle) {
					if (battle.clientA.client === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, battle.clientB.client);
						return;
					} else if (battle.clientB.client === from) {
						exports.BattleServer.send({
							action : "actions",
							actions : message.actions
						}, battle.clientA.client);
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
		if (!message.hasOwnProperty("reference"))
			message.reference = (new Date());
		to.send(JSON.stringify([56, message]).slice(1, -1));
		return message.reference;
	},
	validateForRules : function (client, trainer, rules, reference) {
		var valid = true;
		if (trainer.party.length === 0) {
			valid = false;
			exports.BattleServer.send({
				action : "issue",
				message : "You haven't got any Pokémon!",
				reference : reference
			}, client);
			return;
		}
		for (var rule in rules) {
			var setting = rules[rule];
			switch (rule) {
				case "levels":
					switch (setting) {
						case "any":
							// No validation or changes are needed with this setting
							break;
						case "flatten: 50":
							trainer.party.forEach(function (poke) {
								var obj = new pokemon(poke);
								poke.level = 50;
								poke.health = obj.maximumHealth();
								poke.experience = 0;
							});
							break;
						case "flatten: 100":
							trainer.party.forEach(function (poke) {
								var obj = new pokemon(poke);
								poke.level = 100;
								poke.health = obj.maximumHealth();
								poke.experience = 0;
							});
							break;
					}
					break;
				case "party":
					switch (setting) {
						case "up to: 6":
							// No validation or changes are needed with this setting
							break;
						case "up to: 3":
							if (trainer.party.length > 3) {
								if (exports.BattleServer.Settings["silently resolve rule exceptions"]) {
									// Use the first 3 Pokémon in the party
									trainer.party = trainer.party.slice(0, 3);
								} else {
									valid = false;
									exports.BattleServer.send({
										action : "issue",
										message : "Only 3 Pokémon are allowed, but you have " + trainer.party.length + "!",
										reference : reference
									}, client);
								}
							}
							break;
						case "solo":
							if (trainer.party.length > 1) {
								if (exports.BattleServer.Settings["silently resolve rule exceptions"]) {
									// Use the first 3 Pokémon in the party
									trainer.party = trainer.party.slice(0, 1);
								} else {
									valid = false;
									exports.BattleServer.send({
										action : "issue",
										message : "Only one Pokémon is allowed, but you have " + trainer.party.length + "!",
										reference : reference
									}, client);
								}
							}
							break;
					}
					break;
				case "items":
					// This rule is handled by the battle system
					break;
			}
		}
		return valid;
	},
	battleForClient : function (client) {
		var which = null;
		exports.BattleServer.battles.forEach(function (battle) {
			if (battle.clientA.client === client || battle.clientB.client === client) {
				which = battle;
				return;
			}
		});
		return which;
	}
};