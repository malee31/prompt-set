const Configurer = require("../Configurer.js");
const Validators = require("../Validators.js");
const Filters = require("../Filters.js");

/**
 * Options for the Promptlet. Not every property is documented here. Options are passed to inquirer.js so additional properties and option can be found [here]{https://github.com/SBoudrias/Inquirer.js/#questions}
 * @typedef {Object} PromptletOptions
 * @property {string} name Name for the Promptlet. Used as the key in PromptSet.reduce
 * @property {string} message Text displayed when the Promptlet is run
 * @property {string} [type = "input"] Type of [inquirer.js prompt]{@link https://github.com/SBoudrias/Inquirer.js/#prompt} to display
 * @property {*|function} [default] Value to use if blank answer is given or a function that returns a value to use
 */

/** Class that manages individual prompts and their responses. Wraps inquirer.prompt() */
class Promptlet {
	/**
	 * Default object template for the inquirer prompt function. Options passed to the Promptlet will overwrite these.
	 * The name property will be ignored on the default if set.
	 * @static
	 * @type {Object}
	 */
	static default = {
		type: "input",
		// name: "none",
		message: ""
	};
	filters = [];
	validators = [];
	prerequisites = []
	satisfied = false;
	value = "<Incomplete>";

	/**
	 * Instantiates a new Promptlet
	 * @throws {TypeError} Will throw if info.name is undefined or not a string
	 * @param {string} optionName The string displayed on the list of prompts from PromptSet.selectPromptlet()
	 * @param {PromptletOptions} info Object with all the prompt configurations passed to inquirer. See the 'inquirer' documentation on npm or Github for specific details. Name property required
	 * @param {boolean} [editable = false] Whether the prompt can be selected and answered again after being completed once
	 */
	constructor(optionName, info, editable = false) {
		if(typeof info.name !== "string") throw new TypeError("Name Property Required (Type: string)");
		this.optionName = optionName;
		this.info = Object.assign({}, Promptlet.default, info);
		this.editable = Boolean(editable);
		this.autoTrim = true;
		this.allowBlank = true;
		this.info.filter = async ans => {
			let filteredAns = ans;
			for(const filter of this.filters) {
				filteredAns = await filter(filteredAns);
			}
			return filteredAns;
		};
		this.info.validate = async ans => {
			for(const validator of this.validators) {
				const valid = await validator(ans);
				if(valid !== true) return valid;
			}
			return true;
		};
	}

	/**
	 * Sets whether or not to automatically trim answers before validating. Defaults to true
	 * @param {boolean} [allow = false] Determines whether to include the Filters.autotrim function as a filter
	 */
	set autoTrim(allow) {
		if(allow) this.addFilter(Filters.autoTrim);
		else this.removeFilter(Filters.autoTrim);
	}

	/**
	 * Sets whether or not blank answers are allowed. Defaults to true
	 * @param {boolean} [allow = false] Determines whether to include the Validators.disableBlank function as a validator
	 */
	set allowBlank(allow) {
		if(allow) this.addValidator(Validators.disableBlank);
		else this.removeValidator(Validators.disableBlank);
	}

	/**
	 * Getter for Promptlet.name property
	 * @return {string} Returns the name property of the Promptlet
	 */
	get name() {
		return this.info.name;
	}

	/**
	 * Adds a prerequisite that must be completed before this Promptlet can run
	 * @param {string} newPrerequisite The name property of the prerequisite Promptlet
	 */
	addPrerequisite(newPrerequisite) {
		newPrerequisite = newPrerequisite.trim();
		if(!this.prerequisites.includes(newPrerequisite)) {
			this.prerequisites.push(newPrerequisite);
			this.prerequisites.sort();
		}
	}

	/**
	 * Removes a prerequisite that must be completed before this Promptlet can run
	 * @param {string} removePrerequisite The name property of the prerequisite Promptlet
	 */
	removePrerequisite(removePrerequisite) {
		removePrerequisite = removePrerequisite.trim();
		if(this.prerequisites.includes(removePrerequisite)) {
			this.prerequisites.splice(this.prerequisites.indexOf(removePrerequisite), 1);
		}
	}

	/**
	 * Add a filter to the prompt. Will not add identical duplicates
	 * @param {function} filter Filter function to add
	 */
	addFilter(filter) {
		if(typeof filter !== "function") throw new TypeError("Function required");
		if(!this.filters.includes(filter)) {
			this.filters.push(filter);
		}
	}

	/**
	 * Remove a filter from the prompt. (Requires exact same function instance to remove)
	 * @param {function} filter Filter function to remove
	 */
	removeFilter(filter) {
		if(typeof filter !== "function") throw new TypeError("Function required");
		if(this.filters.includes(filter)) {
			this.filters.splice(this.filters.indexOf(filter), 1);
		}
	}

	/**
	 * Add a validator to the prompt. Will not add identical duplicates
	 * @param {function} validator Validator function to add
	 */
	addValidator(validator) {
		if(typeof validator !== "function") throw new TypeError("Function required");
		if(!this.validators.includes(validator)) {
			this.validators.push(validator);
		}
	}

	/**
	 * Remove a validator from the prompt. (Requires exact same function instance to remove)
	 * @param {function} validator Validator function to remove
	 */
	removeValidator(validator) {
		if(typeof validator !== "function") throw new TypeError("Function required");
		if(this.validators.includes(validator)) {
			this.validators.splice(this.validators.indexOf(validator), 1);
		}
	}

	/**
	 * Runs the Promptlet and marks Promptlet.satisfied to true. Updates Promptlet.value
	 * @async
	 * @return {Promise<string>} Resolves to the value entered when execution of inquirer finishes
	 */
	async execute() {
		this.value = (await Configurer.inquirer(this.info))[this.name];
		this.satisfied = true;
		return this.value;
	}
}

module.exports = Promptlet;