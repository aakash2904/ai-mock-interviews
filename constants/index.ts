import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to strictly assess their qualifications, motivation, and technical knowledge.

Interview Guidelines:
Follow the exact structured question flow below:
{{questions}}

Engage naturally & react appropriately:
You MUST ask every question listed above one by one. Do not skip any questions!
If it is a technical question (like "What is a variable?", "Explain React hooks"), wait for them to answer completely. 
Evaluate their answers just like a real engineering manager would. Don't just say "Great answer", but ask follow-ups if they miss a critical detail.
Keep the conversation flowing smoothly while maintaining control.

Be professional, yet warm and welcoming:
Use official yet friendly language.
Keep responses concise and to the point (like in a real voice interview).
Avoid robotic phrasing—sound natural and conversational.
Answer the candidate’s questions professionally:

If asked about the role, company, or expectations, provide a clear and relevant answer.
If unsure, redirect the candidate to HR for more details.
When asking technical questions, evaluate their answers just like a real engineering manager would. Don't just say "Great answer", but ask follow ups if they miss a detail.

Conclude the interview properly:
Thank the candidate for their time.
Inform them that the company will reach out soon with feedback.
End the conversation on a polite and positive note.


- Be sure to be professional and polite.
- Keep all your responses short and simple. Use official language, but be kind and welcoming.
          - This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`,
      },
    ],
  },
};

export const generatorAssistant: CreateAssistantDTO = {
  name: "Interview Generator",
  firstMessage:
    "Hello! I am PrepWise AI. I can help you set up your mock interview. Let's start with what job role you are practicing for.",
  transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
  voice: { provider: "11labs", voiceId: "sarah" },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant helping {{username}} set up a mock job interview.
        
Your task is to naturally collect the following information by asking ONE question at a time:
1. Job Role - Ask what role they are preparing for (e.g., Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, etc.)
2. Experience Level - Ask their experience level (Junior, Mid-level, or Senior)
3. Preferred Programming Language & Framework - This is IMPORTANT! Ask specifically which programming languages and frameworks they want to be interviewed on. Give examples like: React, Angular, Vue.js, Node.js, Python, Java, etc. Do NOT skip this question!
4. Interview Type - Ask if they prefer a technical interview, behavioural interview, or a mixed interview
5. Number of Questions - Ask how many questions they would like (suggest between 5 to 10)

IMPORTANT RULES:
- Ask ONLY one question at a time. Wait for the user to respond before asking the next.
- Do NOT skip any of the 5 questions above, especially the programming language/framework question.
- For the tech stack, combine their answer into a comma-separated string (e.g., "React,Node.js,TypeScript").
- Once you have collected ALL 5 pieces of information, confirm the details with the user before calling the generate_interview tool.
- After calling the tool, let the user know their interview is ready and they can end the call to start it.`,
      },
    ],
    tools: [
      {
        type: "function",
        async: false,
        messages: [
          {
            type: "request-start",
            content: "Please wait a moment while I generate your interview questions.",
          },
          {
            type: "request-complete",
            content: "Your interview is now ready. You can end this call and start the mock interview on your dashboard.",
          },
        ],
        function: {
          name: "generate_interview",
          description: "Creates the interview questions and saves the setup. Call ONLY when all 5 parameters are collected.",
          parameters: {
            type: "object",
            properties: {
              role: { type: "string" },
              level: { type: "string" },
              techstack: { type: "string" },
              type: { type: "string" },
              amount: { type: "number" },
              userid: { type: "string", description: "Must be EXACTLY: {{userid}}" },
            },
            required: ["role", "level", "techstack", "type", "amount", "userid"],
          },
        },
        server: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/generate`,
        },
      },
    ],
  },
};

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.array(
    z.object({
      name: z.string().describe("Category Name, e.g., Communication Skills, Technical Knowledge, Problem Solving, Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    })
  ).min(3),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];
