class Promptlet {
	// Must set static Promptlet.inquirer to either require("inquirer").prompt or require("inquirer").createPromptModule() before use
	static inquirer;
	static default = {
		type: "input",
		// name: "none",
		message: "",
	};

	constructor(optionName, info) {
		if(typeof info.name !== "string") throw "Name Property Required (Type: string)";
		this.info = Object.assign({}, Promptlet.default, info);
		this.optionName = optionName;
	}

	static chain() {
		return new Promptlet();
	}

	get name() {
		return this.info.name;
	}

	execute() {
		return Promptlet.inquirer(this.info);
	}
}

module.exports = Promptlet