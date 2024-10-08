export async function sendSlackNotification(
  version: string,
  summary: string,
  score: number,
): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    throw new Error("SLACK_WEBHOOK_URL is not set");
  }

  const message = {
    text: `New high-impact Next.js release detected!`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New high-impact Next.js release detected!*\n\nVersion: ${version}\nImpact Score: ${score}\n\nSummary:\n${summary}`,
        },
      },
    ],
  };

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send Slack notification: ${response.statusText}`,
    );
  }
}
