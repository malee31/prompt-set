class Promptlet {
	// Must set static Promptlet.inquirer to either require("inquirer").prompt or require("inquirer").createPromptModule() before use
	static inquirer;
	static default = {
		type: "input",
		// name: "none",
		message: "",
	};

	constructor(optionName, info, editable) {
		if(typeof info.name !== "string") throw "Name Property Required (Type: string)";
		this.satisfied = false;
		this.editable = Boolean(editable);
		this.value = "<Incomplete>";
		this.info = Object.assign({}, Promptlet.default, info);
		this.optionName = optionName;
		this.prerequisites = [];
	}

	static chain() {
		return new Promptlet();
	}

	get name() {
		return this.info.name;
	}

	async execute() {
		this.value = (await Promptlet.inquirer(this.info))[this.name];
		this.satisfied = true;
	}
}

module.exports = Promptlet;