Lighting = {
	shadows : {
		opacity : function () {
			switch (Weather.weather) {
				case Weathers.clear:
					return 0.3;
				case Weathers.intenseSunlight:
					return 0.5;
				case Weathers.rain:
				case Weathers.hail:
					return 0.15;
			};
		}
	}
};

Weather = {
	weather : Weathers.clear,
	time : 1,
	skyHeight : 64,
	particles : {
		all : [],
		maximum : 100,
		add : function () {
			var width = Game.canvas.element.width, height = Game.canvas.element.height;
			var particle = {
				type : Weather.weather,
				position : {x : null, y : 0},
				velocity : {speed : random(5, 8), direction : (1 / 2) * Math.PI + (Math.PI / 32) * random(-1, 1)},
				landed : null,
				calc : {cos : null, sin : null}
			};
			particle.calc = {cos : Math.cos(particle.velocity.direction), sin : Math.sin(particle.velocity.direction)};
			var horizontalTravelling = particle.calc.cos * (height / particle.calc.sin);
			particle.position.x = random(0 - horizontalTravelling, width + horizontalTravelling);
			switch (particle.type) {
				case Weathers.rain:
					particle.size = particle.velocity.speed * 4;
					break;
				case Weathers.hail:
					particle.size = random(1, 2);
					break;
			}
			particle.position.y = - particle.size;
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
					var all = Battle.all(true), position, sprite, ally, overPokemon = (_(Settings.client, "particle collision-testing") ? foreach(all, function (poke) {
						ally = (poke.battler.side === Battles.side.near);
						if (!(poke = Display.pokemonInState(poke)))
							return;
						position = Battle.draw.position(poke);
						sprite = Sprite.load(poke.sprite.path(ally ? "back" : "front"));
						if (sprite && (inRange(particle.position.x, position.x - (sprite.width / 2) * position.scale, position.x + (sprite.width / 2) * position.scale) && inRange(particle.position.y, position.y - sprite.height * position.scale + position.z * (ally ? 1 : -1), position.y + position.z * (ally ? 1 : -1)))) {
							return true;
						}
					}) : false);
					if (particle.position.y >= Weather.skyHeight && !overPokemon && chance(Time.framerate / 4)) {
						particle.landed = particle.position.y;
						if (particle.type === Weathers.hail) {
							particle.velocity.direction = (3 / 2) * Math.PI;
							particle.velocity.speed *= 0.8;
						} else {
							particle.velocity.speed = 0;
						}
						particle.calc = {cos : Math.cos(particle.velocity.direction), sin : Math.sin(particle.velocity.direction)};
					}
				}
				if (!inRange(particle.position.x, 0 - particle.size, Game.canvas.element.width + particle.size) || !inRange(particle.position.y, 0 - particle.size, Game.canvas.element.height + particle.size) || (particle.position.y >= particle.landed && particle.velocity.speed === 0))
					deletion.push(i);
			});
		},
		draw : function (context) {
			foreach(Weather.particles.all, function (particle) {
				switch (particle.type) {
					case Weathers.rain:
						context.beginPath();
						context.strokeStyle = "hsla(225, 55%, 95%, 0.4)";
						context.strokeWidth = 1;
						context.moveTo(particle.position.x - particle.calc.cos * particle.size, particle.position.y - particle.calc.sin * particle.size);
						context.lineTo(particle.position.x + particle.calc.cos * particle.size, particle.position.y + particle.calc.sin * particle.size);
						context.stroke();
						break;
					case Weathers.hail:
						context.fillStyle = "hsla(225, 55%, 95%, 0.8)";
						context.fillCircle(particle.position.x, particle.position.y, particle.size);
						break;
				}
			});
		}
	},
	draw : function (context, weather) {
		if (arguments.length < 2)
			weather = Weather.weather;
		if ([Weathers.rain, Weathers.hail].contains(Weather.weather)) {
			while (Weather.particles.all.length < Weather.particles.maximum && (1 / Weather.time < random()))
				Weather.particles.add();
		}
		Weather.particles.draw(context);
		Weather.particles.update();
		var overlay;
		switch (weather) {
			case Weathers.intenseSunlight:
				overlay = "hsla(55, 100%, 60%, 0.15)";
				break;
			case Weathers.rain:
			case Weathers.hail:
				overlay = "hsla(215, 35%, 45%, 0.4)";
				break;
		}
		if (overlay) {
			context.fillStyle = overlay;
			context.fillRect(0, 0, Game.canvas.element.width, Game.canvas.element.height);
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