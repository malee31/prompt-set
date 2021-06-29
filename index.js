

class PromptSet {
	constructor() {
		this.set = {};
	}

	static chain() {
		return new PromptSet();
	}
}

module.exports = PromptSet