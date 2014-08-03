Client = {
	connected : false,
	socket : null,
	receive : function (message) {
		console.log("%cReceived the following message from the server:", "color : hsl(170, 100%, 30%)", message);
		switch (message.action) {
			case "invitation":
				console.log("%cYou have received an invitation to battle from another player (" + message.from + "):", "color : hsl(170, 100%, 30%)");
				console.log("%cAccepting the invitation to battle...", "color : hsl(170, 100%, 30%)");
				Client.send({
					action : "invite",
					who : message.from
				});
				break;
			case "begin":
				console.log("%cAn online battle has been initialised.", "color : hsl(170, 100%, 30%)");
				srandom.seed = message.seed;
				var bulbasaur = new pokemon(Pokemon.Bulbasaur), charizard = new pokemon(Pokemon.Charizard), ivysaur = new pokemon(Pokemon.Ivysaur), blastoise = new pokemon(Pokemon.Blastoise);
				var you = new character((message.team === 0 ? "DM" : "Jext")), them = new character((message.team === 0 ? "Jext" : "DM"));
				Game.takePossessionOf(you);
				you.team = message.team;
				them.team = 1 - message.team;
				them.type = Characters.type.online;
				(message.team === 0 ? you : them).give(bulbasaur);
				(message.team === 0 ? you : them).give(charizard);
				(message.team === 0 ? them : you).give(ivysaur);
				(message.team === 0 ? them : you).give(blastoise);
				Battle.beginOnline(message.seed, you, them);
				break;
			case "disconnect":
				console.log("%cThe other player disconnected from the server!", "color : hsl(0, 100%, 40%)");
				if (Battle.active)
					Battle.end();
			case "actions":
				Battle.receiveActions(message.actions);
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
		if (!Client.connected) {
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
				if (Battle.active)
					Battle.end();
			});
			Client.socket.addEventListener("message", function (event) {
				var data = event.data;
				try {
					data = JSON.parse("[" + event.data + "]");
				} catch (error) {
					console.log("%cReceived a message of an incorrect form from the server:", "color : hsl(0, 100%, 40%)", data, error);
					return;
				};
				if (data[0] === 56) // pokéngine.org's battle "port"
					Client.receive(data[1]);
			});
		} else
			console.log("%cThe client is already connected to the server.", "color : hsl(0, 100%, 40%)");
	}
};