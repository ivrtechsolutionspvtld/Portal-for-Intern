import prisma from '../src/lib/prisma';

export const SIX_DOMAINS = [
  {
    code: 'IVR-CRS-AIML',
    title: 'Artificial Intelligence & Machine Learning (AIML)',
    domain: 'Artificial Intelligence & Machine Learning (AIML)',
    description: 'Master core machine learning algorithms, deep learning neural networks, computer vision, natural language processing, LLM agents, and automated AI pipelines.',
    department: 'AI & Data Science',
    durationWeeks: 8,
    level: 'Intermediate - Advanced',
    techStack: 'Python, PyTorch, TensorFlow, Scikit-Learn, OpenCV, FastAPI, HuggingFace',
    projects: 'Predictive Analytics Engine, Multimodal Vision Classifier, Autonomous LLM Assistant',
  },
  {
    code: 'IVR-CRS-VLSI',
    title: 'VLSI',
    domain: 'VLSI',
    description: 'Specialized curriculum in Verilog HDL programming, RTL synthesis, digital logic architecture, simulation, FPGA basics, and testbench functional verification.',
    department: 'Electronics & Communication',
    durationWeeks: 8,
    level: 'Intermediate',
    techStack: 'Verilog HDL, ModelSim, Quartus, EDA Playground, FPGA, Testbenches',
    projects: '8-Bit ALU Design, FIFO Buffer Verification, Digital System Controller',
  },
  {
    code: 'IVR-CRS-WEBDEV',
    title: 'Web Development',
    domain: 'Web Development',
    description: 'Comprehensive modern full-stack web engineering with responsive frontend interfaces, RESTful APIs, database design, serverless deployment, and authentication.',
    department: 'Software Engineering',
    durationWeeks: 8,
    level: 'Intermediate',
    techStack: 'React, Next.js, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS',
    projects: 'Enterprise Portal Platform, Real-Time Collaboration Hub, E-Commerce Infrastructure',
  },
  {
    code: 'IVR-CRS-PYFULLSTACK',
    title: 'Python Full Stack Developer',
    domain: 'Python Full Stack Developer',
    description: 'Full-cycle Python application engineering spanning Django/FastAPI microservices, relational databases, asynchronous task queues, and modern client interfaces.',
    department: 'Software Engineering',
    durationWeeks: 8,
    level: 'Intermediate',
    techStack: 'Python, Django, FastAPI, Celery, PostgreSQL, Redis, React, Docker',
    projects: 'Scalable Microservices Gateway, Asynchronous Task Queue System, Data Dashboard',
  },
  {
    code: 'IVR-CRS-CLOUD',
    title: 'Cloud Computing',
    domain: 'Cloud Computing',
    description: 'Enterprise cloud architecture, infrastructure as code, container orchestration with Kubernetes, CI/CD pipeline automation, and multi-region resilience.',
    department: 'Cloud & Infrastructure',
    durationWeeks: 8,
    level: 'Intermediate - Advanced',
    techStack: 'AWS, Docker, Kubernetes, Terraform, GitHub Actions, Linux, Prometheus',
    projects: 'Multi-Tier Cloud Infrastructure, Automated GitOps Pipeline, High-Availability Cluster',
  },
  {
    code: 'IVR-CRS-JAVAFULLSTACK',
    title: 'Java Full Stack Developer',
    domain: 'Java Full Stack Developer',
    description: 'Enterprise Java software engineering utilizing Spring Boot microservices, Hibernate/JPA ORM, secured JWT authentication, and interactive React frontends.',
    department: 'Software Engineering',
    durationWeeks: 8,
    level: 'Intermediate - Advanced',
    techStack: 'Java, Spring Boot, Hibernate, PostgreSQL, REST APIs, React, Maven, Docker',
    projects: 'Core Banking API Service, Distributed Order Processing System, Enterprise Portal',
  },
];

async function seed() {
  console.log('Seeding official 6 domains...');

  for (const item of SIX_DOMAINS) {
    // Check if course already exists by code or title
    const existing = await prisma.course.findFirst({
      where: {
        OR: [
          { code: item.code },
          { title: item.title },
          { domain: item.domain },
        ],
      },
    });

    let courseId = existing?.id;

    if (!existing) {
      const created = await prisma.course.create({
        data: {
          code: item.code,
          title: item.title,
          domain: item.domain,
          description: item.description,
          department: item.department,
          durationWeeks: item.durationWeeks,
          level: item.level,
          status: 'ACTIVE',
        },
      });
      courseId = created.id;
      console.log(`✔ Created Course: ${item.title}`);
    } else {
      console.log(`- Course already exists: ${existing.title} (${existing.code})`);
    }

    // Ensure corresponding InternshipProgram exists
    const existingProg = await prisma.internshipProgram.findFirst({
      where: {
        OR: [
          { title: item.title },
          { domain: item.domain },
        ],
      },
    });

    if (!existingProg) {
      await prisma.internshipProgram.create({
        data: {
          title: item.title,
          description: item.description,
          domain: item.domain,
          courseId: courseId,
          duration: `${item.durationWeeks} Weeks`,
          level: item.level,
          techStack: item.techStack,
          projects: item.projects,
          stipend: 'Performance Based',
          mode: 'Virtual / Remote',
          status: 'ACTIVE',
        },
      });
      console.log(`✔ Created Internship Program: ${item.title}`);
    } else {
      console.log(`- Internship Program already exists: ${existingProg.title}`);
    }
  }

  console.log('Done seeding official 6 domains!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

