import { AxiosInstance } from 'axios';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ListProjectsResponse,
  PaginationParams,
} from '../types';

export class ProjectsResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * List all projects
   */
  async list(params?: PaginationParams): Promise<ListProjectsResponse> {
    const response = await this.axios.get('/projects', { params });
    return response.data;
  }

  /**
   * Create a new project
   */
  async create(data: CreateProjectRequest): Promise<Project> {
    const response = await this.axios.post('/projects', data);
    return response.data;
  }

  /**
   * Get a project by ID
   */
  async get(projectId: string): Promise<Project> {
    const response = await this.axios.get(`/projects/${projectId}`);
    return response.data;
  }

  /**
   * Update a project
   */
  async update(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await this.axios.put(`/projects/${projectId}`, data);
    return response.data;
  }

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<void> {
    await this.axios.delete(`/projects/${projectId}`);
  }
}