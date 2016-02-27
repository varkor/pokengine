"use strict";

let Types = {
	"Typeless" : {},
	"Normal" : {
		"weak": ["Rock", "Steel"],
		"ineffective" : ["Ghost"]
	},
	"Fighting" : {
		"strong" : ["Normal", "Rock", "Steel", "Ice", "Dark"],
		"weak" : ["Flying", "Poison", "Bug", "Psychic", "Fairy"],
		"ineffective" : ["Ghost"]
	},
	"Flying" : {
		"strong" : ["Fighting", "Bug", "Grass"],
		"weak" : ["Rock", "Steel", "Electric"]
	},
	"Poison" : {
		"strong" : ["Grass", "Fairy"],
		"weak" : ["Poison", "Ground", "Rock", "Ghost"],
		"ineffective" : ["Steel"]
	},
	"Ground" : {
		"strong" : ["Poison", "Rock", "Steel", "Fire", "Electric"],
		"weak" : ["Bug", "Grass"],
		"ineffective": ["Flying"]
	},
	"Rock" : {
		"strong" : ["Flying", "Bug", "Fire", "Ice"],
		"weak" : ["Fighting", "Ground", "Steel"]
	},
	"Bug" : {
		"strong" : ["Grass", "Psychic", "Dark"],
		"weak" : ["Fighting", "Flying", "Poison", "Ghost", "Steel", "Fire", "Fairy"]
	},
	"Ghost" : {
		"strong" : ["Ghost", "Psychic"],
		"weak" : ["Dark"],
		"ineffective" : ["Normal"]
	},
	"Steel" : {
		"strong" : ["Rock", "Ice", "Fairy"],
		"weak" : ["Steel", "Fire", "Water", "Electric"]
	},
	"Fire" : {
		"strong" : ["Bug", "Steel", "Grass", "Ice"],
		"weak" : ["Rock", "Fire", "Water", "Dragon"]
	},
	"Water" : {
		"strong" : ["Ground", "Rock", "Fire"],
		"weak" : ["Water", "Grass", "Dragon"]
	},
	"Grass" : {
		"strong" : ["Ground", "Rock", "Water"],
		"weak" : ["Flying", "Poison", "Bug", "Steel", "Fire", "Grass", "Dragon"]
	},
	"Electric" : {
		"strong" : ["Flying", "Water"],
		"weak" : ["Grass", "Electric", "Dragon"],
		"ineffective" : ["Ground"]
	},
	"Psychic" : {
		"strong" : ["Fighting", "Poison"],
		"weak" : ["Steel", "Psychic"],
		"ineffective" : ["Dark"]
	},
	"Ice" : {
		"strong" : ["Flying", "Ground", "Grass", "Dragon"],
		"weak" : ["Steel", "Fire", "Water", "Ice"]
	},
	"Dragon" : {
		"strong" : ["Dragon"],
		"weak" : ["Steel"],
		"ineffective" : ["Fairy"]
	},
	"Dark" : {
		"strong" : ["Ghost", "Psychic"],
		"weak" : ["Fighting", "Dark", "Fairy"]
	},
	"Fairy" : {
		"strong" : ["Fighting", "Dragon", "Dark"],
		"weak" : ["Poison", "Steel", "Fire"]
	}
};