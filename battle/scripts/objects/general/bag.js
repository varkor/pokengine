"use strict";

function bag (items) {
	var self = this;

	if (arguments.length >= 1) {
		self.items = JSONCopy(items);
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
		return JSONCopy(store);
	};

	self.usableItems = function (direct) {
		return self.items.filter(function (item) {
			return (item.quantity - item.intentToUse > 0) && (!direct || Items._(item.item).direct);
		});
	};

	self.add = function (item, quantity) {
		// Returns whether adding the item to the bag was successful. This should be the case as long as the item is one that actually exists.
		if (Items._(item + "?")) {
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
					intentToUse : 0 // When the player selects "Use item" in their bag, it should count an item as having being used even before it has been, so that a player cannot try to use the same item twice in a single turn, during a battle
				});
			return true;
		}
		return false;
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

	self.give = function (index, poke) {
		var item = self.items[index], taken = null;
		self.remove(index);
		if (poke.item !== null) {
			taken = self.add(poke.item);
			poke.item = null;
		}
		poke.item = item.item;
		return taken;
	};

	self.has = function (item) {
		return foreach(self.items, function (which) {
			if (which.item === item || (Items._(which.item + " => category?") && Items._(which.item + " => category") === item)) // Whether the exact item was in possession, or an item in the same category
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
		var index = self.indexOfItem(item), item = Items._(self.items[index].item), process = on.trainer.battle.process;
		-- self.items[index].intentToUse;
		if (item.useMessage && !process) {
			Textbox.state(who.pronoun(true) + " used the " + item.fullname + " on " + on.name() + "!");
		}
		self.remove(index);
		if (!process) {
			var displayBefore = Display.state.save();
			Textbox.effect(function () {
				Display.state.load(displayBefore);
			});
		}
		item.effect(item, on, who);
		if (!process) {
			var displayAfter= Display.state.save();
			Textbox.effect(function () {
				Display.state.load(displayAfter);
			});
		}
	};

	self.empty = function () {
		return self.usableItems().length === 0;
	};
}