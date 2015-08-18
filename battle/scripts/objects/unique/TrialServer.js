/*
	An object used to test out multiplayer battles, locally
*/
TrialServer = {
	begin : function () {
		// Initialise the Supervisor
		Supervisor.send = function (party, message, data, identifier) {
			TrialServer.send(party, message, data, identifier);
		};
		// Initialise the Relay
		Relay.identification = 3;
		Relay.pass = function (message, data, identifier) {
			TrialServer.pass(message, data, identifier);
		};
	},
	send : function (party, message, data, identifier) {
		TrialServer.print("Supervisor is sending a message (\"" + message + "\") to Relay.");
		if (message === "initiate") {
			data.callback = function (flags, trainers) {
				TrialServer.print("Relay battle ended with flags:", flags," and trainers:", trainers);
			};
		}
		Relay.receive(message, data, identifier);
	},
	pass : function (message, data, identifier) {
		TrialServer.print("Relay is sending a message (\"" + message + "\") to Supervisor.");
		if (message === "relay") {
			var response = Supervisor.receive(message, {
				party : null, // TrialServer only supports one client at the moment
				team : 3,
				data : data
			}, identifier);
			if (!response.success) {
				TrialServer.warn("The Supervisor responded with an error: " + response.reason, response);
			}
		} else if (message !== "sync") {
			TrialServer.warn("The client attempted to send a message with the `message` parameter equal to `" + message + "`.");
		}
	},
	print : function (message) {
		console.log(message);
	},
	warn : function (message) {
		var args = [];
		foreach(arguments, function (arg) {
			args.push(arg);
		});
		if (args.length > 2) {
			console.warn(message, args.slice(1));
		} else if (args.length === 2) {
			console.warn(message, args[1]);
		} else {
			console.warn(message);
		}
		
	},
	generate : {
		playerTeam : function () {
			Game.takePossessionOf(new trainer({
				"name" : document.querySelector("#name").value,
				"class" : "Pokémon Trainer",
				"individual" : true,
				"game" : "B2W2",
				"party" : Interface.buildParty(),
				"money" : 10000
			}));
			Game.player.bag.add("Key Stones => Mega Bracelet");
			Game.player.bag.add("Balls => Master");
			Game.player.bag.add("Berries => Sitrus");
			return {
				type : Trainers.type.online,
				trainer : Game.player.store()
			};
		},
		wildTeam : function () {
			return {
				type : Trainers.type.NPC,
				trainer : new trainer({
					identification : 0, // Wild Pokémon
					party : [new pokemon({
						species : "Charizard (Nintendo)",
						level : 45,
						moves : [{ move : "Tackle" }]
					})]
				}).store()
			};
		},
		NPCTeam : function () {
			return {
				type : Trainers.type.NPC,
				trainer : new trainer({
					"name" : "Roger",
					"class" : "Ace Trainer",
					"game" : "B2W2",
					"pressure speech" : "You should never have gotten your hopes up!",
					"defeat speech" : "So... this is what defeat tastes like...",
					"party" : [
						new pokemon({
							species : "Charizard (Nintendo)",
							level : 100,
							shiny : true,
							moves : [{
								move : "Tackle"
							}],
						}), new pokemon({
							species : "Charizard (Nintendo)",
							level : 1
						})
					]
				}).store()
			};
		}
	},
	trigger : {
		battle : function (teamA, teamB) {
			var response = Supervisor.receive("initiate", {
				parties : [null],
				data : {
					teamA : teamA,
					teamB : teamB,
					seed : 1,
					parameters : Interface.buildSettings()
				},
				rules : {
					clauses : []
				},
				callback : function (flags, trainers) {
					TrialServer.print("Supervisor battle ended with flags:", flags," and trainers:", trainers);
				}
			});
			if (!response.success) {
				TrialServer.warn("The Supervisor responded with an error:", response);
				return false;
			} else {
				return true;
			}
		},
		wildBattle : function () {
			if (TrialServer.trigger.battle(TrialServer.generate.playerTeam(), TrialServer.generate.wildTeam())) {
				TrialServer.print("Initialised a new server wild battle.");
			}
		},
		NPCBattle : function () {
			if (TrialServer.trigger.battle(TrialServer.generate.playerTeam(), TrialServer.generate.NPCTeam())) {
				TrialServer.print("Initialised a new server trainer battle.");
			}
		}
	}
};