export const SKILL_TAXONOMY = [
  // Languages
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Bash',
  'SQL', 'HTML', 'CSS',

  // Frontend
  'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'TailwindCSS',
  'Bootstrap', 'Material UI', 'Figma', 'Adobe XD', 'UI/UX Design',

  // Backend
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
  'Ruby on Rails', 'GraphQL', 'REST APIs', 'gRPC',

  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS', 'Expo',

  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Redis', 'Supabase',
  'SQLite', 'DynamoDB', 'Cassandra',

  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
  'GitHub Actions', 'Linux', 'Nginx', 'Vercel', 'Netlify',

  // AI / ML
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow',
  'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Data Analysis',
  'Data Science', 'LLMs', 'Generative AI', 'Reinforcement Learning',

  // Other Tech
  'Git', 'Blockchain', 'Web3', 'Solidity', 'Cybersecurity', 'Networking',
  'Embedded Systems', 'IoT', 'AR/VR', 'Game Development', 'Unity',

  // Non-tech
  'Agile', 'Scrum', 'Product Management', 'Project Management',
  'Technical Writing', 'Research', 'Data Engineering', 'Business Analysis',
  'Marketing', 'Design', 'Video Editing', 'Content Creation',
]

export const GITHUB_LANGUAGE_MAP = {
  'Jupyter Notebook': 'Python',
  'Shell': 'Bash',
  'HCL': 'Terraform',
  'Dockerfile': 'Docker',
  'SCSS': 'CSS',
  'SASS': 'CSS',
  'Less': 'CSS',
  'PLpgSQL': 'PostgreSQL',
  'Makefile': 'Bash',
  'PowerShell': 'Bash',
  'Vue': 'Vue',
  'Svelte': 'Svelte',
}

export function normalizeGithubLanguage(lang) {
  return GITHUB_LANGUAGE_MAP[lang] || lang
}

export function filterToTaxonomy(skills) {
  const taxonomyLower = new Set(SKILL_TAXONOMY.map((s) => s.toLowerCase()))
  return skills.filter((s) => taxonomyLower.has(s.toLowerCase()))
}

export function searchTaxonomy(query) {
  if (!query) return SKILL_TAXONOMY
  const q = query.toLowerCase()
  return SKILL_TAXONOMY.filter((s) => s.toLowerCase().includes(q))
}
