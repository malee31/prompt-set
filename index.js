const inquirer = require("inquirer").createPromptModule();
const Promptlet = require("./Promptlet.js");
Promptlet.inquirer = inquirer;

/** Class that manages and contains instances of Promptlets */
class PromptSet {
	/**
	 * Inquirer instance being used by the PromptSet
	 * Either the inquirer.prompt function or the inquirer.createPromptModule()'s function
	 * @static
	 * @type {function}
	 */
	static inquirer = inquirer;

	/**
	 * Instantiates a new PromptSet
	 */
	constructor() {
		this.set = {};
		this.names = [];
		this.default = 0;
		this.satisfied = false;
		this.autoclear = true;
		this.previous = undefined;
	}

	/**
	 * Creates and returns a new Promptlet
	 * @static
	 * @param {...*} args Arguments for the Promptlet constructor
	 * @return {Promptlet} A new PromptSet instance
	 */
	static Promptlet(...args) {
		return new Promptlet(...args);
	}

	/**
	 * Creates and returns a new PromptSet
	 * @static
	 * @return {PromptSet} A new PromptSet instance
	 */
	static chain() {
		return new PromptSet();
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

	/**
	 * Remove a Promptlet from the PromptSet
	 * Warning: Will break prompts that have the removed Promptlet as a prerequisite
	 * @param identifier Identifier for the Promptlet to remove from the PromptSet (Promptlet must be in set)
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	remove(identifier) {
		const removed = this.searchSet(identifier);

		delete this.set[removed.name];
		this.names.splice(this.names.indexOf(removed.name), 1);
		if(this.previous === removed.name) this.previous = undefined;

		return this;
	}

	/**
	 *
	 * @param {string|Promptlet} prerequisiteIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [addToIdentifier] Identifier for a Promptlet to add prerequisite to (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addPrerequisite(prerequisiteIdentifier, addToIdentifier) {
		const addMe = this.searchSet(prerequisiteIdentifier);
		const addTo = this.searchSet(this.refreshPrevious(addToIdentifier));

		if(!addTo.prerequisites.includes(addMe.name)) {
			addTo.prerequisites.push(addMe.name);
			addTo.prerequisites.sort();
		}

		return this;
	}

	/**
	 * Remove a prerequisite from a specific Promptlet
	 * @param {string|Promptlet} removeIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [removeFromIdentifier] Identifier for a Promptlet to remove prerequisite from (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	removePrerequisite(removeIdentifier, removeFromIdentifier) {
		const removeMe = this.searchSet(removeIdentifier);
		const removeFrom = this.searchSet(this.refreshPrevious(removeFromIdentifier));

		if(removeFrom.prerequisites.includes(removeMe.name)) removeFrom.prerequisites.slice(removeFrom.prerequisites.indexOf(removeMe.name));

		return this;
	}

	/**
	 * Search the PromptSet for a specific Promptlet
	 * @param {string|Promptlet} identifier The name of the Promptlet to search for. If a Promptlet is provided, the Promptlet.name property will be used
	 * @return {Promptlet} The searched Promptlet if found
	 */
	searchSet(identifier) {
		if(identifier.constructor.name === "Promptlet") identifier = identifier.name;

		if(typeof identifier !== "string") throw new Error("Identifier must be a 'string' or 'Promptlet' instance");
		if(!this.set[identifier]) throw new Error("Name not found in set");

		return this.set[identifier];
	}

	/**
	 *
	 * @param {string} [newPrevious] New value to set as previous. If provided, this will be returned. Else, PromptSet.previous will be returned
	 * @param {boolean} [throwOnInvalid = true] Whether to throw an error on an undefined return value.
	 * @return {string} Returns the name of a Promptlet from newPrevious (if provided) or this.previous. May be undefined if PromptSet.previous is not set or if it has been removed
	 */
	refreshPrevious(newPrevious, throwOnInvalid = true) {
		if(typeof newPrevious === "string") this.previous = newPrevious;

		if(throwOnInvalid && typeof this.previous !== "string") throw new Error("No previous Promptlet name saved.\nNote: Previous is saved when a Promptlet is added or prerequisites are edited on the PromptSet and unsaved when the Promptlet is removed.");

		return this.previous;
	}

	/**
	 * Used for determining whether all the prerequisites for a Promptlet have been met
	 * @param {Promptlet} chosenPromptlet A Promptlet to check prerequisites from
	 * @param {boolean} [silent = false] When not set to true, the first unsatisfied prerequisite will be logged through the console
	 * @return {boolean} Whether the chosenPromptlet has had all of its prerequisites met
	 */
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

	/**
	 * Returns true when all necessary Promptlets have been answered
	 * @return {boolean} Whether all necessary Promptlets have been answered
	 */
	isSatisfied() {
		for(const key of this.names) {
			if(!this.set[key].satisfied) return false;
		}
		return true;
	}

	/**
	 * Starts up the PromptSet and finishes once all the necessary questions are answered
	 * @return {Promise<Object>} Returns a Promise that resolves to the result of {@link PromptSet#reduce|PromptSet.reduce}
	 */
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

	/**
	 * Creates a list prompt for the user to select what to answer from the PromptSet
	 * @async
	 * @return {Promptlet} Returns the selected Promptlet from the set. Does not take into account prerequisites or editable state {@link PromptSet#start|PromptSet.start}
	 */
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

	/**
	 * Collects the values of every Promptlet into an Object.
	 * Note: Unanswered Promptlets have a value of "<Incomplete>"
	 * @return {Object} All results in "name: value" pairs
	 */
	reduce() {
		return this.names.reduce((acc, val) => {
			const selectedSet = this.set[val];

			acc[selectedSet.name] = selectedSet.value;

			return acc;
		}, {});
	}

	/**
	 * Clears console if PromptSet.autoclear is set to a truthy value
	 */
	clearConsole() {
		if(this.autoclear) console.clear();
	}

	/**
	 * Returns the JSON.stringify() version of {@link PromptSet#reduce|PromptSet.reduce}
	 * @return {string}
	 */
	toString() {
		return JSON.stringify(this.reduce());
	}
}

module.exports = PromptSet;