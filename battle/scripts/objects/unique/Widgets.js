Widgets = {};

Widgets.FlowGrid = {
	templates : {
		pokemon : FlowCellTemplate({
			size : {
				width : 80,
				height : 80
			},
			draw : function (context, poke, position, size, state) {
				switch (state) {
					case "drag":
					case "action":
					case "hover":
						context.fillStyle = "hsl(0, 0%, 35%)";
						break;
					default:
						context.fillStyle = "hsl(0, 0%, 30%)";
						break;
				}
				context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
				context.fillStyle = "hsl(0, 0%, 60%)";
				context.textAlign = "center";
				// Name
				context.textBaseline = "bottom";
				context.setFontHD("Arial", 10);
				context.fillTextHD(poke.name(), position.x + size.width / 2, position.y + size.height - 4);
				// Level
				context.textBaseline = "top";
				context.setFontHD("Arial", 8);
				context.fillTextHD("Lv. " + poke.level, position.x + size.width / 2, position.y + 4);
				// Health
				var radius, startAngle = 3 / 4 * Math.PI, endAngle;
				var percentageHealth = poke.health / poke.maximumHealth();
				radius = { outer : 22, inner : 19 };
				endAngle = startAngle + percentageHealth * 2 * Math.PI;
				context.fillStyle = (percentageHealth > 0.5 ? "hsl(110, 100%, 40%)" : percentageHealth > 0.2 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)");
				context.beginPath();
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.inner, 2 * Math.PI - startAngle, 2 * Math.PI - endAngle, true);
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.outer, 2 * Math.PI - endAngle, 2 * Math.PI - startAngle, false);
				context.fill();
				// Experience
				var percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
				radius = { outer : 17, inner : 15 };
				endAngle = startAngle + percentageExperience * 2 * Math.PI;
				context.fillStyle = poke.health > 0 ? "hsl(190, 100%, 50%)" : "hsl(190, 0%, 50%)";
				context.beginPath();
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.inner, 2 * Math.PI - startAngle, 2 * Math.PI - endAngle, true);
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.outer, 2 * Math.PI - endAngle, 2 * Math.PI - startAngle, false);
				context.fill();
				// Icon
				var icon = Sprite.load(poke.paths.icon(true));
				if (icon) {
					context.imageSmoothingEnabled = false;
					context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width) / 2, position.y + (size.height - icon.height) / 2);
					context.imageSmoothingEnabled = true;
				}
			}
		})
	}
};

Widgets.Party = {
	interface : FlowGrid({
		template : Widgets.FlowGrid.templates.pokemon,
		datasource : [],
		rows : 1,
		columns : 6,
		contrainToBounds : true,
		selection : "none",
		margin : {
			x : 8,
			y : 8
		},
		spacing : {
			x : 8,
			y : 8
		},
		events : {
		},
		draw : function (context, size, region) {
			context.fillStyle = "hsl(0, 0%, 20%)";
			context.fillRoundedRectHD(region.origin.x, region.origin.y, region.size.width, region.size.height, 4);
		}
	})
};

document.body.appendChild(Widgets.Party.interface.canvas);