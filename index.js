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
	 * Simply creates and returns a new PromptSet
	 * @return {PromptSet} New PromptSet instance
	 * @memberOf module:Prompt-Set
	 */
	instance: () => new PromptSet(),

	/**
	 * Simply creates and returns a new Promptlet
	 * @param {PromptletOptions} options Arguments for the Promptlet constructor
	 * @return {Promptlet} New Promptlet instance
	 * @memberOf module:Prompt-Set
	 */
	 entry: (options) => new Promptlet(options),


	/**
	 * PromptSet's finish modes (Enum-like). See PromptSet.finishModes for more information
	 * @type {Object}
	 */
	finishModes: PromptSet.finishModes,

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
	 * The PromptSet class<br>
	 * {@link PromptSet See More Details}
	 * @memberOf module:Prompt-Set
	 */
	PromptSet,

	/**
	 * The Promptlet class<br>
	 * {@link Promptlet See More Details}
	 * @memberOf module:Prompt-Set
	 */
	Promptlet,
};

module.exports = allExports;