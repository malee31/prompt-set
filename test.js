const PromptSet = require(".");

const set = PromptSet.chain()
	.add(PromptSet.Promptlet("First Option", {
		name: "Opt 1",
		message: "Prompted Once"
	})).add(PromptSet.Promptlet("Second Option", {
		name: "Opt 2",
		message: "Prompted Twice"
	}));

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});