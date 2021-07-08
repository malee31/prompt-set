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
		this.previous = undefined;
	}

	/**
	 * Creates a new Promptlet and immediately adds it to the PromptSet
	 * @param {...*} constructorArgs Arguments passed to the Promptlet constructor
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addNew(...constructorArgs) {
		return this.add(PromptSet.Promptlet(...constructorArgs));
	}

	/**
	 * Adds already instantiated Promptlets to the PromptSet
	 * @param {Promptlet} set Promptlet to add to this PromptSet
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	add(set) {
		if(set.constructor.name !== "Promptlet") throw "PromptSet.add() only accepts 'Promptlet' instances";

		if(this.names.includes(set.name)) {
			console.warn("Overwriting a prompt with an identical name");
			this.remove(set.name);
		}

		this.names.push(set.name);
		this.set[set.name] = set;
		this.refreshPrevious(set.name, false);

		return this;
	}

	// Warning: Will break prompts that have the removed Promptlet as a prerequisite
	remove(identifier) {
		const removed = this.searchSet(identifier);

		delete this.set[removed.name];
		this.names.splice(this.names.indexOf(removed.name), 1);
		if(this.previous === removed.name) this.previous = undefined;

		return this;
	}

	addPrerequisite(prerequisiteIdentifier, addToIdentifier) {
		const addMe = this.searchSet(prerequisiteIdentifier);
		const addTo = this.searchSet(this.refreshPrevious(addToIdentifier));

		if(!addTo.prerequisites.includes(addMe.name)) {
			addTo.prerequisites.push(addMe.name);
			addTo.prerequisites.sort();
		}

		return this;
	}

	removePrerequisite(removeIdentifier, removeFromIdentifier) {
		const removeMe = this.searchSet(removeIdentifier);
		const removeFrom = this.searchSet(this.refreshPrevious(removeFromIdentifier));

		if(removeFrom.prerequisites.includes(removeMe.name)) removeFrom.prerequisites.slice(removeFrom.prerequisites.indexOf(removeMe.name));

		return this;
	}

	searchSet(identifier) {
		if(identifier.constructor.name === "Promptlet") identifier = identifier.name;

		if(typeof identifier !== "string") throw new Error("Identifier must be a 'string' or 'Promptlet' instance");
		if(!this.set[identifier]) throw new Error("Name not found in set");

		return this.set[identifier];
	}

	refreshPrevious(newPrevious, throwOnInvalid = true) {
		if(typeof newPrevious === "string") this.previous = newPrevious;

		if(throwOnInvalid && typeof this.previous !== "string") throw new Error("No previous Promptlet name saved.\nNote: Previous is saved when a Promptlet is added or prerequisites are edited on the PromptSet and unsaved when the Promptlet is removed.");

		return this.previous;
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

				if(chosenPromptlet.satisfied && !chosenPromptlet.editable) {
					this.clearConsole();
					console.log("Prompt Already Answered. (Editing this prompt is disabled)");

					continue;
				}

				if(!this.preSatisfied(chosenPromptlet)) continue;

				await chosenPromptlet.execute();

				this.clearConsole();
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
					name: `${set.satisfied ? (set.editable ? "✎ " : "✔ ") : (this.preSatisfied(set, true) ? "○ " : "⛝ ")}${this.set[val].optionName}`,
					value: val
				};
			})
		});

		this.default = chosenPrompt["PromptletSelected"];

		this.clearConsole();

		return this.set[this.default];
	}

	reduce() {
		return this.names.reduce((acc, val) => {
			const selectedSet = this.set[val];

			acc[selectedSet.name] = selectedSet.value;

			return acc;
		}, {});
	}

	clearConsole() {
		if(this.autoclear) console.clear();
	}

	toString() {
		return JSON.stringify(this.reduce());
	}
}

module.exports = PromptSet;