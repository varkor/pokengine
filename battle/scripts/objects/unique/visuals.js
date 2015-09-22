Lighting = {
	shadows : {
		opacity : function () {
			switch (Weather.weather) {
				case "clear skies":
				case "diamond dust":
					return 0.3;
				case "intense sunlight":
					return 0.5;
				case "rain":
				case "hail":
				case "sandstorm":
					return 0.15;
				case "fog":
					return 0.1;
				case "shadowy aura":
					return 0.4;
			}
		}
	}
};

Weather = {
	weather : "clear skies",
	time : 1,
	skyHeight : 64,
	particles : {
		all : [],
		maximum : 100,
		add : function () {
			var width = Battle.canvas.width, height = Battle.canvas.height, appearFromTop = true;
			var particle = {
				type : Weather.weather,
				position : {
					x : null,
					y : 0
				},
				velocity : {
					speed : random(5, 8),
					direction : (1 / 2) * Math.PI + (Math.PI / 32) * random(-1, 1)
				},
				landed : null,
				calc : {
					cos : null,
					sin : null
				}
			};
			switch (particle.type) {
				case "rain":
					particle.size = particle.velocity.speed * 4;
					break;
				case "hail":
					particle.size = random(1, 2);
					break;
				case "sandstorm":
					particle.size = random(1, 2);
					particle.velocity = {
						speed : random(10, 16),
						direction : (0 / 2) * Math.PI + (Math.PI / 32) * random(-1, 1)
					};
					appearFromTop = false;
					break;
				case "diamond dust":
					particle.size = random(4, 8);
					particle.velocity.speed = random(1, 2);
					break;
			}
			particle.calc = {
				cos : Math.cos(particle.velocity.direction),
				sin : Math.sin(particle.velocity.direction)
			};
			if (appearFromTop) {
				var horizontalTravelling = particle.calc.cos * (height / particle.calc.sin);
				particle.position.x = random(0 - horizontalTravelling, width + horizontalTravelling);
				particle.position.y = - particle.size;
			} else {
				var verticalTravelling = particle.calc.sin * (width / particle.calc.cos);
				particle.position.x = - particle.size;
				particle.position.y = random(0 - verticalTravelling, height + verticalTravelling);
			}
			Weather.particles.all.push(particle);
			return particle;
		},
		update : function () {
			Weather.time += 1 / 100;
			foreach(Weather.particles.all, function (particle, i, deletion) {
				particle.position.x += particle.calc.cos * particle.velocity.speed;
				particle.position.y += particle.calc.sin * particle.velocity.speed;
				if (particle.landed) {
					if (particle.position.y >= particle.landed) {
						if (particle.velocity.speed >= -0.4)
							particle.velocity.speed = 0;
						else
							particle.velocity.speed = - particle.velocity.speed * 0.8;
					} else
						particle.velocity.speed -= 0.4;
				} else {
					var all = Battle.all(true), position, sprite, ally, overPokemon = (Settings._("particle collision-testing") ? foreach(all, function (poke) {
						ally = (poke.battler.side === Battles.side.near);
						if (!(poke = Display.pokemonInState(poke)))
							return;
						position = Battle.draw.position(poke);
						sprite = Sprite.load(poke.paths.sprite(ally ? "back" : "front"));
						if (sprite && (inRange(particle.position.x, position.x - (Sprite.width / 2) * position.scale, position.x + (Sprite.width / 2) * position.scale) && inRange(particle.position.y, position.y - Sprite.height * position.scale + position.z * (ally ? 1 : -1), position.y + position.z * (ally ? 1 : -1)))) {
							return true;
						}
					}) : false);
					if (particle.type !== "sandstorm" && particle.position.y >= Weather.skyHeight && !overPokemon && chance(Time.framerate / 4)) {
						particle.landed = particle.position.y;
						if (particle.type === "hail") {
							particle.velocity.direction = (3 / 2) * Math.PI;
							particle.velocity.speed *= 0.8;
						} else {
							particle.velocity.speed = 0;
						}
						particle.calc = {
							cos : Math.cos(particle.velocity.direction),
							sin : Math.sin(particle.velocity.direction)
						};
					}
				}
				if (!inRange(particle.position.x, 0 - particle.size, Battle.canvas.width + particle.size) || !inRange(particle.position.y, 0 - particle.size, Battle.canvas.height + particle.size) || (particle.position.y >= particle.landed && particle.velocity.speed === 0))
					deletion.push(i);
			});
		},
		draw : function (context) {
			foreach(Weather.particles.all, function (particle) {
				switch (particle.type) {
					case "rain":
						context.beginPath();
						context.strokeStyle = "hsla(225, 55%, 95%, 0.4)";
						context.lineWidth = 1;
						context.moveTo(particle.position.x - particle.calc.cos * particle.size, particle.position.y - particle.calc.sin * particle.size);
						context.lineTo(particle.position.x + particle.calc.cos * particle.size, particle.position.y + particle.calc.sin * particle.size);
						context.stroke();
						break;
					case "hail":
						context.fillStyle = "hsla(225, 55%, 95%, 0.8)";
						context.fillCircle(particle.position.x, particle.position.y, particle.size);
						break;
					case "sandstorm":
						context.fillStyle = "hsla(" + randomInt(30, 50) + ", " + randomInt(20, 50) + "%, " + randomInt(35, 50) + "%, " + random(0.6, 1) + ")";
						context.fillCircle(particle.position.x, particle.position.y, particle.size);
						break;
					case "diamond dust":
						context.beginPath();
						context.moveTo(particle.position.x, particle.position.y);
						var points = 4, size = particle.size / 2 + (Math.sin(particle.position.y / 3) + 1) / 2 * particle.size / 2;
						for (var i = 0; i < points * 2 + 1; ++ i)
							context.lineTo(particle.position.x + Math.cos(2 * Math.PI / (points * 2) * i) * (i % 2 === 0 ? size : size / 2), particle.position.y + Math.sin(2 * Math.PI / (points * 2) * i) * (i % 2 === 0 ? size : size / 2));
						context.fillStyle = "hsla(225, 0%, 100%, 0.9)";
						context.fill();
						break;
				}
			});
		}
	},
	draw : function (context, weather) {
		if (arguments.length < 2)
			weather = Weather.weather;
		if (["rain", "hail", "sandstorm", "diamond dust"].contains(Weather.weather)) {
			while (Weather.particles.all.length < Weather.particles.maximum && (1 / Weather.time < random()))
				Weather.particles.add();
		}
		Weather.particles.draw(context);
		var overlay;
		switch (weather) {
			case "intense sunlight":
				overlay = "hsla(55, 100%, 60%, 0.15)";
				break;
			case "rain":
			case "hail":
				overlay = "hsla(215, 35%, 45%, 0.4)";
				break;
			case "sandstorm":
				overlay = "hsla(45, 60%, 50%, 0.4)";
				break;
			case "diamond dust":
				overlay = "hsla(215, 0%, 100%, 0.5)";
				break;
			case "fog":
				var gradient = context.createLinearGradient(0, 0, 0, Battle.canvas.height);
				gradient.addColorStop(0, "hsla(215, 5%, 100%, 0.6)");
				gradient.addColorStop(1, "hsla(215, 5%, 60%, 0.8)");
				overlay = gradient;
				break;
			case "shadowy aura":
				var gradient = context.createRadialGradient(Battle.canvas.width / 2, Battle.canvas.height / 4, 0, Battle.canvas.width / 2, Battle.canvas.height / 4, Math.min(Battle.canvas.width, Battle.canvas.height) * 0.65);
				gradient.addColorStop(0, "hsla(280, 60%, 30%, 0.4)");
				gradient.addColorStop(1, "hsla(280, 0%, 0%, 0.80)");
				overlay = gradient;
				break;
		}
		if (overlay) {
			context.fillStyle = overlay;
			context.fillRect(0, 0, Battle.canvas.width, Battle.canvas.height);
		}
	}
};

Particles = {
	all : [],
	create : function (particle, number) {
		/* Particle {x, y, z, image / draw()} */
		if (arguments.length < 2)
			number = 1;
		if (!particle.hasOwnProperty("velocty"))
			particle.velocity = {
				speed : 0,
				direction : 0
			};
		for (var i = 0; i < number; ++ i)
			Particles.all.push(particle);
	}
};