Client = {
	connected : false,
	connecting : false,
	socket : null,
	battle : null,
	receive : function (message) {
		console.log("%cReceived the following message from the server:", "color : hsl(170, 100%, 30%)", message);
		switch (message.action) {
			case "users":
				var users = [];
				if (message.hasOwnProperty("users"))
					users = message.users;
				if (message.hasOwnProperty("user"))
					users.push(message.user);
				foreach(users, function (user) {
					var li, button;
					li = document.createElement("li");
					li.setAttribute("data-user", user.user);
					li.setAttribute("data-ip", user.ip);
					li.innerHTML = user.user;
					button = document.createElement("button");
					button.innerHTML = "Invite";
					button.addEventListener("mousedown", function (event) {
						event.stopPropagation();
						button.innerHTML = "Invited";
						button.disabled = true;
						var pokes = new party();
						pokes.add(new pokemon({species : "Charizard"}));
						pokes.add(new pokemon({species : "Bulbasaur"}));
						Client.send({
							action : "invite",
							who : {
								user : user.user,
								ip : user.ip
							},
							party : pokes.store(),
							bag : [], //? Will also need to send trainer badges, etc.
							settings : {
								style : (document.getElementById("style").value === "double" ? Battles.style.double : Battles.style.normal),
								weather : (Weathers.hasOwnProperty(document.getElementById("weather").value) ? Weathers[document.getElementById("weather").value] : Weathers.clear),
								scene : (Scenes.contains(document.getElementById("scene").value) ? document.getElementById("scene").value : "Clearing")
							}
						});
					});
					li.appendChild(button);
					document.getElementById("users").appendChild(li);
				});
				break;
			case "invitation":
				console.log("%cYou have received an invitation to battle from another player (" + message.from.user + "):", "color : hsl(170, 100%, 30%)");
				var list = document.getElementById("users").childNodes, li, button;
				foreach(list, function (user) {
					if (user.getAttribute("data-ip") === message.from.ip && user.getAttribute("data-user") === message.from.user) {
						li = user;
						return true;
					}
				});
				button = li.childNodes[1];
				li.className = "active";
				button.parentElement.removeChild(button);
				button = document.createElement("button");
				button.innerHTML = "Accept";
				button.addEventListener("mousedown", function (event) {
					event.stopPropagation();
					button.innerHTML = "Accepted";
					button.disabled = true;
					console.log("%cAccepting the invitation to battle...", "color : hsl(170, 100%, 30%)");
					var pokes = new party();
					pokes.add(new pokemon({species : "Blastoise"}));
					pokes.add(new pokemon({species : "Ivysaur"}));
					Client.send({
						action : "accept",
						who : {
							user : message.from.user,
							ip : message.from.ip
						},
						party : pokes.store(),
						bag : []
					});
				})
				li.appendChild(button);
				break;
			case "begin":
				console.log("%cAn online battle has been initialised.", "color : hsl(170, 100%, 30%)");
				srandom.seed = message.seed;
				var you = new character(message.self.user, new party(message.self.party)), them = new character(message.other.user, new party(message.other.party));
				you.bag.items = message.self.bag;
				them.bag.items = message.other.bag;
				Game.takePossessionOf(you);
				you.team = message.team;
				them.team = 1 - message.team;
				them.type = Characters.type.online;
				foreach(document.getElementById("users").childNodes, function (li) {
					li.childNodes[1].disabled = true;
				});
				Client.battle = {
					other : {
						user : message.other.user,
						ip : message.other.ip
					}
				};
				Battle.beginOnline(message.seed, you, them, message.style, message.weather, message.scene);
				//? All pokemon and battle data that is sent should use no magic numbers, only strings or logical values
				//? Replace team with using trainer.unique
				break;
			case "disconnect":
				var list = document.getElementById("users").childNodes;
				foreach(list, function (user) {
					user.childNodes[1].disabled = false;
					if (user.getAttribute("data-ip") === message.who.ip && user.getAttribute("data-user") === message.who.user) {
						user.parentElement.removeChild(user);
					}
				});
				if (Client.battle !== null && Client.battle.other.ip === message.who.ip && Client.battle.other.user === message.who.user) {
					console.log("%cThe other player disconnected from the server!", "color : hsl(0, 100%, 40%)");
					Battle.end(true);
				}
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
	connect : function (as) {
		if (!Client.connected && !Client.connecting) {
			Client.connecting = true;
			Client.socket = new WebSocket("ws://pokengine.org:9008/");
			console.log("%cConnecting to the server...", "color : hsl(50, 100%, 40%)");
			Client.socket.addEventListener("open", function () {
				console.log("%cConnected with the server.", "color : hsl(110, 100%, 40%)");
				Client.connected = true;
				Client.connecting = false;
				var user;
				if (arguments.length > 0)
					user = as;
				else
					user = "anonymous";
				Client.send({
					action : "connect",
					user : as
				});
				document.getElementById("invitations").className = "";
			});
			Client.socket.addEventListener("close", function () {
				console.log("%cDisconnected from the server.", "color : hsl(0, 100%, 40%)");
				Client.connected = false;
				Battle.end(true);
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
			console.log("%cThe client is already " + (Client.connected ? "connected" : "connecting") + " to the server.", "color : hsl(0, 100%, 40%)");
	}
};