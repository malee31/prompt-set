const PromptSet = require("./index.js");

const set = PromptSet.chain()
	.add(new PromptSet.Promptlet("First Option", {
		name: "Opt 1",
		message: "Prompted Once"
	})).add(new PromptSet.Promptlet("Second Option", {
		name: "Opt 2",
		message: "Prompted Twice"
	}));

set.start().then(console.log);