/**
 * Module that contains and exports all classes and functions of the Prompt-Set project
 * @module Prompt-Set
 */

const PromptSet = require("./src/classes/PromptSet.js");
const Promptlet = require("./src/classes/Promptlet.js");
const Configurer = require("./src/Configurer.js");
const Filters = require("./src/Filters.js");
const Validators = require("./src/Validators.js");

const allExports = {
	/**
	 * Use this if you would like to directly access and modify the classes used by Prompt-Set<br>
	 * If you only intend to create new instances, the exported functions will do.
	 * @memberOf module:Prompt-Set
	 * @type {Object}
	 * @property {function} PromptSet {@link PromptSet See More Details}
	 * @property {function} Promptlet {@link Promptlet See More Details}
	 */
	Classes: {
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
	 * Built-in filters for Promptlets<br>
	 * Can be added manually by importing this file or automatically through certain functions in Promptlets<br>
	 * {@link module:Prompt-Set.Filters See More Details}
	 * @type {Object}
	 */
	Filters,

	/**
	 * Built-in validators for Promptlets<br>
	 * Can be added manually by importing this file or automatically through certain functions in Promptlets<br>
	 * {@link module:Prompt-Set.Validators See More Details}
	 * @type {Object}
	 */
	Validators,

	/**
	 * Creates and returns a new PromptSet
	 * @return {PromptSet}
	 * @memberOf module:Prompt-Set
	 */
	PromptSet: () => new PromptSet(),

	PromptSetClass: PromptSet,

	/**
	 * Creates and returns a new Promptlet
	 * @param {PromptletOptions} options Arguments for the Promptlet constructor
	 * @return {Promptlet}
	 * @memberOf module:Prompt-Set
	 */
	Promptlet: (options) => new Promptlet(options)
};

module.exports = allExports;