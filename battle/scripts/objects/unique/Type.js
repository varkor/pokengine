Type = {
	string : function (which) {
		var name;
		forevery(Types, function (type, key) {
			if (which === type) {
				name = key;
				return true;
			}
		});
		return name;
	},
	effectiveness : {
		normal : {
			weak: [Types.rock, Types.steel],
			ineffective : [Types.ghost]
		},
		fighting : {
			strong : [Types.normal, Types.rock, Types.steel, Types.ice, Types.dark],
			weak : [Types.flying, Types.poison, Types.bug, Types.psychic, Types.fairy],
			ineffective : [Types.ghost]
		},
		flying : {
			strong : [Types.fighting, Types.bug, Types.grass],
			weak : [Types.rock, Types.steel, Types.electric]
		},
		poison : {
			strong : [Types.grass, Types.fairy],
			weak : [Types.poison, Types.ground, Types.rock, Types.ghost],
			ineffective : [Types.steel]
		},
		ground : {
			strong : [Types.poison, Types.rock, Types.steel, Types.fire, Types.electric],
			weak : [Types.bug, Types.grass],
			ineffective: [Types.flying]
		},
		rock : {
			strong : [Types.flying, Types.bug, Types.fire, Types.ice],
			weak : [Types.fighting, Types.ground, Types.steel]
		},
		bug : {
			strong : [Types.grass, Types.psychic, Types.dark],
			weak : [Types.fighting, Types.flying, Types.poison, Types.ghost, Types.steel, Types.fire, Types.fairy]
		},
		ghost : {
			strong : [Types.ghost, Types.psychic],
			weak : [Types.dark],
			ineffective : [Types.normal]
		},
		steel : {
			strong : [Types.rock, Types.ice, Types.fairy],
			weak : [Types.steel, Types.fire, Types.water, Types.electric]
		},
		fire : {
			strong : [Types.bug, Types.steel, Types.grass, Types.ice],
			weak : [Types.rock, Types.fire, Types.water, Types.dragon]
		},
		water : {
			strong : [Types.ground, Types.rock, Types.fire],
			weak : [Types.water, Types.grass, Types.dragon]
		},
		grass : {
			strong : [Types.ground, Types.rock, Types.water],
			weak : [Types.flying, Types.poison, Types.bug, Types.steel, Types.fire, Types.grass, Types.dragon]
		},
		electric : {
			strong : [Types.flying, Types.water],
			weak : [Types.grass, Types.electric, Types.dragon],
			ineffective : [Types.ground]
		},
		psychic : {
			strong : [Types.fighting, Types.poison],
			weak : [Types.steel, Types.psychic],
			ineffective : [Types.dark]
		},
		ice : {
			strong : [Types.flying, Types.ground, Types.grass, Types.dragon],
			weak : [Types.steel, Types.fire, Types.water, Types.ice]
		},
		dragon : {
			strong : [Types.dragon],
			weak : [Types.steel],
			ineffective : [Types.fairy]
		},
		dark : {
			strong : [Types.ghost, Types.psychic],
			weak : [Types.fighting, Types.dark, Types.fairy]
		},
		fairy : {
			strong : [Types.fighting, Types.dragon, Types.dark],
			weak : [Types.poison, Types.steel, Types.fire]
		}
	}
};
var table = [];
forevery(Types, function (type, key) {
	if (Type.effectiveness.hasOwnProperty(key))
		table[type] = Type.effectiveness[key];
	else
		table[type] = {};
});
Type.effectiveness = table;