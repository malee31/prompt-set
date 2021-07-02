const inquirer = require("inquirer").createPromptModule();
const Promptlet = require("./Promptlet.js");
Promptlet.inquirer = inquirer;

class PromptSet {
	static inquirer = inquirer;
	static Promptlet = Promptlet;

	constructor() {
		this.set = {};
		this.names = [];
		this.satisfied = false;
	}

	static chain() {
		return new PromptSet();
	}

	add(set) {
		if(set.constructor.name !== PromptSet.Promptlet.name) throw "PromptSet.add() Only Accepts Promptlets";

		if(!this.names.includes(set.name)) this.names.push(set.name);
		else console.log("Overwriting a prompt with an identical name");

		this.set[set.name] = set;
		return this;
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
		return inquirer({
			type: "list",
			name: "PromptletSelected",
			message: "Choose a prompt to answer",
			choices: this.names.map(val => {
				const set = this.set[val];
				return {
					name: `${set.satisfied ? "✔ " : ""}${this.set[val].optionName}`,
					value: val
				};
			})
		})
	}
}

module.exports = PromptSet