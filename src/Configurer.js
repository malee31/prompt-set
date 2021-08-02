/**
 * Object responsible for configuring how Promptlets and PromptSets work
 * @memberOf module:Prompt-Set
 * @namespace Configurer
 * @static
 */
module.exports = {
	/**
	 * The default Inquirer prompt function instance used by PromptSets and Promptlets.<br>
	 * This will either be the inquirer.prompt function or the returned function from inquirer.createPromptModule()<br>
	 * There are no safety checks if you choose to replace it so swap out at your own risk<br>
	 * The only reason this is usually swapped out is you would like to use some plugins for Inquirer although that can be done by modifying the existing instance
	 * @memberOf module:Prompt-Set.Configurer
	 * @function
	 * @param {Object} questions See the inquirer documentation for more details
	 */
	inquirer: require("inquirer").createPromptModule(),
};