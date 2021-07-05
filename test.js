const PromptSet = require(".");

const set = PromptSet.chain()
	.add(PromptSet.Promptlet("First Option", {
		name: "Opt 1",
		message: "Prompted Once"
	})).add(PromptSet.Promptlet("Second Option", {
		name: "Opt 2",
		message: "Prompted Twice"
	})).add(PromptSet.Promptlet("Third Option", {
		name: "Opt 3",
		message: "Prompted Thrice"
	})).addPrerequisite("Opt 2", "Opt 3");

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});