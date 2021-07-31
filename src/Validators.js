/**
 * Built-in validators for Promptlets
 * Can be added manually by importing this file or automatically through certain functions in Promptlets
 * @module Validators
 * @alias Validators
 * @static
 * @type {Object}
 */
module.exports = {
	disableBlank,
	numberOnly,
	integerOnly,
	functions: {
		containsString
	}
};

/**
 * Validator that disables blank inputs
 * @static
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 */
function disableBlank(val) {
	if(val.trim().length === 0) return "Response cannot be blank";
	return true;
}

/**
 * Validator that disables blank inputs
 * @static
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 */
function numberOnly(val) {
	const num = Number(val);
	if(isNaN(num)) return "Response is not a number";
	return true;
}

/**
 * Validator that disables blank inputs
 * @static
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 */
function integerOnly(val) {
	const isNumber = numberOnly(val);
	if(isNumber !== true) return isNumber;
	const num = Number(val);
	if(num !== Math.trunc(num)) return "Response cannot contain decimals";
	return true;
}

/**
 * Generates a validator that resolves to true only if the substring is found in the value
 * @static
 * @param {string} str String that must be in the prompt answer
 * @param {boolean} [caseSensitive = true] Whether the string search should be case-sensitive
 */
function containsString(str, caseSensitive = true) {
	str = caseSensitive ? str : str.toLowerCase();
	return ans => (caseSensitive ? ans : ans.toLowerCase()).includes(str) ? true : `Response must contain ${str}`;
}