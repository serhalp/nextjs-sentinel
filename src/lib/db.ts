import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface Release {
  version: string;
  summary: string;
  score: number;
  relevance: string;
  analyzed_at: string;
  releaseLink: string;
  relevantPRs: string[];
}

export async function getAnalyzedReleases(): Promise<Release[]> {
  const result = await client.execute(
    "SELECT * FROM releases ORDER BY analyzed_at DESC",
  );
  // TODO(serhalp) Verify the right turso typing pattern
  return result.rows.map(row => ({
    ...row,
    relevantPRs: JSON.parse(row.relevantPRs as string)
  })) as unknown[] as Release[];
}

export async function insertAnalyzedRelease(
  version: string,
  summary: string,
  score: number,
  relevance: string,
  releaseLink: string,
  relevantPRs: string[],
): Promise<void> {
  await client.execute({
    sql: "INSERT INTO releases (version, summary, score, relevance, releaseLink, relevantPRs, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      version,
      summary,
      score,
      relevance,
      releaseLink,
      JSON.stringify(relevantPRs),
      new Date().toISOString()
    ],
  });
}
