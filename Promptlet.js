class Promptlet {
	// Must set Promptlet.inquirer before use
	static inquirer;
	static default = {

	};
	constructor(info) {
		if(typeof info.name !== "string") throw "Name Property Required (Type: string)";
		this.info = info;
	}

	static chain() {
		return new Promptlet();
	}
	get name() {
		return this.info.name;
	}
}

module.exports = Promptlet