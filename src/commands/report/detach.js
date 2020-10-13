const Report = require("../../models/report");
const ReportHandler = require("../../handlers/report");
const Log = require("../../handlers/logging");
const clc = require("cli-color");

module.exports = {
	name: "detach",
	category: "report",
	description: "Detach a file from a report",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });
		if (args[0] === undefined)
			return message
				.reply("You forgot the report id")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (args[1] === undefined)
			return message
				.reply("You forgot the name")
				.then((msg) => msg.delete({ timeout: 3000 }));

		const id = args[0];
		const name = args.slice(1).join(" ");

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

		let pos = -1;
		for (let i = 0; i < foundReport.attachmentName.length; i++) {
			if (foundReport.attachmentName[i] === name) pos = i;
		}
		if (pos === -1)
			return message
				.reply("Unable to find the attachment")
				.then((msg) => msg.delete({ timeout: 3000 }));

		await Report.updateOne(
			{ _id: foundReport._id },
			{ $unset: { [`attachmentUrl.${pos}`]: 1, [`attachmentName.${pos}`]: 1 } }
		);

		ReportHandler.UpdateStance(client, await r({ reportID: id }));

		Log.Send(
			client,
			`🔥 Bug \`\`#${foundReport.reportID}\`\` submitted by ${foundReport.userTag} (${foundReport.userID}) **attachment got removed** by **${message.author.username}**#${message.author.discriminator} (${message.author.id})\n**Attachment Name:** ${name}`
		);
		return message
			.reply(`Killed the attachment with 🔥`)
			.then((msg) => msg.delete({ timeout: 3000 }));
	},
};
