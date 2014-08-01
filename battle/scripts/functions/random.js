srandom = {
	seed : 1,
	point : function () {
		var x = Math.sin(srandom.seed ++) * 1000000;
		return x - Math.floor(x);
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
	chance : function (x) {
		return srandom.int(x - 1) === 0;
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