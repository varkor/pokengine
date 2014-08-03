Client = {
	connected : false,
	socket : null,
	receive : function (message) {
		console.log("%cReceived the following message from the server:", "color : hsl(170, 100%, 40%)", message);
		switch (message.action) {
			case "invitation":
				console.log("%cYou have received an invitation to battle from another player (" + message.from + "):", "color : hsl(170, 100%, 40%)");
				console.log("%cAccepting the invitation to battle...", "color : hsl(170, 100%, 40%)");
				Client.send({
					action : "invite",
					who : message.from
				});
				break;
			case "begin":
				console.log("%cAn online battle has been initialised.", "color : hsl(170, 100%, 40%)");
				var bulbasaur = new pokemon(Pokemon.Bulbasaur), charizard = new pokemon(Pokemon.Charizard), ivysaur = new pokemon(Pokemon.Ivysaur), blastoise = new pokemon(Pokemon.Blastoise);
				var you = new Character("DM"), them = new Character("Jext");
				Game.takePossessionOf(you);
				them.type = Characters.type.online;
				(message.team === 0 ? you : them).give(bulbasaur);
				(message.team === 0 ? you : them).give(charizard);
				(message.team === 0 ? them : you).give(ivysaur);
				(message.team === 0 ? them : you).give(blastoise);
				Battle.beginOnline(message.seed, you, them);
				break;
			case "actions":
				Battle.communication = message.actions;
				if (Battle.stage === 2)
					Battle.giveTrainersActions();
				break;
		}
	},
	send : function (message) {
		if (Client.connected) {
			Client.socket.send(JSON.stringify([56, message]).slice(1, -1));
		} else {
			console.log("%cMessages can't be sent without being connected to the server!", "color : hsl(0, 100%, 40%)");
		}
	},
	connect : function () {
		Client.socket = new WebSocket("ws://pokengine.org:9008/");
		console.log("%cConnecting to the server...", "color : hsl(50, 100%, 40%)");
		Client.socket.addEventListener("open", function () {
			console.log("%cConnected with the server.", "color : hsl(110, 100%, 40%)");
			Client.connected = true;
			Client.send({
				action : "connect"
			});
		});
		Client.socket.addEventListener("close", function () {
			console.log("%cDisconnected from the server.", "color : hsl(0, 100%, 40%)");
			Client.connected = false;
		});
		Client.socket.addEventListener("message", function (event) {
			var data = event.data;
			try {
				data = JSON.parse("[" + event.data + "]");
				if (data[0] === 56) // pokéngine.org's battle "port"
					Client.receive(data[1]);
			} catch (error) {
				console.log("%cReceived a message of an incorrect form from the server:", "color : hsl(0, 100%, 40%)", data);
			};
		});
	}
};