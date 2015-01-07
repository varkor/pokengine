function bag (items) {
	var self = this;

	if (arguments.length >= 1) {
		self.items = items;
		foreach(self.items, function (item) {
			item.intentToUse = 0;
		});
	} else
		self.items = [];

	self.store = function () {
		var store = [];
		foreach(self.items, function (item) {
			store.push({
				item : item.item,
				quantity : item.quantity
			});
		});
		return store;
	};

	self.usableItems = function () {
		return self.items.filter(function (item) {
			return item.quantity - item.intentToUse > 0;
		});
	};

	self.add = function (item, quantity) {
		if (arguments.length < 2)
			quantity = 1;
		if (!foreach(self.items, function (which) {
			if (which.item === item) {
				which.quantity += quantity;
				return true;
			}
		}))
			self.items.push({
				item : item,
				quantity : quantity,
				intentToUse : 0 // When the player selects "Use item" in their bag, it should count an item as having being used even before it has been
			});
	};

	self.remove = function (item, quantity) {
		if (arguments.length < 2)
			quantity = 1;
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		self.items[index].quantity -= quantity;
		if (self.items[index].quantity <= 0)
			self.items.remove(index);
	};

	self.toss = function (item) {
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		self.items.remove(index);
	};

	self.has = function (item) {
		return foreach(self.items, function (which, i) {
			if (which.item === item)
				return true;
		});
	};

	self.indexOfItem = function (item) {
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		return index;
	};

	self.intendToUse = function (item, quantity) {
		if (arguments.length < 2)
			quantity = 1;
		self.items[self.indexOfItem(item)].intentToUse += quantity;
	};

	self.use = function (item, on, who) {
		var index = self.indexOfItem(item), item = Items._(self.items[index].item);
		-- self.items[index].intentToUse;
		if (item.useMessage)
			Textbox.state(who.pronoun(true) + " used the " + item.fullname + " on " + on.name() + "!");
		item.effect(item, on, who);
		self.remove(index);
	};

	self.empty = function () {
		return self.usableItems().length === 0;
	};
}