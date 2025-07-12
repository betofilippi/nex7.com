import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      hashedPassword: await hashPassword('password123'),
      provider: 'local',
      role: 'USER',
    },
  });

  console.log('Created test user:', testUser);

  // Create sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      title: 'Sample Conversation',
      userId: testUser.id,
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Hello Claude, can you help me with a React component?',
          },
          {
            role: 'ASSISTANT',
            content: 'Of course! I\'d be happy to help you with a React component. What specific component are you working on or what functionality are you trying to implement?',
          },
        ],
      },
    },
  });

  console.log('Created sample conversation:', conversation.id);

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'My Next.js App',
      description: 'A sample Next.js application',
      userId: testUser.id,
      framework: 'nextjs',
      status: 'ACTIVE',
    },
  });

  console.log('Created sample project:', project.id);

  // Create sample workflow
  const workflow = await prisma.workflow.create({
    data: {
      name: 'API Integration Workflow',
      description: 'A workflow for integrating external APIs',
      userId: testUser.id,
      projectId: project.id,
      nodes: {
        create: [
          {
            type: 'ai',
            position: { x: 100, y: 100 },
            data: { label: 'Claude AI', model: 'claude-3-opus' },
          },
          {
            type: 'code',
            position: { x: 300, y: 100 },
            data: { label: 'Process Data', language: 'javascript' },
          },
        ],
      },
    },
  });

  console.log('Created sample workflow:', workflow.id);

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });