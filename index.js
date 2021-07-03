const inquirer = require("inquirer").createPromptModule();
const Promptlet = require("./Promptlet.js");
Promptlet.inquirer = inquirer;

class PromptSet {
	static inquirer = inquirer;

	static Promptlet(...args) {
		return new Promptlet(...args);
	}

	static chain() {
		return new PromptSet();
	}

	constructor() {
		this.set = {};
		this.names = [];
		this.default = 0;
		this.satisfied = false;
		this.autoclear = true;
	}

	add(set) {
		if(set.constructor.name !== PromptSet.Promptlet.name) throw "PromptSet.add() only accepts 'Promptlet' instances";

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
		} else console.log("Identifier must be a 'string' or 'Promptlet' instance");
	}

	clear() {
		if(this.autoclear) console.clear();
	}

	isSatisfied() {
		for(const key of this.names) {
			if(!this.set[key].satisfied) return false;
		}

		return true;
	}

	start() {
		if(this.names.length === 0) return console.log("Empty PromptSet");
		return new Promise(async resolve => {
			while(!this.isSatisfied()) {
				const chosenPromptlet = await this.selectPromptlet();
				if(chosenPromptlet.satisfied) continue;

				await chosenPromptlet.execute();
				this.clear();
			}
			resolve(this.reduce());
		});
	}

	async selectPromptlet() {
		const chosenPrompt = await inquirer({
			type: "list",
			name: "PromptletSelected",
			default: this.default,
			message: "Choose a prompt to answer",
			choices: this.names.map(val => {
				const set = this.set[val];
				return {
					name: `${set.satisfied ? "✔ " : ""}${this.set[val].optionName}`,
					value: val
				};
			})
		});
		this.default = chosenPrompt["PromptletSelected"];

		this.clear();
		return this.set[this.default];
	}

	reduce() {
		return this.names.reduce((acc, val) => {
			const selectedSet = this.set[val];
			acc[selectedSet.name] = selectedSet.value;
			return acc;
		}, {});
	}

	toString() {
		return JSON.stringify(this.reduce());
	}
}

module.exports = PromptSet;