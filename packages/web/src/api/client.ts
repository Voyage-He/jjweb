/**
 * API Client for communicating with the backend
 */

import type {
  RepoStatusResponse,
  LogResponse,
  FilesResponse,
  DiffResponse,
  OperationsResponse,
  OpenRepoRequest,
  OpenRepoResponse,
  CloneRepoRequest,
  CloneRepoResponse,
  InitRepoRequest,
  InitRepoResponse,
  BookmarksResponse,
  CreateBookmarkRequest,
  WorkingCopyStatusResponse,
  SettingsResponse,
  UpdateSettingsRequest,
  AliasesResponse,
  CreateAliasRequest,
  ErrorResponse,
  CommitDetailResponse,
} from '@jujutsu-gui/shared';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Try to parse JSON, handle empty responses
      let data: unknown;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      } else {
        data = {};
      }

      if (!response.ok) {
        throw new Error((data as ErrorResponse).message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  // Repository
  async getHealth() {
    return this.request<{ status: string; repoPath: string | null }>('/health');
  }

  async getRepoStatus() {
    return this.request<RepoStatusResponse>('/repo/status');
  }

  async openRepo(body: OpenRepoRequest) {
    return this.request<OpenRepoResponse>('/repo/open', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async cloneRepo(body: CloneRepoRequest) {
    return this.request<CloneRepoResponse>('/repo/clone', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async initRepo(body: InitRepoRequest) {
    return this.request<InitRepoResponse>('/repo/init', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async closeRepo() {
    return this.request<{ success: boolean }>('/repo/close', {
      method: 'POST',
    });
  }

  async getRecentRepos() {
    return this.request<{ repos: Array<{ path: string; name: string; lastOpened: number }> }>('/repo/recent');
  }

  async removeRecentRepo(path: string) {
    return this.request<{ success: boolean }>(`/repo/recent/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
  }

  // Log and commits
  async getLog(params: { limit?: number; offset?: number; revset?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    if (params.revset) searchParams.set('revset', params.revset);
    const query = searchParams.toString();
    return this.request<LogResponse>(`/repo/log${query ? `?${query}` : ''}`);
  }

  async getCommitDetail(revision: string) {
    return this.request<CommitDetailResponse>(`/repo/show/${revision}`);
  }

  async getFiles(params: { path?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.path) searchParams.set('path', params.path);
    const query = searchParams.toString();
    return this.request<FilesResponse>(`/repo/files${query ? `?${query}` : ''}`);
  }

  async getDiff(filePath: string, params: { from?: string; to?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    return this.request<DiffResponse>(`/repo/diff/${filePath}${query ? `?${query}` : ''}`);
  }

  // Operations
  async getOperations(params: { limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return this.request<OperationsResponse>(`/repo/operations${query ? `?${query}` : ''}`);
  }

  async undoOperation(operationId?: string) {
    return this.request<{ success: boolean }>('/operations/undo', {
      method: 'POST',
      body: JSON.stringify({ operationId }),
    });
  }

  async redoOperation() {
    return this.request<{ success: boolean }>('/operations/redo', {
      method: 'POST',
    });
  }

  // Changes
  async newChange(body: { description?: string; after?: string }) {
    return this.request<{ success: boolean; changeId: string }>('/changes/new', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async editDescription(id: string, description: string) {
    return this.request<{ success: boolean }>(`/changes/${id}/description`, {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  async abandonChange(id: string) {
    return this.request<{ success: boolean }>(`/changes/${id}`, {
      method: 'DELETE',
    });
  }

  async moveChange(id: string, body: { destination: string; insertAfter?: boolean }) {
    return this.request<{ success: boolean }>(`/changes/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async squashChange(id: string, body: { description?: string; keepOriginal?: boolean } = {}) {
    return this.request<{ success: boolean }>(`/changes/${id}/squash`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async splitChange(id: string, files: string[]) {
    return this.request<{ success: boolean }>(`/changes/${id}/split`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  }

  // Bookmarks
  async getBookmarks() {
    return this.request<BookmarksResponse>('/bookmarks');
  }

  async createBookmark(body: CreateBookmarkRequest) {
    return this.request<{ success: boolean; name: string }>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteBookmark(name: string) {
    return this.request<{ success: boolean }>(`/bookmarks/${name}`, {
      method: 'DELETE',
    });
  }

  async moveBookmark(name: string, target: string) {
    return this.request<{ success: boolean }>(`/bookmarks/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ target }),
    });
  }

  // Working copy
  async getWorkingCopyStatus() {
    return this.request<WorkingCopyStatusResponse>('/working-copy/status');
  }

  async discardFileChanges(path: string) {
    return this.request<{ success: boolean }>(`/working-copy/files/${path}`, {
      method: 'DELETE',
    });
  }

  async restoreFile(path: string) {
    return this.request<{ success: boolean }>(`/working-copy/files/${path}`, {
      method: 'POST',
    });
  }

  // Settings
  async getSettings() {
    return this.request<SettingsResponse>('/settings');
  }

  async updateSettings(body: UpdateSettingsRequest) {
    return this.request<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async getAliases() {
    return this.request<AliasesResponse>('/settings/aliases');
  }

  async createAlias(body: CreateAliasRequest) {
    return this.request<{ success: boolean }>('/settings/aliases', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteAlias(name: string) {
    return this.request<{ success: boolean }>(`/settings/aliases/${name}`, {
      method: 'DELETE',
    });
  }

  // Conflicts
  async getConflicts() {
    return this.request<{ conflicts: Array<{ path: string; status: string }> }>('/conflicts');
  }

  async resolveConflict(path: string, body: { resolution: string; content?: string }) {
    return this.request<{ success: boolean }>(`/conflicts/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Ignore
  async addToIgnore(body: { path?: string; pattern?: string }) {
    return this.request<{ success: boolean; entry: string; message?: string }>('/ignore', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
