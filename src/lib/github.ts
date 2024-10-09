import { Octokit } from "@octokit/rest";

export async function getLatestNextjsReleases(
  count: number,
  token = process.env.GITHUB_TOKEN,
): Promise<Array<{ version: string; body: string; url: string }>> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.repos.listReleases({
    owner: "vercel",
    repo: "next.js",
    per_page: count,
  });

  return data.map((release) => ({
    version: release.tag_name,
    body: release.body ?? "",
    url: release.html_url,
  }));
}
