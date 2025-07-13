export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  projectId: string;
  url: string;
  status: 'building' | 'ready' | 'error' | 'canceled';
  createdAt: Date;
}

export async function getProjects(): Promise<Project[]> {
  return [];
}

export async function getProjectById(id: string): Promise<Project | null> {
  return null;
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: data.name,
    description: data.description,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getDeployments(projectId: string): Promise<Deployment[]> {
  return [];
}
