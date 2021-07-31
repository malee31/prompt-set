/**
 * Module that contains and exports all classes and functions of the Prompt-Set project
 * @module Prompt-Set
 */

const PromptSet = require("./src/classes/PromptSet.js");
const Promptlet = require("./src/classes/Promptlet.js");
const Configurer = require("./src/Configurer.js");

const allExports = {
	classes: {
		/**
		 * @alias module:Prompt-Set.classes
		 * @type {PromptSet}
		 */
		PromptSet,
		Promptlet
	},
	Configurer,

	/**
	 * Creates and returns a new PromptSet
	 * @return {module:Prompt-Set.PromptSet}
	 */
	PromptSet: () => new PromptSet(),

	/**
	 * Creates and returns a new Promptlet
	 * @param {...*} args Arguments for the Promptlet constructor
	 * @return {Promptlet}
	 */
	Promptlet: (...args) => new Promptlet(...args)
};

module.exports = allExports;