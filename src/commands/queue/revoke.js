const Report = require("../../models/report");
const ReportHandler = require("../../handlers/report");
const fs = require("fs");

const json = fs.readFileSync("./src/config.json");
const Log = require("../../handlers/logging");
const config = JSON.parse(json);

const clc = require("cli-color");

module.exports = {
	name: "revoke",
	category: "queue",
	description: "Revokes your stance in the queue",
	roles: [],
	run: async (client, message, args) => {
		message.delete({ timeout: 3000 });
		if (args[0] === undefined)
			return message
				.reply("You forgot the report id")
				.then((msg) => msg.delete({ timeout: 3000 }));

		const id = args[0];

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
		else if (foundReport.stance === "Approved")
			return message
				.reply("This bug has already been approved.")
				.then((msg) => msg.delete({ timeout: 3000 }));
		else if (foundReport.stance === "Denied")
			return message
				.reply("This bug has been denied.")
				.then((msg) => msg.delete({ timeout: 3000 }));

		let revokeText = "";
		foundReport.approves.forEach((a) => {
			if (a.includes(message.author.tag)) revokeText = a;
		});
		foundReport.denies.forEach((d) => {
			if (d.includes(message.author.tag)) revokeText = d;
		});
		console.log(revokeText);
		console.log(foundReport.denies);
		if (revokeText === "")
			return message
				.reply("There is nothing to revoke")
				.then((msg) => msg.delete({ timeout: 3000 }));

		await Report.updateOne(
			{ _id: foundReport._id },
			{
				$pull: {
					denies: revokeText,
					approves: revokeText,
				},
			}
		);

		ReportHandler.UpdateStance(client, await r({ reportID: id }));

		Log.Send(
			client,
			`🔰 Bug \`\`#${foundReport.reportID}\`\` submitted by ${foundReport.userTag} (${foundReport.userID}) got **revoked** by **${message.author.username}**#${message.author.discriminator} (${message.author.id})`
		);

		message
			.reply(`Revoked your stance on \`\`#${id}\`\` `)
			.then((msg) => msg.delete({ timeout: 3000 }));
	},
};
