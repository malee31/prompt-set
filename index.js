const allExports = {
	classes: {
		PromptSet: require("./src/classes/PromptSet.js"),
		Promptlet: require("./src/classes/Promptlet.js")
	},
	Configurer: require("./src/Configurer.js")
};

// Additional exports dependent on previous exports. Maybe this looks cleaner than constant = require() format?
module.exports = Object.assign(module.exports, {
	/**
	 * Creates and returns a new PromptSet
	 * @return {PromptSet}
	 */
	PromptSet: () => new allExports.classes.PromptSet(),
	/**
	 * Creates and returns a new Promptlet
	 * @param {...*} args Arguments for the Promptlet constructor
	 * @return {Promptlet}
	 */
	Promptlet: (...args) => new allExports.classes.Promptlet(...args)
});