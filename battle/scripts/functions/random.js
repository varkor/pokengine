srandom = {
	seed : 1,
	point : function () {
		var x = Math.sin(srandom.seed = srandom.increase(srandom.seed)) * 1000000;
		return x - Math.floor(x);
	},
	increase : function (value) {
		var jump = 1;
		while (value === (value += jump) && jump < Math.pow(10, 10)) {
			if (jump >= Math.pow(10, 2))
				jump *= 10;
			else
				++ jump;
		}
		return value;
	},
	number : function (x, y) {
		var point = srandom.point();
		if (arguments.length === 0)
			return point;
		if (arguments.length === 1)
			return point * x;
		else if (arguments.length === 2)
			return Math.min(x, y) + point * Math.abs(x - y);
	},
	int : function (x, y) {
		if (arguments.length === 1)
			return Math.round(srandom.number(x));
		else if (arguments.length === 2)
			return Math.round(srandom.number(x, y));
	},
	chance : function (x, y) {
		if (arguments.length === 1)
			return srandom.int(x - 1) === 0;
		else
			return srandom.int(y - 1) <= x - 1;
	},
	percentage : function (x) {
		return srandom.int(0, 100) <= x;
	},
	choose : function () {
		return arguments[srandom.int(arguments.length - 1)];
	},
	chooseFromArray : function (array) {
		return array[srandom.int(array.length - 1)];
	},
	chooseWeighted : function () {
		var r = srandom.point(), accumulator = 0;
		for (var i = 0, choice; i < arguments.length; ++ i) {
			choice = arguments[i];
			if (r <= (accumulator += choice.probability)) {
				return choice.value;
			}
		}
	}
};