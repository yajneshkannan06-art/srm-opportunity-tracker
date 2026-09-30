export const EMAIL_DOMAIN = '@srmist.edu.in'

export const DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'EIE', 'Mechanical', 'Civil', 'Biotech',
  'Biomedical', 'Chemical', 'Mechatronics', 'Automobile', 'Aerospace', 'Other',
]

export const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Web Development': ['web', 'react', 'next.js', 'frontend', 'backend', 'node'],
  'AI / ML': ['ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch'],
  'Data Science': ['data', 'analytics', 'pandas', 'sql', 'power bi', 'tableau'],
  'Cybersecurity': ['security', 'cyber', 'ethical hacking', 'pentest', 'ctf'],
  'App Development': ['android', 'ios', 'flutter', 'kotlin', 'mobile'],
  'Cloud / DevOps': ['cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops'],
  'IoT / Embedded': ['iot', 'embedded', 'arduino', 'raspberry', 'vlsi'],
  'Robotics': ['robotics', 'ros', 'automation', 'drone'],
  'Core Engineering': ['cad', 'autocad', 'solidworks', 'matlab', 'ansys'],
  'Design / UI-UX': ['design', 'figma', 'ui', 'ux'],
  'Research': ['research', 'paper', 'publication'],
  'Entrepreneurship': ['startup', 'entrepreneur', 'pitch', 'ideathon'],
}
export const INTERESTS = Object.keys(INTEREST_KEYWORDS)

export const SKILL_SUGGESTIONS = [
  'React', 'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Node.js',
  'SQL', 'Machine Learning', 'Figma', 'Arduino', 'MATLAB', 'AutoCAD',
]
