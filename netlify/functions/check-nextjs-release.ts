import type { Config } from "@netlify/functions";
import { getLatestNextjsReleases } from "@/lib/github";
import { analyzeReleaseNotes } from "@/lib/openai";
import { getAnalyzedReleases, insertAnalyzedRelease } from "@/lib/db";
import { sendSlackNotification } from "@/lib/slack";

export default async function handler() {
  try {
    const [latestRelease] = await getLatestNextjsReleases(1);
    const existingReleases = await getAnalyzedReleases();

    if (
      existingReleases.some(
        (release) => release.version === latestRelease.version,
      )
    ) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Release already analyzed" }),
      };
    }

    const analysis = await analyzeReleaseNotes(
      latestRelease.version,
      latestRelease.body,
    );
    await insertAnalyzedRelease(
      latestRelease.version,
      analysis.summary,
      analysis.score,
      analysis.relevance,
    );

    if (analysis.score > 60) {
      await sendSlackNotification(
        latestRelease.version,
        analysis.summary,
        analysis.score,
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Release analyzed and stored" }),
    };
  } catch (error) {
    console.error("Error in check-nextjs-release function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}

export const config: Config = {
  schedule: "0 * * * *",
};
