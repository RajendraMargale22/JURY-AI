import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Template {
  _id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  downloads: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface TemplatesResponse {
  templates: Template[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const templateService = {
  // Get all templates with pagination and filters
  async getTemplates(
    page: number = 1,
    limit: number = 12,
    category?: string,
    search?: string
  ): Promise<TemplatesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category && category !== 'all') {
      params.append('category', category);
    }

    if (search) {
      params.append('search', search);
    }

    const response = await axios.get(`${API_URL}/templates?${params.toString()}`);
    const payload = response.data as any;

    if (payload?.data && typeof payload.data === 'object') {
      return payload.data as TemplatesResponse;
    }

    return payload as TemplatesResponse;
  },

  // Get template categories
  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${API_URL}/templates/categories`);
    const payload = response.data as any;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.categories)) {
      return payload.categories;
    }

    return [];
  },

  // Get specific template
  async getTemplate(id: string): Promise<Template> {
    const response = await axios.get(`${API_URL}/templates/${id}`);
    const payload = response.data as any;
    return (payload?.data || payload) as Template;
  },

  // Upload new template
  async uploadTemplate(
    title: string,
    description: string,
    category: string,
    file: File,
    token: string
  ): Promise<Template> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/templates/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    return (response.data as any).template as Template;
  },

  // Download template
  async downloadTemplate(id: string, token: string): Promise<string> {
    const response = await axios.post(
      `${API_URL}/templates/${id}/download`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return (response.data as any).downloadUrl as string;
  },

  // Get template file
  async getTemplateFile(id: string, token: string): Promise<Blob> {
    const response = await axios.get(`${API_URL}/templates/${id}/file`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
      responseType: 'blob',
    });

    return response.data as Blob;
  },
};
