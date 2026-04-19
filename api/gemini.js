/**
 * POST /api/gemini
 * Body: { type: 'resume' | 'tags', text?: string, description?: string }
 * Returns: { skills: string[] }
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI not configured' })
  }

  const { type, text, description } = req.body || {}

  let prompt
  if (type === 'resume') {
    if (!text) return res.status(400).json({ error: 'text is required for resume extraction' })
    prompt = `You are a skill extractor. Given the following resume text, return ONLY a valid JSON array of skill tag strings. Use ONLY tags from this list: ${JSON.stringify(TAXONOMY)}. Return at most 15 tags. No explanations, no markdown, just the JSON array.

Resume text:
${text.slice(0, 4000)}`
  } else if (type === 'tags') {
    if (!description) return res.status(400).json({ error: 'description is required for tag suggestions' })
    prompt = `You are a skill tag suggester for a project collaboration platform. Given the following project description, return ONLY a valid JSON array of up to 8 skill tag strings. Use ONLY tags from this list: ${JSON.stringify(TAXONOMY)}. No explanations, no markdown, just the JSON array.

Project description:
${description.slice(0, 1000)}`
  } else {
    return res.status(400).json({ error: 'type must be "resume" or "tags"' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      if (response.status === 429) {
        return res.status(429).json({ error: 'AI rate limit hit — add skills manually' })
      }
      throw new Error(err.error?.message || `Gemini error ${response.status}`)
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    // Extract JSON array from response
    const match = rawText.match(/\[[\s\S]*\]/)
    if (!match) return res.status(200).json({ skills: [] })

    let parsed
    try {
      parsed = JSON.parse(match[0])
    } catch {
      return res.status(200).json({ skills: [] })
    }

    if (!Array.isArray(parsed)) return res.status(200).json({ skills: [] })

    // Validate against taxonomy
    const taxonomySet = new Set(TAXONOMY.map((s) => s.toLowerCase()))
    const valid = parsed.filter(
      (s) => typeof s === 'string' && taxonomySet.has(s.toLowerCase())
    )

    // Normalize to original taxonomy casing
    const taxonomyMap = Object.fromEntries(TAXONOMY.map((s) => [s.toLowerCase(), s]))
    const normalized = valid.map((s) => taxonomyMap[s.toLowerCase()] || s)

    return res.status(200).json({ skills: normalized })
  } catch (err) {
    console.error('gemini error:', err)
    return res.status(500).json({ error: 'AI extraction failed' })
  }
}
