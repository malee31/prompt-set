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
	 * All the method property names of the Promptlet prototype
	 * @static
	 * @type {string[]}
	 */
	static passthroughProperties = Object.getOwnPropertyNames(Promptlet.prototype)
		.filter(prop => {
			const details = Object.getOwnPropertyDescriptor(Promptlet.prototype, prop);
			// Allows all Promptlet member functions to be attached to the PromptSet as long as it is not overridden by a function in PromptSet
			return !Object.getOwnPropertyNames(PromptSet.prototype).includes(prop) && !details.get && !details.set && typeof details.value === "function";
		});

	/**
	 * Modifies the PromptSet prototype with passthrough functions for the this.previous Promptlet instance of each PromptSet
	 * @static
	 * @param {PromptSet} instance The PromptSet being modified with the passthrough functions
	 */
	static attachPassthrough(instance) {
		for(const prop of PromptSet.passthroughProperties) {
			Object.defineProperty(instance, prop, {
				value: (...args) => {
					instance.searchSet(instance.refreshPrevious())[prop](...args);
					return instance;
				}
			});
		}
	}

	/**
	 * Throws an error if the identifier is not a string or Promptlet instance
	 * @static
	 * @param identifier {string|Promptlet} Identifier to check
	 * @return {string|Promptlet} Returns the identifier untouched if no error is encountered
	 * @throws {TypeError} Thrown if identifier is not the right type
	 */
	static isIdentifier(identifier) {
		if(typeof identifier !== "string" && !identifier instanceof Promptlet) {
			throw new TypeError("Identifier must be a 'string' or 'Promptlet' instance");
		}
		return identifier;
	}

	/**
	 * Instantiates a new PromptSet
	 * @class
	 * @classdesc Class that manages and contains instances of Promptlets
	 * @alias PromptSet
	 * @memberOf module:Prompt-Set.Classes
	 */
	constructor() {
		PromptSet.attachPassthrough(this);
	}

	/**
	 * Where to place the cursor in the PromptSet's list of Promptlets when started<br>
	 * Used to save the current position and return to it after the prompt is answered<br>
	 * Can be the index on a list or the name property of a Promptlet
	 * @type {string|number}
	 */
	defaultPosition = 0;
	/**
	 * The complete set of Promptlets in the PromptSet. Stored in the order they are added in
	 * @type {Array<Promptlet>}
	 */
	PromptletSet = [];
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
	 * Most recently added or edited Promptlet. May be undefined if nothing has been added or if the added item was deleted
	 * @type {Promptlet|undefined}
	 */
	previous = undefined;
	/**
	 * A string from PromptSet.finishModes. Determines when and how to ask the user if they are finished yet.<br>
	 * See [PromptSet.finishModes]{@link PromptSet#finishModes} for more details
	 * @type {string}
	 */
	finishMode = PromptSet.finishModes[2];

	/**
	 * Confirmation Promptlet that determines whether to end execution or continue for edits or optional prompts
	 * @type {Promptlet}
	 */
	finishPrompt = new Promptlet({
		optionName: "Done?",
		name: "FINISH_PROMPT",
		message: "Confirm that you are finished (Default: No)",
		type: "confirm",
		default: false,
		value: false
	});

	/**
	 * Getter that returns an array of Promptlet names from the current set in order
	 * @readonly
	 * @type {string[]}
	 */
	get names() {
		return this.PromptletSet.map(promptlet => promptlet.name);
	}

	/**
	 * Empties the PromptSet for reuse
	 */
	clear() {
		this.PromptletSet = [];
		this.defaultPosition = 0;
		this.satisfied = false;
		this.previous = undefined;
	}

	/**
	 * Search the PromptSet for a specific Promptlet
	 * @param {string|Promptlet} identifier The name of the Promptlet to search for. If a Promptlet is provided, the Promptlet.name property will be used
	 * @return {Promptlet} The searched Promptlet if found
	 * @throws {TypeError} Identifier is not a string or Promptlet
	 * @throws {RangeError} Identifier is not found in the set
	 */
	searchSet(identifier) {
		PromptSet.isIdentifier(identifier);

		let found;
		if(identifier instanceof Promptlet && this.PromptletSet.includes(identifier)) {
			found = identifier;
		} else if(typeof identifier === "string" && this.names.includes(identifier)) {
			found = this.PromptletSet[this.names.indexOf(identifier)];
		} else {
			throw new RangeError("No matching Promptlet found in set");
		}

		return found;
	}

	/**
	 * Creates a new Promptlet and immediately adds it to the PromptSet
	 * @param {PromptletOptions|PromptletOptions[]} constructorArgs Argument passed to the Promptlet constructor. If this is an array, it will be looped through recursively from first to last
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addNew(constructorArgs) {
		if(Array.isArray(constructorArgs)) {
			constructorArgs.forEach(args => this.addNew(args));
			return this;
		}

		this.add(new Promptlet(constructorArgs));
		return this;
	}

	/**
	 * Adds already instantiated Promptlets to the PromptSet
	 * @param {Promptlet} set Promptlet to add to this PromptSet
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 * @throws {TypeError} Thrown if set is not a Promptlet instance
	 */
	add(set) {
		if(!set instanceof Promptlet) throw new TypeError("PromptSet.add() only accepts 'Promptlet' instances");

		if(this.names.includes(set.name)) {
			console.warn("Overwriting a prompt with an identical name");
			this.remove(set.name);
		}
		this.PromptletSet.push(set);

		this.refreshPrevious(set);
		return this;
	}

	/**
	 * Remove a Promptlet from the PromptSet<br>
	 * Warning: Will make Promptlets that have the removed Promptlet as a prerequisite no longer selectable
	 * @param identifier Identifier for the Promptlet to remove from the PromptSet (Promptlet must be in set)
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	remove(identifier) {
		this.PromptletSet.splice(this.names.indexOf(this.resetPrevious(identifier).name), 1);
		return this;
	}

	/**
	 * Adds a prerequisite Promptlet that must be completed before this one
	 * @param {string|Promptlet} prerequisiteIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [addToIdentifier] Identifier for a Promptlet to add prerequisite to (Promptlet must be in set). Will use PromptSet.previous if not provided
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addPrerequisite(prerequisiteIdentifier, addToIdentifier) {
		this.refreshPrevious(addToIdentifier).addPrerequisite(prerequisiteIdentifier);
		return this;
	}

	/**
	 * Remove a prerequisite from a specific Promptlet
	 * @param {string|Promptlet} removeIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [removeFromIdentifier] Identifier for a Promptlet to remove prerequisite from (Promptlet must be in set). Will use PromptSet.previous if not provided
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	removePrerequisite(removeIdentifier, removeFromIdentifier) {
		this.refreshPrevious(removeFromIdentifier).removePrerequisite(removeIdentifier);
		return this;
	}

	/**
	 * Update or fetch the value of this.previous
	 * @param {Promptlet|string} [newPrevious] New value to set as previous. Return value may vary depending on the type of this parameter
	 * @return {Promptlet|undefined} Returns a Promptlet. If newPrevious is a Promptlet, it will be returned untouched. If it is as string, the Promptlet will be automatically looked up. If newPrevious is not provided, this.previous will be returned (See PromptSet.previous for details).
	 * @throws {TypeError} newPrevious is not a string or Promptlet
	 */
	refreshPrevious(newPrevious) {
		if(newPrevious !== undefined) {
			this.previous = this.searchSet(newPrevious);
		}
		return this.previous;
	}

	/**
	 * Clear this.previous if it matches the targetPrevious. Use when a Promptlet is being removed from the set
	 * @param {Promptlet|string} targetPrevious Promptlet to assure is not equal to this.previous
	 * @return {Promptlet} Returns targetPrevious as a Promptlet. If targetPrevious was a string, it will be looked up
	 * @throws {TypeError} targetPrevious is not a string or Promptlet
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
	prereqSatisfied(chosenPromptlet, silent = false) {
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
	 * Returns true when all required Promptlets have been answered
	 * @return {boolean} Whether all necessary Promptlets have been answered
	 */
	isSatisfied() {
		for(const promptlet of this.PromptletSet) {
			if(promptlet.info.required && !promptlet.satisfied) return false;
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
	 * Creates a list prompt for the user to select what to answer from the PromptSet
	 * @async
	 * @return {Promptlet} Returns the selected Promptlet from the set. Does not take into account prerequisites or editable state [PromptSet.start]{@link PromptSet#start}
	 */
	async selectPromptlet() {
		const choiceList = this.generateList();
		if(choiceList.length === 1) return this.searchSet(choiceList[0].value);
		const chosenPrompt = await inquirer({
			type: "list",
			name: "SELECTED_PROMPTLET",
			default: this.defaultPosition,
			message: "Choose a prompt to answer",
			choices: choiceList
		});

		this.clearConsole();

		this.defaultPosition = chosenPrompt["SELECTED_PROMPTLET"];

		return this.defaultPosition === this.finishPrompt.name ? this.finishPrompt : this.searchSet(this.defaultPosition);
	}

	/**
	 * Generates the list of prompts that are displayed for selection
	 * @return {Array<{name: string, value: string}>}
	 */
	generateList() {
		const list = this.PromptletSet
			.map(promptlet => promptlet.generateListing(this.prereqSatisfied(promptlet, true)));

		if(this.isSatisfied() && (this.finishMode === PromptSet.finishModes[0] || this.finishMode === PromptSet.finishModes[2])) {
			this.finishPrompt.satisfied = false;
			list.push(this.finishPrompt.generateListing(this.prereqSatisfied(this.finishPrompt, true)));
		}

		return list;
	}

	/**
	 * Clears console if PromptSet.autoclear is set to a truthy value
	 */
	clearConsole() {
		if(this.autoclear) console.clear();
	}

	/**
	 * Returns whether to close the list (True after everything needed to be answered has been answered)
	 * @async
	 * @return {boolean} Whether to end execution
	 */
	async isFinished() {
		if(!this.isSatisfied()) return false;

		switch(this.finishMode) {
			case PromptSet.finishModes[0]:
			case PromptSet.finishModes[1]:
				let finish = this.PromptletSet.every(promptlet => {
					return promptlet.satisfied && !promptlet.editable;
				});
				if(finish) return true;

				finish = await this.finishPrompt.start(this.reduce());
				this.clearConsole();
				return finish;

			case PromptSet.finishModes[2]:
				return this.finishPrompt.value;
			case PromptSet.finishModes[3]:
				return true;
		}
	}

	/**
	 * Starts up the PromptSet and finishes once all the necessary questions are answered
	 * @return {Promise<Object>} Returns a Promise that resolves to the result of [PromptSet.reduce]{@link PromptSet#reduce}
	 */
	start() {
		if(this.PromptletSet.length === 0) throw new RangeError("Cannot start an empty PromptSet");

		return new Promise(async resolve => {
			let skipCheck = false;
			while(skipCheck || !await this.isFinished()) {
				skipCheck = false;
				const chosenPromptlet = await this.selectPromptlet();

				if(chosenPromptlet.satisfied && !chosenPromptlet.editable) {
					this.clearConsole();
					console.log("Prompt Already Answered. (Editing this prompt is disabled)");
					skipCheck = true;
					continue;
				}

				if(!this.prereqSatisfied(chosenPromptlet) || (chosenPromptlet === this.finishPrompt && this.finishMode === PromptSet.finishModes[0])) continue;

				await chosenPromptlet.start(this.reduce());
				this.clearConsole();
			}

			this.satisfied = true;
			resolve(this.reduce());
		});
	}

	/**
	 * Collects the values of every Promptlet into an Object.<br>
	 * Note: Skips unanswered Promptlets
	 * @return {Object} All results in "name: value" pairs
	 */
	reduce() {
		return this.PromptletSet
			.filter(promptlet => promptlet.satisfied)
			.reduce((acc, promptlet) => {
				acc[promptlet.name] = promptlet.value;
				return acc;
			}, {});
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