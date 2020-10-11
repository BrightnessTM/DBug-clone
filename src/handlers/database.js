const mongoose = require("mongoose");
const clc = require("cli-color");

const Report = require("../models/report")

module.exports = {
    SaveReport:async  (message, embed, platform, title, steps, actual, expected, clientSettings, systemSettings) => {
        const report = new Report({
            _id: mongoose.Types.ObjectId(),
            reportID: await Report.countDocuments().exec(),
            userID: message.author.id,
            userTag: `${message.author.username}#${message.author.discriminator}`,
            messageId: embed.id,
            platform: platform,
            title: title,
            stepsToReproduce: steps,
            expected: expected,
            actual: actual,
            system: systemSettings,
            client: clientSettings,
            stance: "",
            reportDate: new Date(),
          });
          report.save().catch((err) => console.error(clc.red(err)));

          console.log(`[!] New bug report: ${title} - #${await Report.countDocuments().exec()}`)

    }
}