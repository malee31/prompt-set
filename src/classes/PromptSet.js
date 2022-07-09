const { inquirer } = require("../Configurer.js");
const Promptlet = require("./Promptlet.js");

class PromptSet {
	/**
	 * Valid finishing modes for the PromptSet as an Enum-like object<br>
	 * Aggressive: Combination of 'confirm' and 'choice'<br>
	 * Confirm: Confirm after all prerequisites are met and every edit after that as well. Identical to auto if nothing is editable<br>
	 * Choice: Add an option to close the list at the end after all prerequisites are met<br>
	 * Auto: Automatically stops execution and closes the list after prerequisites are met
	 * @static
	 * @readonly
	 * @type {{aggressive: string, confirm: string, choice: string, auto: string}}
	 */
	static finishModes = Object.freeze({
		aggressive: "aggressive",
		confirm: "confirm",
		choice: "choice",
		auto: "auto"
	});

	/**
	 * Instantiates a new empty PromptSet
	 * @class
	 * @classdesc Class that manages and contains instances of Promptlets
	 * @alias PromptSet
	 * @memberOf module:Prompt-Set.Classes
	 */
	constructor() {
		this.reset();
	}

	/**
	 * Where to place the cursor in the PromptSet's list of Promptlets when started<br>
	 * Used to save the current position and return to it after the prompt is answered<br>
	 * Can be set to the name property of a Promptlet (preferred by internal code) or its index in the set
	 * @type {string|number}
	 */
	defaultPosition;
	/**
	 * The complete set of Promptlets in the PromptSet. Stored in the order they are added in
	 * @type {Array<Promptlet>}
	 */
	PromptletSet;
	/**
	 * Is true when all necessary Promptlets have been answered
	 * @type {boolean}
	 */
	satisfied;
	/**
	 * Whether to automatically clear the console after each prompt<br>
	 * Inquirer will usually do it automatically regardless but this is just in case
	 * @type {boolean}
	 */
	autoclear;
	/**
	 * Most recently added or edited Promptlet. Will be undefined in an empty set or if the most recent item was removed
	 * @type {Promptlet|undefined}
	 */
	recent;

	/**
	 * A string from PromptSet.finishModes. Determines when and how to ask the user if they are finished yet.<br>
	 * See [PromptSet.finishModes]{@link PromptSet#finishModes} for more details
	 * @type {string}
	 */
	finishMode;

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
	 * Empties and resets the PromptSet for reuse
	 */
	reset() {
		this.PromptletSet = [];
		this.defaultPosition = 0;
		this.satisfied = false;
		this.recent = undefined;
		this.autoclear = true;
		this.finishMode = PromptSet.finishModes.choice;
	}

	/**
	 * Search the PromptSet for a specific Promptlet
	 * @param {string|Promptlet} identifier The name of the Promptlet to search for. If a Promptlet is provided, the Promptlet.name property will be used
	 * @return {Promptlet} The searched Promptlet if found
	 * @throws {TypeError} Thrown if the identifier is not a string or Promptlet
	 * @throws {RangeError} Identifier is not found in the set
	 */
	searchSet(identifier) {
		if(typeof identifier !== "string" && !(identifier instanceof Promptlet)) {
			throw new TypeError("Identifier must be a 'string' or 'Promptlet' instance");
		}

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

		const addValue = constructorArgs instanceof Promptlet ? constructorArgs : new Promptlet(constructorArgs);
		this.add(addValue);
		
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

		this.refreshRecent(set);
		return this;
	}

	/**
	 * Remove a Promptlet from the PromptSet<br>
	 * Warning: Will make Promptlets that have the removed Promptlet as a prerequisite no longer selectable
	 * @param identifier Identifier for the Promptlet to remove from the PromptSet (Promptlet must be in set)
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	remove(identifier) {
		this.PromptletSet.splice(this.names.indexOf(this.resetRecent(identifier).name), 1);
		return this;
	}

	/**
	 * Adds a prerequisite Promptlet that must be completed before this one
	 * @param {string|Promptlet} prerequisiteIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [addToIdentifier] Identifier for a Promptlet to add prerequisite to (Promptlet must be in set). Will use PromptSet.recent if not provided
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	addPrerequisite(prerequisiteIdentifier, addToIdentifier) {
		this.refreshRecent(addToIdentifier).addPrerequisite(prerequisiteIdentifier);
		return this;
	}

	/**
	 * Remove a prerequisite from a specific Promptlet
	 * @param {string|Promptlet} removeIdentifier Identifier for a prerequisite Promptlet (Promptlet must be in set)
	 * @param {string|Promptlet} [removeFromIdentifier] Identifier for a Promptlet to remove prerequisite from (Promptlet must be in set). Will use PromptSet.recent if not provided
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 */
	removePrerequisite(removeIdentifier, removeFromIdentifier) {
		this.refreshRecent(removeFromIdentifier).removePrerequisite(removeIdentifier);
		return this;
	}

	/**
	 * Update or fetch the value of this.recent
	 * @param {Promptlet|string} [newRecent] New value to set as recent. Return value may vary depending on the type of this parameter
	 * @return {Promptlet|undefined} Returns a Promptlet. If newRecent is a Promptlet, it will be returned untouched. If it is as string, the Promptlet will be automatically looked up. If newRecent is not provided, this.recent will be returned (See PromptSet.recent for details).
	 * @throws {TypeError} newRecent is not a string or Promptlet
	 */
	refreshRecent(newRecent) {
		if(newRecent !== undefined) {
			this.recent = this.searchSet(newRecent);
		}
		return this.recent;
	}

	/**
	 * Clear this.recent if it matches the targetRecent. Use when a Promptlet is being removed from the set
	 * @param {Promptlet|string} targetRecent Promptlet to assure is not equal to this.recent
	 * @return {Promptlet} Returns targetRecent as a Promptlet. If targetRecent was a string, it will be looked up
	 * @throws {TypeError} targetRecent is not a string or Promptlet
	 */
	resetRecent(targetRecent) {
		targetRecent = this.searchSet(targetRecent);
		if(this.recent === targetRecent) this.recent = undefined;
		return targetRecent;
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
	 * @param {string} [mode = PromptSet.finishModes.choice] The finish mode to use from [PromptSet#finishModes]{@link PromptSet.finishModes}
	 * @return {PromptSet} Returns 'this' PromptSet for chaining
	 * @throws {RangeError} Thrown if the finish mode is not from [PromptSet#finishModes]{@link PromptSet.finishModes}
	 */
	setFinishMode(mode) {
		if(!PromptSet.finishModes[mode]) {
			throw new RangeError("Finish mode not found in PromptSet.finishModes. Select a valid finish mode from the set");
		}
		this.finishMode = PromptSet.finishModes[mode];
		return this;
	}

	/**
	 * Creates a list prompt for the user to select what to answer from the PromptSet
	 * @async
	 * @return {Promptlet} Returns the selected Promptlet from the set. Does not take into account prerequisites or editable state [PromptSet.start]{@link PromptSet#start}
	 */
	async selectPromptlet() {
		const choiceList = this.generateList();
		// Automatically return first item if no other options are available
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

		if(this.isSatisfied() && (this.finishMode === PromptSet.finishModes.aggressive || this.finishMode === PromptSet.finishModes.choice)) {
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
			case PromptSet.finishModes.aggressive:
			case PromptSet.finishModes.confirm:
				let finish = this.PromptletSet.every(promptlet => {
					return promptlet.satisfied && !promptlet.editable;
				});
				if(finish) return true;

				finish = await this.finishPrompt.start(this.reduce());
				this.clearConsole();
				return finish;

			case PromptSet.finishModes.choice:
				return this.finishPrompt.value;
			case PromptSet.finishModes.auto:
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

				if(!this.prereqSatisfied(chosenPromptlet) || (chosenPromptlet === this.finishPrompt && this.finishMode === PromptSet.finishModes.aggressive)) continue;

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