import { createClient } from "@libsql/client";
import { getLatestNextjsReleases } from "@/lib/github";
import { analyzeReleaseNotes } from "@/lib/openai";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  try {
    // Drop existing table
    await client.execute(`DROP TABLE IF EXISTS releases`);

    // Create new table
    await client.execute(`
      CREATE TABLE releases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        summary TEXT NOT NULL,
        score INTEGER NOT NULL,
        relevance TEXT NOT NULL,
        releaseLink TEXT NOT NULL,
        relevantPRs TEXT NOT NULL,
        analyzed_at TEXT NOT NULL
      )
    `);

    console.log("Table created successfully");

    // Fetch 10 most recent releases
    const releases = await getLatestNextjsReleases(10);

    // Analyze and insert releases
    for (const release of releases) {
      const analysis = await analyzeReleaseNotes(release.version, release.body);
      await client.execute({
        sql: "INSERT INTO releases (version, summary, score, relevance, releaseLink, relevantPRs, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          release.version,
          analysis.summary,
          analysis.score,
          analysis.relevance,
          release.url,
          JSON.stringify(analysis.relevantPRs ?? []),
          new Date().toISOString(),
        ],
      });
      console.log(`Inserted release ${release.version}`);
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrate();
