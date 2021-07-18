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
	 * Valid finishing modes for the PromptSet
	 * Aggressive: Combination of 'confirm' and 'choice'
	 * Confirm: Confirm after all prerequisites are met and every edit after that as well. Identical to auto if nothing is editable
	 * Choice: Add an option to close the list at the end after all prerequisites are met
	 * Auto: Automatically stops execution and closes the list after prerequisites are met
	 * @static
	 * @type {Array<string>}
	 */
	static finishModes = ["aggressive", "confirm", "choice", "auto"];


	/**
	 * Getter for PromptSet.names property. Read-only.
	 * @return {string[]} Returns an array of the Promptlet names in the set
	 */
	get names() {
		return Object.keys(this.set);
	}

	/**
	 * Instantiates a new PromptSet
	 */
	constructor() {
		this.set = {};
		this.default = 0;
		this.satisfied = false;
		this.autoclear = true;
		this.requiredSet = [];
		this.previous = undefined;
		this.finishMode = PromptSet.finishModes[3];
		this.finishPrompt = new Promptlet("Done?",
			{
				name: "finished",
				message: "Confirm that you are finished (Default: No)",
				type: "confirm",
				default: false
			}
		);
		this.finishPrompt.value = false;
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

		addTo.addPrerequisite(addMe.name);

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

		removeFrom.removePrerequisite(removeMe.name);

		return this;
	}

	/**
	 * Makes a Promptlet answer required to finish
	 * @param {string|Promptlet} [requiredIdentifier] Identifier for a Promptlet to make required (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	required(requiredIdentifier) {
		const requireMe = this.searchSet(this.refreshPrevious(requiredIdentifier));
		if(!this.requiredSet.includes(requireMe.name)) this.requiredSet.push(requireMe.name);

		return this;
	}

	/**
	 * Removes a Promptlet from the list of required answers
	 * @param {string|Promptlet} [optionIdentifier] Identifier for a Promptlet to make optional. (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	optional(optionIdentifier) {
		const requireMe = this.searchSet(this.refreshPrevious(optionIdentifier));
		if(this.requiredSet.includes(requireMe.name)) {
			this.requiredSet.slice(this.requiredSet.indexOf(optionIdentifier.name));
			if(this.previous === requireMe.name) this.previous = undefined;
		}

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
	 * @param {boolean} [throwOnInvalid = true] Whether to throw an error on an undefined return value
	 * @return {string} Returns the name of a Promptlet from newPrevious (if provided) or this.previous. May be undefined if PromptSet.previous is not set or if it has been removed
	 */
	refreshPrevious(newPrevious, throwOnInvalid = true) {
		if(newPrevious.constructor.name === "Promptlet") newPrevious = newPrevious.name;
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
		for(const name in this.set) {
			if(!this.set.hasOwnProperty(name)) continue;
			if(!this.set[name].satisfied) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Toggle or set whether or not to confirm that the user is done before terminating the PromptSet
	 * @throws {RangeError} Index out of bounds for finish mode array
	 * @throws {TypeError} Throws if mode is not a string, a number, or a number string
	 * @param {string|number} [mode = PromptSet.finishModes[3]] The finish mode to use. See [PromptSet#finishModes]{@link PromptSet.finishModes} for details
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	setFinishMode(mode) {
		if(typeof mode === "number" || !isNaN(Number(mode))) {
			mode = Math.trunc(Number(mode));
			if(mode < 0 || mode >= PromptSet.finishModes.length) throw new RangeError(`Index Out of Bounds: ${mode}\nExpected 0 to ${PromptSet.finishModes.length}`);
			this.finishMode = PromptSet.finishModes[mode];
		} else if(typeof mode === "string") {
			mode = mode.trim().toLowerCase();
			this.finishMode = PromptSet.finishModes.includes(mode) ? mode : PromptSet.finishModes[3];
		} else throw new TypeError(`String or Number expected. Received: <Type: ${typeof mode}> (${mode})`);

		return this;
	}

	/**
	 * Returns whether or not to close the list (True after everything needed to be answered has been answered)
	 * @return {boolean} Whether to end execution
	 */
	async finished() {
		let finish = this.isSatisfied();

		if(finish && this.finishMode !== PromptSet.finishModes[3]) {

			switch(this.finishMode) {
				case PromptSet.finishModes[0]:
				case PromptSet.finishModes[1]:
					finish = await this.finishPrompt.execute();
					this.clearConsole();
					break;
				case PromptSet.finishModes[2]:
					finish = this.finishPrompt.value;
					break;
			}

		}

		return finish;
	}

	/**
	 * Starts up the PromptSet and finishes once all the necessary questions are answered
	 * @return {Promise<Object>} Returns a Promise that resolves to the result of [PromptSet.reduce]{@link PromptSet#reduce}
	 */
	start() {
		if(this.names.length === 0) throw new Error("Cannot start an empty PromptSet");

		return new Promise(async resolve => {
			while(!await this.finished()) {
				const chosenPromptlet = await this.selectPromptlet();

				if(chosenPromptlet.satisfied && !chosenPromptlet.editable) {
					this.clearConsole();
					console.log("Prompt Already Answered. (Editing this prompt is disabled)");

					continue;
				}

				if(!this.preSatisfied(chosenPromptlet) || (chosenPromptlet === this.finishPrompt && this.finishMode === PromptSet.finishModes[0])) continue;

				await chosenPromptlet.execute();
				this.clearConsole();
			}

			resolve(this.reduce());
		});
	}

	/**
	 * Creates a list prompt for the user to select what to answer from the PromptSet
	 * @async
	 * @return {Promptlet} Returns the selected Promptlet from the set. Does not take into account prerequisites or editable state [PromptSet.start]{@link PromptSet#start}
	 */
	async selectPromptlet() {
		const choiceList = this.generateList();
		if(choiceList.length === 1) return this.set[choiceList[0].value];
		const chosenPrompt = await inquirer({
			type: "list",
			name: "PromptletSelected",
			default: this.default,
			message: "Choose a prompt to answer",
			choices: choiceList
		});

		this.clearConsole();

		this.default = chosenPrompt["PromptletSelected"];

		return this.default === this.finishPrompt.name ? this.finishPrompt : this.set[this.default];
	}

	generateList() {
		const list = this.names.map(val => {
			const set = this.set[val];
			return {
				name: `${set.satisfied ? (set.editable ? "✎ " : "✔ ") : (this.preSatisfied(set, true) ? "○ " : "⛝ ")}${set.optionName}`,
				value: val
			};
		});

		if(this.isSatisfied() && (this.finishMode === PromptSet.finishModes[0] || this.finishMode === PromptSet.finishModes[2])) {
			this.finishPrompt.satisfied = false;

			list.push({
				name: `${this.preSatisfied(this.finishPrompt, true) ? "○ " : "⛝ "}${this.finishPrompt.optionName}`,
				value: this.finishPrompt.name
			});
		}

		return list;
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
	 * Returns the JSON.stringify() version of [PromptSet.reduce]{@link PromptSet#reduce}
	 * @return {string} JSON with all the values as a string. Parse with JSON.parse() if needed or use for debugging
	 */
	toString() {
		return JSON.stringify(this.reduce());
	}
}

module.exports = PromptSet;