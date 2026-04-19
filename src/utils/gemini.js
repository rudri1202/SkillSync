/**
 * Calls the Gemini API directly from the browser.
 * Requires VITE_GEMINI_API_KEY in .env (VITE_ prefix exposes it to the frontend).
 */

const TAXONOMY = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Bash',
  'SQL', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
  'TailwindCSS', 'Bootstrap', 'Material UI', 'Figma', 'Adobe XD', 'UI/UX Design',
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
  'Ruby on Rails', 'GraphQL', 'REST APIs', 'gRPC', 'React Native', 'Flutter',
  'Android', 'iOS', 'Expo', 'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Redis',
  'Supabase', 'SQLite', 'DynamoDB', 'Cassandra', 'AWS', 'GCP', 'Azure', 'Docker',
  'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Nginx', 'Vercel',
  'Netlify', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Data Analysis',
  'Data Science', 'LLMs', 'Generative AI', 'Reinforcement Learning', 'Git',
  'Blockchain', 'Web3', 'Solidity', 'Cybersecurity', 'Networking',
  'Embedded Systems', 'IoT', 'AR/VR', 'Game Development', 'Unity', 'Agile',
  'Scrum', 'Product Management', 'Project Management', 'Technical Writing',
  'Research', 'Data Engineering', 'Business Analysis', 'Marketing', 'Design',
  'Video Editing', 'Content Creation',
]

const TAXONOMY_SET = new Set(TAXONOMY.map((s) => s.toLowerCase()))
const TAXONOMY_MAP = Object.fromEntries(TAXONOMY.map((s) => [s.toLowerCase(), s]))

// Models tried in order — lite/flash are most permissive on free tier
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
]

async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in .env')

  let lastErr
  for (const model of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      }
    )

    if (res.status === 429) {
      // Extract retry delay from the error body if available
      const err = await res.json().catch(() => ({}))
      const retryMsg = err.error?.message || ''
      const seconds = retryMsg.match(/retry in ([\d.]+)s/i)?.[1]
      lastErr = new Error(
        seconds
          ? `Rate limit hit — please retry in ${Math.ceil(Number(seconds))}s`
          : 'Rate limit hit — please wait a moment and try again'
      )
      lastErr.status = 429
      continue // try next model
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `Gemini error ${res.status}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    console.debug('[Gemini] raw response:', rawText)
    const match = rawText.match(/\[[\s\S]*?\]/)
    if (!match) return []

    let parsed
    try { parsed = JSON.parse(match[0]) } catch { return [] }
    if (!Array.isArray(parsed)) return []

    const results = parsed
      .filter((s) => typeof s === 'string' && TAXONOMY_SET.has(s.toLowerCase()))
      .map((s) => TAXONOMY_MAP[s.toLowerCase()] || s)
    console.debug('[Gemini] matched skills:', results)
    return results
  }

  throw lastErr || new Error('All Gemini models unavailable')
}

/** Extract skills from resume text (max ~4000 chars). */
export async function extractSkillsFromResume(text) {
  const prompt = `You are a skill extractor. Given the following resume text, return ONLY a valid JSON array of skill tag strings. Use ONLY tags from this list: ${JSON.stringify(TAXONOMY)}. Return at most 15 tags. No explanations, no markdown, just the JSON array.\n\nResume text:\n${text.slice(0, 4000)}`
  return callGemini(prompt)
}

/** Suggest skill tags for a project based on its description. */
export async function suggestTagsForDescription(description) {
  const prompt = `You are a skill tag suggester for a project collaboration platform. Given the following project description, return ONLY a valid JSON array of up to 8 skill tag strings. Use ONLY tags from this list: ${JSON.stringify(TAXONOMY)}. No explanations, no markdown, just the JSON array.\n\nProject description:\n${description.slice(0, 1000)}`
  return callGemini(prompt)
}
