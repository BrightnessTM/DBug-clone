const Discord = require("discord.js");
const fs = require("fs");

const DB = require("../handlers/database");
const json = fs.readFileSync("./src/config.json");
const Report = require("../models/report");
const config = JSON.parse(json);

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
			.get(config.channels.approvalQueue)
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
			.get(config.channels.approvalQueue)
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

		if (report.approves.length > 0) {
			let message = "";
			report.approves.forEach((a) => {
				message += `${a} \n`;
			});
			embed.addField("Approved", message);
		}

		if (report.denies.length > 0) {
			let message = "";
			report.denies.forEach((d) => {
				message += `${d} \n`;
			});
			embed.addField("Denied", message);
		}

		if (report.notes.length > 0) {
			let message = "";
			report.notes.forEach((n) => {
				message += `${n} \n`;
			});
			embed.addField("Notes", message);
		}

		message.edit(message.content, { embed });

		if (report.approves.length >= 3 || report.stance === "Approved")
			ApprovedBug(client, report, embed);
		if (report.denies.length >= 3 || report.stance === "Denied")
			DeniedBug(client, report, embed, message.content);
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
		.get(config.channels.approvalQueue)
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

	client.channels.cache
		.get(config.channels.deniedBugs)
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
		.get(config.channels.approvalQueue)
		.messages.fetch(report.messageId)
		.then((msg) => msg.delete());
}

function PlatformColor(platform) {
	let color = "";
	switch (platform) {
		case config.channels.desktopBugs:
			color = config.colors.desktop;
			break;
		case config.channels.androidBugs:
			color = config.colors.android;
			break;
		case config.channels.iosBugs:
			color = config.colors.ios;
			break;
		case config.channels.marketingBugs:
			color = config.colors.marketing;
			break;
		default:
			color = "8b0000";
			break;
	}
	return color;
}
