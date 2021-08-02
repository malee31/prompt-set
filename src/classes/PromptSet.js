const { inquirer } = require("../Configurer.js");
const Promptlet = require("./Promptlet.js");

class PromptSet {
	/**
	 * Valid finishing modes for the PromptSet<br>
	 * Aggressive: Combination of 'confirm' and 'choice'<br>
	 * Confirm: Confirm after all prerequisites are met and every edit after that as well. Identical to auto if nothing is editable<br>
	 * Choice: Add an option to close the list at the end after all prerequisites are met<br>
	 * Auto: Automatically stops execution and closes the list after prerequisites are met
	 * @static
	 * @readonly
	 * @type {string[]}
	 */
	static finishModes = ["aggressive", "confirm", "choice", "auto"];
	/**
	 * The complete set of Promptlets in the PromptSet. Stored in {PromptletName: Promptlet} format
	 * @type {Object.<string, Promptlet>}
	 */
	set = {};
	/**
	 * Where to place the cursor in the PromptSet's list of Promptlets when started<br>
	 * Used to save the current position and return to it after the prompt is answered<br>
	 * Can be the index on a list or the name property of a Promptlet
	 * @type {string|number}
	 */
	default = 0;
	/**
	 * Is true when all necessary Promptlets have been answered
	 * @type {boolean}
	 */
	satisfied = false;
	/**
	 * Whether to automatically clear the console after each prompt<br>
	 * Inquirer will usually do it automatically regardless but this is just in case
	 * @type {boolean}
	 */
	autoclear = true;
	/**
	 * Array of Promptlet names that must be answered before exiting
	 * @type {string[]}
	 */
	requiredSet = [];
	/**
	 * Most recently added or edited Promptlet. May be undefined if nothing has been added or if the added item was deleted
	 * @type {Promptlet|undefined}
	 */
	previous = undefined;
	/**
	 * A string from PromptSet.finishModes. Determines when and how to ask the user if they are finished yet.<br>
	 * See [PromptSet.finishModes]{@link PromptSet#finishModes} for more details
	 * @type {string}
	 */
	finishMode = PromptSet.finishModes[3];

	/**
	 * Confirmation Promptlet that determines whether to end execution or continue for edits or optional prompts
	 * @type {Promptlet}
	 */
	finishPrompt;

	/**
	 * Instantiates a new PromptSet
	 * @class
	 * @classdesc Class that manages and contains instances of Promptlets
	 * @alias PromptSet
	 * @memberOf module:Prompt-Set.Classes
	 */
	constructor() {
		attachPassthrough(this);
		this.finishPrompt = new Promptlet("Done?",
			{
				name: "finished",
				message: "Confirm that you are finished (Default: No)",
				type: "confirm",
				default: false
			}
		);
		/**
		 * Answer for the finishing confirmation Promptlet
		 * @type {boolean}
		 */
		this.finishPrompt.value = false;
	}

	/**
	 * Getter that returns an array of Promptlet names from the current set
	 * @readonly
	 * @type {string[]}
	 */
	get names() {
		return Object.keys(this.set);
	}

	clear() {
		this.set = {};
		this.requiredSet = [];
		this.default = 0;
	}

	/**
	 * Creates a new Promptlet and immediately adds it to the PromptSet
	 * @param {...*} constructorArgs Arguments passed to the Promptlet constructor
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addNew(...constructorArgs) {
		return this.add(new Promptlet(...constructorArgs));
	}

	/**
	 * Adds already instantiated Promptlets to the PromptSet
	 * @param {Promptlet} set Promptlet to add to this PromptSet
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	add(set) {
		if(!set instanceof Promptlet) throw new TypeError("PromptSet.add() only accepts 'Promptlet' instances");
		if(this.names.includes(set.name)) console.warn("Overwriting a prompt with an identical name");

		this.set[set.name] = set;
		this.refreshPrevious(set);
		return this;
	}

	/**
	 * Remove a Promptlet from the PromptSet<br>
	 * Warning: Will break prompts that have the removed Promptlet as a prerequisite
	 * @param identifier Identifier for the Promptlet to remove from the PromptSet (Promptlet must be in set)
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	remove(identifier) {
		delete this.set[this.resetPrevious(identifier).name];
		return this;
	}

	/**
	 * Adds a prerequisite Promptlet that must be completed before this one
	 * @param {string|Promptlet} prerequisiteIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [addToIdentifier] Identifier for a Promptlet to add prerequisite to (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addPrerequisite(prerequisiteIdentifier, addToIdentifier) {
		this.refreshPrevious(addToIdentifier).addPrerequisite(prerequisiteIdentifier);
		return this;
	}

	/**
	 * Remove a prerequisite from a specific Promptlet
	 * @param {string|Promptlet} removeIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [removeFromIdentifier] Identifier for a Promptlet to remove prerequisite from (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	removePrerequisite(removeIdentifier, removeFromIdentifier) {
		this.refreshPrevious(removeFromIdentifier).removePrerequisite(removeIdentifier);
		return this;
	}

	/**
	 * Makes a Promptlet answer required to finish
	 * @param {string|Promptlet} [requiredIdentifier] Identifier for a Promptlet to make required (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	required(requiredIdentifier) {
		const requireMe = this.refreshPrevious(requiredIdentifier);
		if(!this.requiredSet.includes(requireMe.name)) this.requiredSet.push(requireMe.name);

		return this;
	}

	/**
	 * Removes a Promptlet from the list of required answers
	 * @param {string|Promptlet} [optionIdentifier] Identifier for a Promptlet to make optional. (Promptlet must be in set). Will use PromptSet.previous by default
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	optional(optionIdentifier) {
		optionIdentifier = this.refreshPrevious(optionIdentifier);
		if(this.requiredSet.includes(optionIdentifier.name)) this.requiredSet.splice(this.requiredSet.indexOf(optionIdentifier.name), 1);

		return this;
	}

	/**
	 * Search the PromptSet for a specific Promptlet
	 * @param {string|Promptlet} identifier The name of the Promptlet to search for. If a Promptlet is provided, the Promptlet.name property will be used
	 * @return {Promptlet} The searched Promptlet if found
	 */
	searchSet(identifier) {
		if(identifier instanceof Promptlet) identifier = identifier.name;

		if(typeof identifier !== "string") throw new Error("Identifier must be a 'string' or 'Promptlet' instance");
		if(!this.set[identifier]) throw new Error("Name not found in set");

		return this.set[identifier];
	}

	/**
	 * Update or fetch the value of this.previous
	 * @param {Promptlet|string} [newPrevious] New value to set as previous. Return value may vary depending on the type of this parameter
	 * @return {Promptlet|undefined} Returns a Promptlet. If newPrevious is a Promptlet, it will be returned untouched. If it is as string, the Promptlet will be looked up automatically. If newPrevious is not provided, this.previous will be returned (Please see PromptSet.previous for details).
	 */
	refreshPrevious(newPrevious) {
		return newPrevious ? this.previous = this.searchSet(newPrevious) : this.previous;
	}

	/**
	 * Clear this.previous if it matches the targetPrevious
	 * @param {Promptlet|string} targetPrevious Promptlet to assure is not equal to this.previous
	 * @return {Promptlet} Returns targetPrevious as a Promptlet. If targetPrevious was a string, it will be looked up
	 */
	resetPrevious(targetPrevious) {
		targetPrevious = this.searchSet(targetPrevious);
		if(this.previous === targetPrevious) this.previous = undefined;
		return targetPrevious;
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
	 * @param {string|number} [mode = PromptSet.finishModes[3]] The finish mode to use. See [PromptSet#finishModes]{@link PromptSet.finishModes} for details
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 * @throws {RangeError} Index out of bounds for finish mode array
	 * @throws {TypeError} Throws if mode is not a string, a number, or a number string
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
	 * @async
	 * @return {boolean} Whether to end execution
	 */
	async finished() {
		let finish = this.isSatisfied();

		if(finish && this.finishMode !== PromptSet.finishModes[3]) {

			switch(this.finishMode) {
				case PromptSet.finishModes[0]:
				case PromptSet.finishModes[1]:
					finish = this.names.every(val => {
						const set = this.set[val];
						return set.satisfied && !set.editable;
					});
					if(finish) break;

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
			let skipCheck = false;
			while(skipCheck || !await this.finished()) {
				skipCheck = false;
				const chosenPromptlet = await this.selectPromptlet();

				if(chosenPromptlet.satisfied && !chosenPromptlet.editable) {
					this.clearConsole();
					console.log("Prompt Already Answered. (Editing this prompt is disabled)");
					skipCheck = true;
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

	/**
	 * Generates the list of prompts that are displayed for selection
	 * @return {Object.<name: string, value: string>[]}
	 */
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
	 * Collects the values of every Promptlet into an Object.<br>
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

/**
 * All the method property names of the Promptlet prototype
 * @inner
 * @type {string[]}
 */
const passthroughProperties = Object.getOwnPropertyNames(Promptlet.prototype)
	.filter(prop => {
		const details = Object.getOwnPropertyDescriptor(Promptlet.prototype, prop);
		return !Object.getOwnPropertyNames(PromptSet.prototype).includes(prop) && !details.get && !details.set && typeof details.value === "function";
	});

/**
 * Modifies the PromptSet prototype with passthrough functions for the this.previous Promptlet instance of each PromptSet
 * @param {PromptSet} instance The PromptSet being modified with the passthrough functions
 */
function attachPassthrough(instance) {
	for(const prop of passthroughProperties) {
		Object.defineProperty(instance, prop, {
			value: (...args) => {
				instance.searchSet(instance.refreshPrevious())[prop](...args);
				return instance;
			}
		});
	}
}


module.exports = PromptSet;