const Discord = require("discord.js");

const DB = require("../handlers/database");
const Report = require("../models/report");
const { channels: { approvalQueue, desktopBugs, marketingBugs, androidBugs, deniedBugs, iosBugs }, colors, levels, roles, guildID } = require("../config");
const Log = require("./logging");

module.exports = {
	Send: async (
		client,
		message,
		title,
		steps,
		actual,
		expected,
		clientSettings,
		systemSettings
	) => {
		const embed = new Discord.MessageEmbed()
			.setColor(PlatformColor(message.channel.id))
			.setAuthor(
				`${message.author.username}#${message.author.discriminator} (${message.author.id})`
			)
			.setTitle(title)
			.setDescription(`- ${steps.join("\n-")}`)
			.addField("Expected Result", expected)
			.addField("Actual Result", actual)
			.addField("System Settings", systemSettings)
			.addField("Client Settings", clientSettings)
			.setTimestamp()
			.setFooter(`#${await Report.countDocuments().exec()}`);

		client.channels.cache
			.get(approvalQueue)
			.send(`From: <#${message.channel.id}>`, { embed })
			.then((msg) => {
				DB.SaveReport(
					message,
					msg,
					message.channel.id,
					title,
					steps,
					actual,
					expected,
					clientSettings,
					systemSettings
				);
			});
	},

	UpdateStance: async (client, report) => {
		const message = await client.channels.cache
			.get(approvalQueue)
			.messages.fetch(report.messageId);

		let embed = new Discord.MessageEmbed()
			.setColor(message.embeds[0].color)
			.setAuthor(message.embeds[0].author.name)
			.setTitle(message.embeds[0].title)
			.setDescription(message.embeds[0].description)
			.addField("Expected Result", message.embeds[0].fields[0].value)
			.addField("Actual Result", message.embeds[0].fields[1].value)
			.addField("System Settings", message.embeds[0].fields[2].value)
			.addField("Client Settings", message.embeds[0].fields[3].value)
			.setTimestamp(message.embeds[0].timestamp)
			.setFooter(message.embeds[0].footer.text);

		AddData(report, embed);

		message.edit(message.content, { embed });

		if (report.approves.length >= 3 || report.stance === "Approved")
			ApprovedBug(client, report, embed);
		if (report.denies.length >= 3 || report.stance === "Denied")
			DeniedBug(client, report, embed, message.content);

		await grantRoles(report.userID, client);
	},
};

function ApprovedBug(client, report, oEmbed) {
	console.log(`[+] Bug: ${report.title} got approved`);
	let embed = new Discord.MessageEmbed()
		.setColor(oEmbed.color)
		.setAuthor(oEmbed.author.name)
		.setTitle(oEmbed.title)
		.setDescription(oEmbed.description)
		.addField("Expected Result", oEmbed.fields[0].value)
		.addField("Actual Result", oEmbed.fields[1].value)
		.addField("System Settings", oEmbed.fields[2].value)
		.addField("Client Settings", oEmbed.fields[3].value)
		.setTimestamp(oEmbed.timestamp)
		.setFooter(oEmbed.footer.text);

	AddData(report, embed);

	client.channels.cache
		.get(report.platform)
		.send(embed)
		.then((msg) => {
			Report.findOneAndUpdate(
				{ _id: report._id },
				{ stance: "Approved", messageId: msg.id },
				function (err) {
					if (err) {
						console.error(err);
					}
				}
			);
		});
	client.channels.cache
		.get(approvalQueue)
		.messages.fetch(report.messageId)
		.then((msg) => msg.delete());
}

function DeniedBug(client, report, oEmbed, content) {
	console.log(`[-] Bug: ${report.title} got denied`);
	let embed = new Discord.MessageEmbed()
		.setColor(oEmbed.color)
		.setAuthor(oEmbed.author.name)
		.setTitle(oEmbed.title)
		.setDescription(oEmbed.description)
		.addField("Expected Result", oEmbed.fields[0].value)
		.addField("Actual Result", oEmbed.fields[1].value)
		.addField("System Settings", oEmbed.fields[2].value)
		.addField("Client Settings", oEmbed.fields[3].value)
		.setTimestamp(oEmbed.timestamp)
		.setFooter(oEmbed.footer.text);

	AddData(report, embed);

	client.channels.cache
		.get(deniedBugs)
		.send(content, { embed })
		.then((msg) => {
			Report.findOneAndUpdate(
				{ _id: report._id },
				{ stance: "Denied", messageId: msg.id },
				function (err) {
					if (err) {
						console.error(err);
					}
				}
			);
		});
	client.channels.cache
		.get(approvalQueue)
		.messages.fetch(report.messageId)
		.then((msg) => msg.delete());
}

function AddData(report, embed) {
	if (report.approves.length > 0) {
		let message = "";
		report.approves.forEach((r) => {
			message += `${r} \n`;
		});
		embed.addField("Can Reproduce", message);
	}
	if (report.denies.length > 0) {
		let message = "";
		report.denies.forEach((r) => {
			message += `${r} \n`;
		});
		embed.addField("Cannot Reproduce", message);
	}

	if (report.notes.length > 0) {
		let message = "";
		report.notes.forEach((n) => {
			message += `${n} \n`;
		});
		embed.addField("Notes", message);
	}

	const filter = report.attachmentName.filter(function (el) {
		return el != null;
	});

	if (filter.length > 0) {
		let message = "";
		for (let i = 0; i < report.attachmentUrl.length; i++)
			if (report.attachmentName[i] !== null)
				message += `[${report.attachmentName[i]}](${report.attachmentUrl[i]})\n`;

		embed.addField("Attachments", message);
	}
}

function PlatformColor(platform) {
	let color = "";
	switch (platform) {
		case desktopBugs:
			color = colors.desktop;
			break;
		case androidBugs:
			color = colors.android;
			break;
		case iosBugs:
			color = colors.ios;
			break;
		case marketingBugs:
			color = colors.marketing;
			break;
		default:
			color = "8b0000";
			break;
	}
	return color;
}

async function grantRoles (user, client) {
	if (!user) return;
	let reports = await Report.find({ userID: user, stance: "Approved" });

	await client.guilds.cache.get(guildID).members.fetch(user).catch(() => {});
	let m = await client.guilds.cache.get(guildID).members.cache.get(user);
	if (!m) return;
	let role = levels[Object.keys(levels).filter(r => reports.length >= r).sort((a, b) => b - a)[0]];
	let roleId = roles[role];
	let nonRoles = Object.values(levels).filter(r => r !== role && m.roles.cache.has(roles[r]));
	if (role && !m.roles.cache.has(roleId)) {
		await m.roles.add(roleId, `Reached ${role}`);
		Log.Send(
			client,
			`⬆️ **${m.user.username}**#${m.user.discriminator} (${m.id}) achieved the rank of ${m.guild.roles.cache.get(roleId).name}`
		);
	}
	for await (let r of nonRoles) {
		await m.roles.remove(roles[r], "Reached other role");
	}
}
