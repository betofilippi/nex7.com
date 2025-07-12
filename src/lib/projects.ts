import { prisma } from './prisma';
import { Project as PrismaProject, Deployment as PrismaDeployment, ProjectStatus, DeploymentStatus } from '@prisma/client';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  framework?: string | null;
  repository?: string | null;
  status: ProjectStatus;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
  deployments?: Deployment[];
}

export interface Deployment {
  id: string;
  projectId: string;
  userId: string;
  deploymentId: string;
  url?: string | null;
  status: DeploymentStatus;
  environment: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function createProject(
  userId: string,
  name: string,
  description?: string,
  framework?: string,
  repository?: string,
  settings?: any
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      name,
      description,
      userId,
      framework,
      repository,
      settings,
    }
  });
  
  return project;
}

export async function findProjectById(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      deployments: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });
  
  return project;
}

export async function listUserProjects(
  userId: string,
  status?: ProjectStatus
): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: {
      userId,
      ...(status && { status })
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      deployments: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });
  
  return projects;
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  try {
    const project = await prisma.project.update({
      where: {
        id: projectId,
        userId,
      },
      data: {
        name: updates.name,
        description: updates.description,
        framework: updates.framework,
        repository: updates.repository,
        status: updates.status,
        settings: updates.settings,
      }
    });
    
    return project;
  } catch (error) {
    return null;
  }
}

export async function createDeployment(
  projectId: string,
  userId: string,
  deploymentId: string,
  environment: string = 'production',
  metadata?: any
): Promise<Deployment> {
  const deployment = await prisma.deployment.create({
    data: {
      projectId,
      userId,
      deploymentId,
      environment,
      metadata,
    }
  });
  
  return deployment;
}

export async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  url?: string
): Promise<Deployment | null> {
  try {
    const deployment = await prisma.deployment.update({
      where: { deploymentId },
      data: {
        status,
        ...(url && { url }),
      }
    });
    
    return deployment;
  } catch (error) {
    return null;
  }
}

export async function findDeploymentById(
  deploymentId: string
): Promise<Deployment | null> {
  const deployment = await prisma.deployment.findUnique({
    where: { deploymentId }
  });
  
  return deployment;
}

export async function listProjectDeployments(
  projectId: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Deployment[]> {
  const deployments = await prisma.deployment.findMany({
    where: {
      projectId,
      userId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
  
  return deployments;
}