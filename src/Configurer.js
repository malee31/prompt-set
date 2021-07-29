class Configurer {
	/**
	 * Default Inquirer Instance Configured
	 * @type {function}
	 */
	static inquirerInstance = require("inquirer").createPromptModule();

	constructor() {
		throw new TypeError("Index is a static class. Please use Index.methodName instead of creating a new instance");
	}

	/**
	 * Inquirer instance being used by the PromptSet
	 * Either the inquirer.prompt function or the inquirer.createPromptModule()'s function
	 * @static
	 * @returns {function} The Inquirer prompt function
	 */
	static get inquirer() {
		return Configurer.inquirerInstance;
	}

	/**
	 * Sets the inquirer instance for PromptSet and Promptlet
	 * @param {function} newInquirer Sets the inquirer instance to a new one. Only necessary if you want to use the same inquirer instance as your project or want to add plugins to it.
	 */
	static set inquirer(newInquirer) {
		if(typeof newInquirer !== "function") throw new TypeError(`Inquirer Prompt Function Expected. Received: ${typeof newInquirer}`);
		Configurer.inquirerInstance = newInquirer;
	}
}

module.exports = Configurer;