/**
 * Built-in validators for Promptlets<br>
 * Can be added manually by importing this file or automatically through certain functions in Promptlets
 * @memberOf module:Prompt-Set
 * @namespace Validators
 * @static
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
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 * @memberOf module:Prompt-Set.Validators
 */
function disableBlank(val) {
	if(val.trim().length === 0) return "Response cannot be blank";
	return true;
}

/**
 * Validator that disables non-number inputs
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 * @memberOf module:Prompt-Set.Validators
 */
function numberOnly(val) {
	const num = Number(val);
	if(isNaN(num)) return "Response is not a number";
	return true;
}

/**
 * Validator that disables non-integer inputs
 * @param {string} val Prompt answer to validate
 * @return {string|boolean} Returns true if valid and a string as an error message otherwise
 * @memberOf module:Prompt-Set.Validators
 */
function integerOnly(val) {
	const isNumber = numberOnly(val);
	if(isNumber !== true) return isNumber;
	const num = Number(val);
	if(num !== Math.trunc(num)) return "Response cannot contain decimals";
	return true;
}

/**
 * Generates a validator that resolves to true only if a specific substring is found in the input
 * @param {string} str String that must be in the prompt answer
 * @param {boolean} [caseSensitive = true] Whether the string search should be case-sensitive
 * @memberOf module:Prompt-Set.Validators
 */
function containsString(str, caseSensitive = true) {
	str = caseSensitive ? str : str.toLowerCase();
	return ans => (caseSensitive ? ans : ans.toLowerCase()).includes(str) || `Response must contain ${str}`;
}