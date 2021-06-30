const inquirer = require("inquirer").createPromptModule();
const Promptlet = require("./Promptlet.js");
Promptlet.inquirer = inquirer;

class PromptSet {
	static inquirer = inquirer;
	static Promptlet = Promptlet;

	constructor() {
		this.set = {};
		this.names = [];
	}

	static chain() {
		return new PromptSet();
	}

	add(set) {
		if(typeof set.name !== "string") throw "Name Property Required (Type: string)";
		if(!this.names.includes(set.name)) this.names.push(set.name);
		else console.log("Overwriting a prompt with an identical name");
		this.set[set.name] = set.constructor.name === PromptSet.constructor.name ? set : new PromptSet(set);
	}

	// Warning: May break prompts that have the removed Promptlet as a prerequisite
	remove(identifier) {
		if(identifier.constructor.name === PromptSet.constructor.name) identifier = identifier.name;
		if(typeof identifier === "string") {
			if(this.names.includes(identifier)) this.names.splice(this.names.indexOf(identifier), 1);
			else console.log("Name not found in set");
		} else console.log("Identifier/Name not found in set");
	}

	start() {
		if(this.names.length === 0) return console.log("Empty PromptSet");
	}
}

module.exports = PromptSet