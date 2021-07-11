/** Class that manages individual prompts and their responses. Wraps inquirer.prompt() */
class Promptlet {
	// Must set static Promptlet.inquirer to either require("inquirer").prompt or require("inquirer").createPromptModule() before use
	static inquirer;
	static default = {
		type: "input",
		// name: "none",
		message: "",
	};

	/**
	 * Instantiates a new Promptlet
	 * @param {string} optionName The string displayed on the list of prompts from PromptSet.selectPromptlet()
	 * @param {Object} info Object with all the prompt configurations passed to inquirer. See the 'inquirer' documentation on npm or Github for specific details. Name property required
	 * @param {boolean} [editable = false] Whether the prompt can be selected and answered again after being completed once
	 */
	constructor(optionName, info, editable = false) {
		if(typeof info.name !== "string") throw "Name Property Required (Type: string)";
		this.satisfied = false;
		this.editable = Boolean(editable);
		this.value = "<Incomplete>";
		this.info = Object.assign({}, Promptlet.default, info);
		this.optionName = optionName;
		this.prerequisites = [];
	}

	/**
	 * Getter for Promptlet.name property
	 * @return {string} Returns the name property of the Promptlet
	 */
	get name() {
		return this.info.name;
	}

	/**
	 * Creates and returns a new Promptlet instance
	 * @static
	 * @param {...*} args Arguments for the Promptlet constructor
	 * @return {Promptlet} A new Promptlet instance
	 */
	static chain(...args) {
		return new Promptlet(...args);
	}

	/**
	 * Runs the Promptlet and marks Promptlet.satisfied to true. Updates Promptlet.value
	 * @async
	 * @return {Promise} Resolves when execution of inquirer finishes
	 */
	async execute() {
		this.value = (await Promptlet.inquirer(this.info))[this.name];
		this.satisfied = true;
	}
}

module.exports = Promptlet;