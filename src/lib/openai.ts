import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnalysisResult {
  summary: string;
  score: number;
  relevance: string;
  releaseLink: string;
  relevantPRs: string[];
}

export async function analyzeReleaseNotes(
  version: string,
  releaseNotes: string,
): Promise<AnalysisResult> {
  const systemPrompt = `
    You are an AI assistant specialized in analyzing Next.js release notes for Netlify's engineering team.
    Your task is to summarize the key changes and improvements, and assess their relevance to Netlify.
    Focus on changes that might affect:
    1. The Netlify Next.js Runtime (github.com/netlify/next-runtime)
    2. Netlify's documentation (docs.netlify.com)
    3. Netlify's build process or edge functions for Next.js projects
    4. Any features that might require updates to Netlify's Next.js support

    Provide your analysis in JSON format with the following structure:
    {
      "summary": "Concise summary of key changes",
      "score": 0-100,
      "relevance": "Explanation of what contributed to the score, focusing on aspects relevant to Netlify. Keep it brief but technical, and only focus on what *does* make it relevant; ignore what does not.",
      "releaseLink": "Link to the GitHub release page",
      "relevantPRs": ["Array of links to relevant PRs"]
    }

    The score should reflect how likely it is that this release contains changes that matter to Netlify's engineering team.
    A higher score indicates more relevance and a higher likelihood of required changes to Netlify's systems or documentation.
  `;

  const userPrompt = `
    Analyze the following release notes for Next.js version ${version}:

    ${releaseNotes}

    Provide your analysis based on the instructions in the system prompt.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as AnalysisResult;
}
