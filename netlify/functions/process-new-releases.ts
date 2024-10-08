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
      return new Response(JSON.stringify({ message: "Release already analyzed" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify({ message: "Release analyzed and stored" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in check-nextjs-release function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config: Config = {
  schedule: "0 * * * *",
};
