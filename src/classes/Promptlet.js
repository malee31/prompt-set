const Configurer = require("../Configurer.js");
const Validators = require("../Validators.js");
const Filters = require("../Filters.js");

/**
 * Options for the Promptlet. Not every property is documented here.<br>
 * Some properties have been overridden: filter & validate (use addFilter() and addValidator() instead)<br>
 * Options are passed to inquirer.js so additional properties and option can be found [here]{@link https://github.com/SBoudrias/Inquirer.js/#questions}
 * @typedef {Object} PromptletOptions
 * @property {string} [optionName] The string displayed on the list of prompts from PromptSet.selectPromptlet(). Required unless running a Promptlet by itself
 * @property {string} name Name for the Promptlet. Used as the key in PromptSet.reduce
 * @property {string} message Text displayed when the Promptlet is run
 * @property {string} [type = "input"] Type of [inquirer.js prompt]{@link https://github.com/SBoudrias/Inquirer.js/#prompt} to display
 * @property {string|number|boolean|function} [default] Value to use if blank answer is given or a function that returns a value to use
 * @property {string[]} [prerequisites] Array of Promptlet names. Promptlets with those names must be answered before this instance can run. (Note: Setting prerequisites with this property bypasses function that checks to make sure the Promptlets with these names exist)
 * @property {function|function[]} [filter] Constructor-only shortcut property. All functions in the filter property will be passed to this.addFilter
 * @property {function|function[]} [validate] Constructor-only shortcut property. All functions in the validate property will be passed to this.addValidator
 * @property {boolean} [allowBlank = true] Constructor-only shortcut property for setter Promptlet.allowBlank
 * @property {boolean} [autoTrim = true] Constructor-only shortcut property for setter Promptlet.autoTrim
 * @property {string|boolean|number} [value = "<Incomplete>"] Constructor-only shortcut property for forcefully setting a value for Promptlet.value without running it first
 * @property {boolean} [required = false] Whether this Promptlet MUST be answered before closing a PromptSet. Does nothing if Promptlet is run directly
 * @property {boolean} [editable = false] Whether the prompt can be selected and answered again after being completed once
 */

class Promptlet {
	/**
	 * Default object template for the inquirer prompt function. Options passed to the Promptlet will overwrite these.<br>
	 * The name property will be ignored on the default if set.<br>
	 * No longer a static property due to arrays
	 * @type {PromptletOptions}
	 */
	info = {
		type: "input",
		name: undefined,
		message: undefined,
		optionName: undefined,
		prerequisites: [],
		validate: [],
		filter: [],
		allowBlank: true,
		autoTrim: true,
		value: "<Incomplete>",
		required: false,
		editable: false
	};

	// @formatter:off IDE likes to complain so ignore the following line
	optionName; editable; value; satisfied; prerequisites; filters; validators; postProcessors;
	// @formatter:on

	/**
	 * Instantiates a new Promptlet
	 * @class
	 * @classdesc Class that manages individual prompts and their responses. Wraps inquirer.prompt()
	 * @alias Promptlet
	 * @memberOf module:Prompt-Set.Classes
	 * @param {PromptletOptions} info Object with all the prompt configurations passed to inquirer. See the 'inquirer' documentation on npm or Github for specific details. Name property required
	 * @throws {TypeError} Will be thrown if info.name is not a string
	 */
	constructor(info) {
		if(typeof info.name !== "string") throw new TypeError("Name Property Required (Type: string)");
		/**
		 * Text displayed for this Promptlet on the PromptSet option list
		 * @type {string}
		 */
		this.optionName = info.optionName || "Select to Answer";
		/**
		 * Object containing all the data needed to start an inquirer prompt. Requires name property
		 * @type {PromptletOptions|Object}
		 */
		this.info = Object.assign(this.info, info);
		/**
		 * Whether the question can be answered again and edited after the initial prompt
		 * @type {boolean}
		 */
		this.editable = Boolean(this.info.editable);
		/**
		 * The answer given to the Promptlet<br>
		 * Typeof value depends on the type of prompt being used and the output of the filters in that order
		 * @type {string|number|boolean|*}
		 */
		this.value = this.info.value;
		/**
		 * Whether this Promptlet has been answered satisfactorily yet
		 * @type {boolean}
		 */
		this.satisfied = false;
		/**
		 * Array with a list of names from Promptlets in a PromptSet that must be answered before this instance can be asked
		 * @type {string[]}
		 */
		this.prerequisites = this.info.prerequisites;

		/**
		 * Array of filter functions to pass prompt answers through to be altered<br>
		 * Function output must be a string. Outputs will be used as the input to the next function in the array
		 * @type {function[]}
		 */
		this.filters = [];
		/**
		 * Array of validator functions for prompt answers<br>
		 * Each function will be called in order until the end of the array or until an error or error message is returned instead of true<br>
		 * Return a string to display an error message, true to continue, or throw an error to crash
		 * @type {function[]}
		 */
		this.validators = [];
		/**
		 * Array of post-processor functions for prompt answers<br>
		 * Each function will be called in order until the end of the array. Error handling must be handled by each individual function<br>
		 * Each function should return something to pass to the next function or throw an error to crash
		 * @type {function[]}
		 */
		this.postProcessors = [];

		this
			.autoTrim(this.info.autoTrim)
			.allowBlank(this.info.allowBlank);

		this
			.addFilter(this.info.filter)
			.addValidator(this.info.validate);

		this.info.filter = async(ans, answers) => {
			let filteredAns = ans;
			for(const filter of this.filters) {
				filteredAns = await filter(filteredAns, answers);
			}
			return filteredAns;
		};
		this.info.validate = async(ans, answers) => {
			for(const validator of this.validators) {
				const valid = await validator(ans, answers);
				if(valid !== true) return valid;
			}
			return true;
		};
	}

	/**
	 * Whether to automatically use the built-in trim filter. Defaults to true if called without arguments
	 * @param {boolean} [allow = true] Determines whether to include the Filters.autoTrim function as a filter
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	autoTrim(allow = true) {
		if(allow) this.addFilter(Filters.autoTrim);
		else this.removeFilter(Filters.autoTrim);
		return this;
	}

	/**
	 * Whether to allow blank answers (responses). Defaults to true if called without arguments
	 * @param {boolean} [allow = true] Determines whether to include the Validators.disableBlank function as a validator
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	allowBlank(allow = true) {
		if(allow) this.removeValidator(Validators.disableBlank);
		else this.addValidator(Validators.disableBlank);
		return this;
	}

	/**
	 * Getter for Promptlet.name property
	 * @return {string} Returns the name property of the Promptlet
	 */
	get name() {
		return this.info.name;
	}

	/**
	 * Whether the current Promptlet instance must be run before the parent PromptSet can terminate. Defaults to true if called without arguments
	 * @param {boolean} [toggle = true] Whether answering the Promptlet is required. Defaults to true if this function is called.
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	required(toggle = true) {
		this.info.required = Boolean(toggle);
		return this;
	}

	/**
	 * Adds a prerequisite that must be completed before this Promptlet can run
	 * @param {string|Promptlet} newPrerequisite The name property of the prerequisite Promptlet
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	addPrerequisite(newPrerequisite) {
		if(newPrerequisite instanceof Promptlet) newPrerequisite = newPrerequisite.name;
		newPrerequisite = newPrerequisite.trim();
		if(!this.prerequisites.includes(newPrerequisite)) {
			this.prerequisites.push(newPrerequisite);
			this.prerequisites.sort();
		}
		return this;
	}

	/**
	 * Removes a prerequisite that must be completed before this Promptlet can run
	 * @param {string|Promptlet} removePrerequisite The name property of the prerequisite Promptlet
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	removePrerequisite(removePrerequisite) {
		if(removePrerequisite instanceof Promptlet) removePrerequisite = removePrerequisite.name;
		removePrerequisite = removePrerequisite.trim();
		if(this.prerequisites.includes(removePrerequisite)) {
			this.prerequisites.splice(this.prerequisites.indexOf(removePrerequisite), 1);
		}
		return this;
	}

	/**
	 * Add a filter to the prompt. Will not add identical duplicates (Wrap or recreate a function if multiple copies are desired)
	 * @param {function|function[]} filter Filter function to add
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 * @throws {TypeError} Thrown if a function is not provided
	 */
	addFilter(filter) {
		if(Array.isArray(filter)) {
			filter.forEach(fil => this.addFilter(fil));
			return this;
		}
		if(typeof filter !== "function") throw new TypeError("Function required");
		if(!this.filters.includes(filter)) {
			this.filters.push(filter);
		}
		return this;
	}

	/**
	 * Remove a filter from the prompt. (Requires exact same function instance to remove)
	 * @param {function} filter Filter function to remove
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	removeFilter(filter) {
		if(this.filters.includes(filter)) {
			this.filters.splice(this.filters.indexOf(filter), 1);
		}
		return this;
	}

	/**
	 * Add a validator to the prompt. Will not add identical duplicates (Wrap or recreate a function if multiple copies are desired)
	 * @param {function|function[]} validator Validator function to add
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 * @throws {TypeError} Thrown if a function is not provided
	 */
	addValidator(validator) {
		if(Array.isArray(validator)) {
			validator.forEach(val => this.addValidator(val));
			return this;
		}
		if(typeof validator !== "function") throw new TypeError("Function required");
		if(!this.validators.includes(validator)) {
			this.validators.push(validator);
		}
		return this;
	}

	/**
	 * Remove a validator from the prompt. (Requires exact same function instance to remove)
	 * @param {function} validator Validator function to remove
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	removeValidator(validator) {
		if(this.validators.includes(validator)) {
			this.validators.splice(this.validators.indexOf(validator), 1);
		}
		return this;
	}
	/**
	 * Add a post processor to the prompt. Will not add identical duplicates
	 * @param {function|function[]} postProcessor Post processor function to add
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 * @throws {TypeError} Thrown if a function is not provided
	 */
	addPostProcessor(postProcessor) {
		if(Array.isArray(postProcessor)) {
			postProcessor.forEach(val => this.addValidator(val));
			return this;
		}
		if(typeof postProcessor !== "function") throw new TypeError("Function required");
		if(!this.postProcessors.includes(postProcessor)) {
			this.postProcessors.push(postProcessor);
		}
		return this;
	}

	/**
	 * Remove a post processor from the prompt. (Requires exact same function instance to remove)
	 * @param {function} postProcessor Post processor function to remove
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	removePostProcessor(postProcessor) {
		if(this.postProcessors.includes(postProcessor)) {
			this.postProcessors.splice(this.postProcessors.indexOf(postProcessor), 1);
		}
		return this;
	}

	/**
	 * Runs all the post processor functions with the current value
	 * Modifies value property
	 * @param {Object} [answers = {}] Object with all the previous Promptlet answers if run by a PromptSet
	 * @return {Promptlet} Returns 'this' Promptlet for chaining
	 */
	async postProcess(answers = {}) {
		for(const postProcessor of this.postProcessors) {
			this.value = await postProcessor(this.value, answers);
		}
		return this;
	}

	/**
	 * Generates the listing for this Promptlet through an Object for inquirer lists
	 * @param {boolean} preSatisfied Whether the prerequisites have been satisfied (Cannot be automatically done internally by a Promptlet without a PromptSet)
	 * @return {{name: string, value: string}} An entry for the PromptSet.selectPromptlet() function's prompt
	 */
	generateListing(preSatisfied) {
		let prefix = "✖️";
		if(this.satisfied) {
			if(this.editable) {
				prefix = "✎";
			} else {
				prefix = "✔";
			}
		} else if(preSatisfied) {
			prefix = "○";
		}

		return {
			name: `${prefix} ${this.optionName}`,
			value: this.name
		};
	}

	/**
	 * Runs the Promptlet and sets satisfied property to true. Updates value property
	 * @async
	 * @param {Object} [answers = {}] Object with all the previous Promptlet answers if run by a PromptSet
	 * @return {string} Resolves to the answer value after inquirer finishes
	 */
	async start(answers = {}) {
		this.value = (await Configurer.inquirer(this.info, answers))[this.name];
		await this.postProcess(answers);
		this.satisfied = true;
		return this.value;
	}

	/**
	 * Returns basic data about the Promptlet as a string
	 * @return {string} String detailing the current state of the Promptlet
	 */
	toString() {
		return `Promptlet <${this.name}>: ${this.info.type} | [${this.optionName}]\nMessage: ${this.info.message}\nStatus: [${this.satisfied ? "✔" : "✖️"} ${this.editable ? "✎" : ""}]\nValue: ${this.value}\nPrerequisites: ${this.prerequisites.join(" & ")}`;
	}
}

module.exports = Promptlet;