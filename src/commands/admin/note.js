const Report = require("../../models/report")
const ReportHandler = require("../../handlers/report")
const clc = require("cli-color");

module.exports = {
	name: "note",
	category: "admin",
	description: "Adds a note to the report",
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
       

        await Report.findOneAndUpdate(
          { _id: foundReport._id }, 
          { $push: { notes: `${message.author.username}#${message.author.discriminator}: ${aMessage}` }},
      );

      ReportHandler.UpdateStance(client,  await r({reportID: id}))
     
  },
};
