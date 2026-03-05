export interface RoadmapEntry {
  role: string;
  requiredSkills: string[];
  learningPath: string[];
  recommendedProjects: string[];
}

const roadmaps: Record<string, RoadmapEntry> = {
  "backend developer": {
    role: "Backend Developer",
    requiredSkills: ["Node.js", "Express", "REST APIs", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Docker", "Git", "JWT", "TypeScript"],
    learningPath: [
      "1. Master JavaScript & TypeScript",
      "2. Learn Node.js and Express.js",
      "3. Understand REST API design",
      "4. Learn SQL (MySQL / PostgreSQL)",
      "5. Learn NoSQL (MongoDB)",
      "6. Authentication with JWT & OAuth",
      "7. Containerization with Docker",
      "8. Learn System Design basics",
      "9. Learn Redis for caching"
    ],
    recommendedProjects: [
      "REST API with JWT auth",
      "E-commerce backend",
      "Real-time chat server with Socket.io",
      "URL shortener service"
    ]
  },

  "frontend developer": {
    role: "Frontend Developer",
    requiredSkills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "Redux", "REST APIs", "Git", "Responsive Design"],
    learningPath: [
      "1. Master HTML, CSS, JavaScript",
      "2. Learn TypeScript",
      "3. Learn React.js + hooks",
      "4. State management with Redux or Zustand",
      "5. Styling with Tailwind CSS",
      "6. Consuming REST APIs with Axios",
      "7. Learn Next.js",
      "8. Testing with Jest + React Testing Library",
      "9. Performance optimization techniques"
    ],
    recommendedProjects: [
      "Personal portfolio",
      "Job board UI with filters",
      "E-commerce product page",
      "Dashboard with charts (Recharts / D3)"
    ]
  },

  "full stack developer": {
    role: "Full Stack Developer",
    requiredSkills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB", "MySQL", "REST APIs", "Git", "Docker", "JWT"],
    learningPath: [
      "1. Frontend: HTML, CSS, JS, React",
      "2. Backend: Node.js, Express, REST APIs",
      "3. Databases: MySQL + MongoDB",
      "4. Authentication: JWT & sessions",
      "5. Learn TypeScript on both ends",
      "6. DevOps basics: Docker, CI/CD",
      "7. Learn Next.js for full-stack",
      "8. System design fundamentals"
    ],
    recommendedProjects: [
      "Full stack job portal",
      "Social media clone",
      "Real-time collaborative app",
      "SaaS dashboard with auth"
    ]
  },

  "data scientist": {
    role: "Data Scientist",
    requiredSkills: ["Python", "Pandas", "NumPy", "Scikit-learn", "Machine Learning", "SQL", "Data Visualization", "Statistics", "TensorFlow", "Jupyter"],
    learningPath: [
      "1. Master Python for data",
      "2. Data manipulation with Pandas & NumPy",
      "3. Statistics & probability fundamentals",
      "4. SQL for data querying",
      "5. Machine learning with Scikit-learn",
      "6. Data visualization (Matplotlib, Seaborn)",
      "7. Deep learning with TensorFlow / PyTorch",
      "8. Feature engineering & model evaluation",
      "9. Deploy ML models as APIs"
    ],
    recommendedProjects: [
      "Sales prediction model",
      "Sentiment analysis on tweets",
      "Image classifier with CNN",
      "Recommendation system"
    ]
  }
};

export default roadmaps;
