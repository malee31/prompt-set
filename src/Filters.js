/**
 * Built-in filters for Promptlets<br>
 * Can be added manually by importing this file or automatically through certain functions in Promptlets
 * @memberOf module:Prompt-Set
 * @namespace Filters
 * @static
 */
module.exports = {
	autoTrim,
	singleSpace,
	capsLock,
	upperCase: capsLock,
	lowerCase
};

/**
 * Whitespace trimming filter
 * @param {string} val Prompt answer to filter
 * @return {string} Filtered result
 * @memberOf module:Prompt-Set.Filters
 */
function autoTrim(val) {
	return val.trim();
}

/**
 * Double whitespace remover filter
 * @param {string} val Prompt answer to filter
 * @return {string} Filtered result
 * @memberOf module:Prompt-Set.Filters
 */
function singleSpace(val) {
	return val.replace(/\s+/g, " ");
}

/**
 * Caps lock filter: Sets all characters to uppercase
 * @param {string} val Prompt answer to filter
 * @return {string} Filtered result
 * @memberOf module:Prompt-Set.Filters
 */
function capsLock(val) {
	return val.toUpperCase();
}

/**
 * Lowercase filter: Sets all characters to lowercase
 * @param {string} val Prompt answer to filter
 * @return {string} Filtered result
 * @memberOf module:Prompt-Set.Filters
 */
function lowerCase(val) {
	return val.toLowerCase();
}