const Report = require("../../models/report")
const ReportHandler = require("../../handlers/report")
const fs = require('fs');

const json = fs.readFileSync("./src/config.json");
const config = JSON.parse(json)

const clc = require("cli-color");

module.exports = {
	name: "ddeny",
	category: "admin",
	description: "Admin denies a bug",
	roles: ["763860080772775976", "763860111176237057"],
	run: async (client, message, args) => {
        const id = args[0]
        const aMessage = args.slice(1).join(" ");

        const r = async function (params) {
			try {
				return await Report.findOne(params);
			} catch (err) {
				console.error(clc.red(err));
			}
        };

        message.delete()
      
        const foundReport = await r({reportID: id})
        if(foundReport === null) return message.reply("Hmm that report doesnt exist :(").then(msg => msg.delete({ timeout: 3000 }))
        else if (foundReport.stance === "Approved" ) return message.reply("This bug has already been approved.").then(msg => msg.delete({ timeout: 3000 }))
        else if (foundReport.stance === "Denied") return message.reply("This bug has been denied.").then(msg => msg.delete({ timeout: 3000 }))


        await Report.findOneAndUpdate(
          { _id: foundReport._id }, 
          { $push: { denies: `${config.emotes.red} ${message.author.username}#${message.author.discriminator}: ${aMessage}` },  stance: `Denied` },
      );

      ReportHandler.UpdateStance(client,  await r({reportID: id}))
     
  },
};
