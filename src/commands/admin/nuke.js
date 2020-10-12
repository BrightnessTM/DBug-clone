const Report = require("../../models/report")
const clc = require("cli-color");
const fs = require('fs');

const json = fs.readFileSync("./src/config.json");
const config = JSON.parse(json)
module.exports = {
	name: "nuke",
	category: "admin",
	description: "Nukes report",
	roles: ["763860080772775976", "763860111176237057"],
	run: async (client, message, args) => {
        const id = args[0]
     
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
        

        await Report.findOneAndUpdate(
          { _id: foundReport._id }, 
          { stance: `Nuked`},
      );


       client.channels.cache.get(config.channels.approvalQueue).messages.fetch(foundReport.messageId).then(msg => msg.delete())
     
  },
};
