// Built-in filters for Promptlets. Can be added manually by importing this file or automatically through certain functions in Promptlets
module.exports = {
	autoTrim
};

function autoTrim(val) {
	return val.trim();
}