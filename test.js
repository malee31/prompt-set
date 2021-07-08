const PromptSet = require(".");

const set = PromptSet.chain()
	.addNew("First Option", {
		name: "Opt 1",
		message: "Prompted Once"
	}, true).addNew("Second Option", {
		name: "Opt 2",
		message: "Prompted Twice"
	}).addNew("Third Option", {
		name: "Opt 3",
		message: "Prompted Thrice"
	})
	.addPrerequisite("Opt 2")
	.addPrerequisite("Opt 1")
	.removePrerequisite("Opt 1");

set.start().then(console.log).then(() => {
	console.log(`PromptSet.toString(): ${set}`);
});