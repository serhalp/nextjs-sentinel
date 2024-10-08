interface GitHubRelease {
  tag_name: string;
  body: string;
  html_url: string;
}

export async function getLatestNextjsReleases(
  count: number,
): Promise<Array<{ version: string; body: string; url: string }>> {
  const response = await fetch(
    `https://api.github.com/repos/vercel/next.js/releases?per_page=${count}`,
  );
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }
  const data: GitHubRelease[] = await response.json();
  return data.map((release) => ({
    version: release.tag_name,
    body: release.body,
    url: release.html_url,
  }));
}
