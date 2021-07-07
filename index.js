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
		if(set.constructor.name !== Promptlet.name) throw "PromptSet.add() only accepts 'Promptlet' instances";

		if(this.names.includes(set.name)) {
			console.warn("Overwriting a prompt with an identical name");
			this.remove(set.name);
		}

		this.names.push(set.name);
		this.set[set.name] = set;
		return this;
	}

	// Warning: May break prompts that have the removed Promptlet as a prerequisite
	remove(identifier) {
		const removed = this.searchSet(identifier);
		delete this.set[removed.name];
		this.names.splice(this.names.indexOf(removed.name), 1);
		return removed;
	}

	searchSet(identifier) {
		if(identifier.constructor.name === Promptlet.name) identifier = identifier.name;
		if(typeof identifier !== "string") throw new Error("Identifier must be a 'string' or 'Promptlet' instance");
		if(this.set[identifier]) return this.set[identifier];
		else throw new Error("Name not found in set");
	}

	addPrerequisite(addToIdentifier, prerequisiteIdentifier) {
		const addTo = this.searchSet(addToIdentifier);
		const addMe = this.searchSet(prerequisiteIdentifier);
		addTo.prerequisites.push(addMe.name);
		return this;
	}

	removePrerequisite(removeFromIdentifier, removeIdentifier) {
		const removeFrom = this.searchSet(removeFromIdentifier);
		const removeMe = this.searchSet(removeIdentifier);
		removeFrom.prerequisites.push(removeMe.name);
		return this;
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

	preSatisfied(chosenPromptlet, silent = false) {
		let preSatisfied = true;
		for(const prerequisite of chosenPromptlet.prerequisites) {
			const pre = this.searchSet(prerequisite);
			if(!pre.satisfied) {
				preSatisfied = false;
				if(!silent) console.log(`Prompt must be answered before this:\n${pre.optionName}`);
				break;
			}
		}
		return preSatisfied;
	}

	start() {
		if(this.names.length === 0) return console.log("Empty PromptSet");
		return new Promise(async resolve => {
			while(!this.isSatisfied()) {
				const chosenPromptlet = await this.selectPromptlet();
				if(chosenPromptlet.satisfied && !chosenPromptlet.editable) {
					this.clear();
					console.log("Prompt Already Answered. (Editing this prompt is disabled)");
					continue;
				}
				if(!this.preSatisfied(chosenPromptlet)) continue;

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
					name: `${set.satisfied ? "✔ " : this.preSatisfied(set, true) ? "○ " : "⛝ "}${this.set[val].optionName}`,
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