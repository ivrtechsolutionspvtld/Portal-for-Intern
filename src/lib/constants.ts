export const ROLES = {
  ADMIN: 'ADMIN',
  MENTOR: 'MENTOR',
  STUDENT: 'STUDENT',
} as const;

export type RoleType = keyof typeof ROLES;

export const DOMAINS = [
  {
    id: 'full-stack-web',
    name: 'Full-Stack Web Development',
    duration: '8 Weeks',
    level: 'Intermediate - Advanced',
    techStack: ['Next.js', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
    description: 'Master full-cycle web architecture, scalable REST & GraphQL APIs, secure authentication, and modern serverless deployments.',
    projects: ['Enterprise SaaS Platform', 'Real-Time Collaboration Engine', 'Omnichannel Commerce Gateway'],
    icon: 'Layers',
  },
  {
    id: 'ai-ml-engineering',
    name: 'Artificial Intelligence & Machine Learning',
    duration: '10 Weeks',
    level: 'Advanced',
    techStack: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'FastAPI', 'HuggingFace'],
    description: 'Build production-ready predictive models, LLM agents, RAG pipelines, and automated MLOps pipelines with model monitoring.',
    projects: ['Domain-Specific LLM Assistant', 'Multimodal Vision Classifier', 'Financial Risk Scoring Engine'],
    icon: 'Brain',
  },
  {
    id: 'cloud-devops',
    name: 'Cloud Computing & DevOps Architecture',
    duration: '8 Weeks',
    level: 'Intermediate',
    techStack: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Prometheus'],
    description: 'Design resilient microservice topologies on AWS (Mumbai), automated infrastructure as code (IaC), and Zero-Downtime CI/CD.',
    projects: ['ECS Fargate Multi-Region Cluster', 'Automated GitOps Pipeline', 'Site Reliability Monitoring Stack'],
    icon: 'Cloud',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity & InfoSec Operations',
    duration: '8 Weeks',
    level: 'Intermediate - Advanced',
    techStack: ['Wireshark', 'Burp Suite', 'Metasploit', 'OWASP Top 10', 'NIST Framework', 'Splunk'],
    description: 'Protect critical enterprise perimeters, conduct vulnerability assessments, implement DPDP compliance, and SOC incident triage.',
    projects: ['Enterprise Pen-Testing Audit', 'Zero Trust IAM Architecture', 'Automated SIEM Threat Hunter'],
    icon: 'ShieldCheck',
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application Engineering',
    duration: '8 Weeks',
    level: 'Intermediate',
    techStack: ['React Native', 'Flutter', 'TypeScript', 'Firebase', 'Redux Toolkit', 'Fastlane'],
    description: 'Engineer cross-platform iOS and Android mobile apps featuring offline caching, biometric authentication, and push notifications.',
    projects: ['Fintech Mobile Wallet', 'Telehealth Consultation App', 'Field Agent Logistics Tracker'],
    icon: 'Smartphone',
  },
  {
    id: 'data-engineering',
    name: 'Data Engineering & Analytics Big Data',
    duration: '10 Weeks',
    level: 'Advanced',
    techStack: ['Apache Spark', 'Kafka', 'dbt', 'Snowflake', 'Airflow', 'PostgreSQL'],
    description: 'Construct high-throughput streaming and batch data pipelines, enterprise data warehouses, and modern lakehouse architectures.',
    projects: ['Real-Time Telemetry Pipeline', 'Lakehouse Analytics Warehouse', 'Automated ETL Orchestrator'],
    icon: 'Database',
  },
  {
    id: 'ui-ux-design',
    name: 'Enterprise UI/UX Product Design',
    duration: '6 Weeks',
    level: 'All Levels',
    techStack: ['Figma', 'Design Systems', 'WCAG 2.1 AA', 'User Research', 'Prototyping', 'Miro'],
    description: 'Craft research-backed, accessible enterprise design systems, complex dashboard UX heuristics, and interactive micro-interactions.',
    projects: ['Multi-Tenant Design System', 'Healthcare Portal Redesign', 'Fintech Analytics Studio'],
    icon: 'Palette',
  },
  {
    id: 'vlsi-embedded',
    name: 'Embedded Systems & IoT Engineering',
    duration: '8 Weeks',
    level: 'Advanced',
    techStack: ['C/C++', 'RTOS', 'ARM Cortex', 'ESP32', 'MQTT', 'PCB Design'],
    description: 'Develop low-power firmware, real-time operating systems, industrial IoT telemetry nodes, and hardware-software security interfaces.',
    projects: ['Smart Industrial Gateway', 'Low-Power BLE Sensor Node', 'Automotive CAN Telemetry Logger'],
    icon: 'Cpu',
  },
];

export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export const SUBMISSION_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
} as const;

export const APPLICATION_GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc5WXW3u_3AKe4iw7QrUBzkH97ASIiyXmyifTr0cXH6cK8KdA/viewform';

export const COMPANY_INFO = {
  name: 'IVR TECH SOLUTIONS PRIVATE LIMITED',
  shortName: 'IVR',
  tagline: 'Building Skills. Creating Opportunities. Shaping Careers.',
  established: 2018,
  cin: 'U72900MH2018PTC318920',
  headquarters: 'Remote-First Operations (Pan-India)',
  regionalOffice: 'Virtual Fellowship & Engineering Labs',
  supportEmail: 'admin@ivrtechsolution.in',
  admissionsEmail: 'admin@ivrtechsolution.in',
  phone: '+91 8143177907',
  registrationFee: 499,
  programFee: 4999,
  currency: 'INR',
  currencySymbol: '₹',
  googleFormUrl: APPLICATION_GOOGLE_FORM_URL,
};

