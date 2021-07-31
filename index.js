/**
 * Module that contains and exports all classes and functions of the Prompt-Set project
 * @module Prompt-Set
 */

const PromptSet = require("./src/classes/PromptSet.js");
const Promptlet = require("./src/classes/Promptlet.js");
const Configurer = require("./src/Configurer.js");

const allExports = {
	/**
	 * Use this if you would like to directly access and modify the classes used by Prompt-Set<br>
	 * If you only intend to create new instances, the exported functions will do.
	 * @alias Prompt-Set.classes
	 * @member {Object} classes
	 * @memberOf module:Prompt-Set
	 * @type {Object}
	 * @property {function} PromptSet {@link PromptSet See More Details}
	 * @property {function} Promptlet {@link Promptlet See More Details}
	 */
	classes: {
		PromptSet,
		Promptlet
	},
	/**
	 * Object responsible for all the basic configurations for prompts<br>
	 * {@link module:Prompt-Set.Configurer See More Details}
	 * @type {Object}
	 */
	Configurer,

	/**
	 * Creates and returns a new PromptSet
	 * @return {PromptSet}
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