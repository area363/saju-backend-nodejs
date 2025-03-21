const { IncomingWebhook } = require("@slack/webhook");

let webhook = null;

if (process.env.SLACK_KEY) {
  webhook = new IncomingWebhook(process.env.SLACK_KEY);
}

exports.slackMessage = async (color, title, msg, timestamp) => {
  if (!webhook) return; // 💥 Prevent error when SLACK_KEY is missing
  return await webhook.send({
    attachments: [
      {
        color,
        title,
        text: msg,
        ts: timestamp,
      },
    ],
  });
};
