Server = {
	active : false,
	socket : null,
	clients : [],
	receive : function (message, from) {
		console.log("%cReceived the following message from a client (" + from.ip + "):", "color:hsl(170, 100%, 40%)", message);
	},
	send : function (message, to) {
		if (Server.active) {
			to.socket.send(JSON.stringify([56, message]).slice(1, -1));
		} else {
			console.log("%cMessages can't be sent when the server isn't active!", "color:hsl(0, 100%, 40%)");
		}
	},
	start : function (delegate) {
		if (!delegate) {
			Server.socket = new WebSocket({
				port : 9876
			});
			delegate = Server.socket;
		}
		Server.active = true;
		delegate.addEventListener("connection", function (socket) {
			var client = {
				socket : socket,
				ip : socket.upgradeReq.connection.remoteAddress
			};
			console.log("%cA client (" + ip + ") connected to the server.", "color:hsl(110, 100%, 40%)");
			Server.clients.push(client);
			socket.addEventListener("message", function (data) {
				var data = event.data;
				try {
					data = JSON.parse("[" + event.data + "]");
					if (data[0] === 56) // pokéngine.org's battle "port"
						Server.receive(data[1], client);
				} catch (error) {
					console.log("%cReceived a message of an incorrect form from a client (" + client.ip + "):", "color:hsl(0, 100%, 40%)", data);
				};
			});
			socket.addEventListener("close", function (socket) {
				console.log("%cA client (" + client.ip + ") Disconnected from the server.", "color:hsl(0, 100%, 40%)");
				Server.clients.removeElementsOfValue(client);
			});
		});
	}
};