Client = {
	connected : false,
	socket : null,
	receive : function (message) {
		console.log("%cReceived the following message from the server:", "color:hsl(170, 100%, 40%)", message);
	},
	send : function (message) {
		if (Client.connected) {
			Client.socket.send(JSON.stringify([56, message]).slice(1, -1));
		} else {
			console.log("%cMessages can't be sent without being connected to the server!", "color:hsl(0, 100%, 40%)");
		}
	},
	connect : function () {
		Client.socket = new WebSocket("ws://pokengine.org:9876/");
		console.log("%cConnecting to the server...", "color:hsl(50, 100%, 40%)");
		Client.socket.addEventListener("open", function () {
			console.log("%cConnected with the server.", "color:hsl(110, 100%, 40%)");
			Client.connected = true;
		});
		Client.socket.addEventListener("close", function () {
			console.log("%cDisconnected from the server.", "color:hsl(0, 100%, 40%)");
			Client.connected = false;
		});
		Client.socket.addEventListener("message", function (event) {
			var data = event.data;
			try {
				data = JSON.parse("[" + event.data + "]");
				if (data[0] === 56) // pokéngine.org's battle "port"
					Client.receive(data[1]);
			} catch (error) {
				console.log("%cReceived a message of an incorrect form from the server:", "color:hsl(0, 100%, 40%)", data);
			};
		});
	}
};