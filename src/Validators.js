// Built-in validators for Promptlets. Can be added manually by importing this file or automatically through certain functions in Promptlets
module.exports = {
	disableBlank,
	numberOnly,
	integerOnly
};

function disableBlank(val) {
	if(val.trim().length === 0) return "Response cannot be blank";
	return true;
}

function numberOnly(val) {
	const num = Number(val);
	if(isNaN(num)) return "Response is not a number";
	return true;
}

function integerOnly(val) {
	const isNumber = numberOnly(val);
	if(isNumber !== true) return isNumber;
	const num = Number(val);
	if(num !== Math.trunc(num)) return "Response cannot contain decimals";
	return true;
}