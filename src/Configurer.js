/**
 * @memberOf module:Prompt-Set
 */
module.exports = {
	/**
	 * The default Inquirer prompt function instance used by PromptSets and Promptlets.
	 * This will either be the inquirer.prompt function or the returned function from inquirer.createPromptModule()
	 * There are no safety checks if you choose to replace it so swap out at your own risk
	 * The only reason this is usually swapped out is you would like to use some plugins for Inquirer although that can be done by modifying the existing instance
	 * @type {function}
	 */
	inquirer: require("inquirer").createPromptModule(),
};