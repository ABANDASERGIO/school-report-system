import { apiClient } from '@/lib/api-client';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
}

function buildQuery(filters: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
}): string {
  const sp = new URLSearchParams();
  if (filters.userId) sp.set('userId', filters.userId);
  if (filters.entityType) sp.set('entityType', filters.entityType);
  if (filters.entityId) sp.set('entityId', filters.entityId);
  if (filters.action) sp.set('action', filters.action);
  if (filters.limit) sp.set('limit', String(filters.limit));
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const auditLogService = {
  async list(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>(`/audit-logs${buildQuery(filters)}`);
  },
};
