const Report = require("../../models/report");
const ReportHandler = require("../../handlers/report");
const Log = require("../../handlers/logging");
const clc = require("cli-color");

module.exports = {
	name: "attach",
	category: "report",
	description: "Attach a file to a report",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });
		if (args[0] === undefined)
			return message
				.reply("You forgot the report id")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (args[1] === undefined)
			return message
				.reply("You forgot a url for the attachment")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (args[2] === undefined)
			return message
				.reply("You forgot a name for the attachment")
				.then((msg) => msg.delete({ timeout: 3000 }));

		const id = args[0];
		const url = args[1];
		const name = args.slice(2).join(" ");

		const r = async function (params) {
			try {
				return await Report.findOne(params);
			} catch (err) {
				console.error(clc.red(err));
			}
		};

		const foundReport = await r({ reportID: id });
		if (foundReport === null)
			return message
				.reply("Hmm that report doesnt exist :(")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (foundReport.stance === "Denied")
			return message
				.reply("This bug has been denied.")
				.then((msg) => msg.delete({ timeout: 3000 }));

		await Report.updateOne(
			{ _id: foundReport._id },
			{
				$push: {
					attachmentUrl: url,
					attachmentName: name,
				},
			}
		);

		ReportHandler.UpdateStance(client, await r({ reportID: id }));

		Log.Send(
			client,
			`📎 Bug \`\`#${foundReport.reportID}\`\` submitted by ${foundReport.userTag} (${foundReport.userID}) **got a new attachment** attached by **${message.author.username}**#${message.author.discriminator} (${message.author.id})\n**URL:** ${url}\n**Name:** ${name}`
		);

		return message
			.reply(`The eagle has landed!`)
			.then((msg) => msg.delete({ timeout: 3000 }));
	},
};
