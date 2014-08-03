exports.Server = {
	active : false,
	socket : null,
	clients : [],
	receive : function (message, from) {
		console.log("%cReceived the following message from a client (" + from.ip + "):", "color : hsl(170, 100%, 40%)", message);
		switch (message.action) {
			case "connect":
				from.battling = true;
				break;
		}
	},
	send : function (message, to) {
		if (exports.Server.active) {
			to.socket.send(JSON.stringify([56, message]).slice(1, -1));
		} else {
			console.log("%cMessages can't be sent when the server isn't active!", "color : hsl(0, 100%, 40%)");
		}
	},
	start : function (delegate) {
		if (!delegate) {
			exports.Server.socket = new WebSocket({
				port : 9876
			});
			delegate = exports.Server.socket;
		}
		exports.Server.active = true;
		delegate.on("connection", function (socket) {
			var client = {
				socket : socket,
				ip : socket.upgradeReq.connection.remoteAddress,
				battling : false
			};
			console.log("%cA client (" + client.ip + ") connected to the server.", "color : hsl(110, 100%, 40%)");
			exports.Server.clients.push(client);
			socket.on("close", function (socket) {
				console.log("%cA client (" + client.ip + ") Disconnected from the server.", "color : hsl(0, 100%, 40%)");
				for (var i = 0; i < exports.Server.clients.length; ++ i) {
					if (exports.Server.clients[i] === client) {
						exports.Server.clients.splice(i, 1);
						break;
					}
				}
			});
		});
	}
};