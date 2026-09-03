import { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface AuditLogResponse {
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

function toAuditLogResponse(log: AuditLog): AuditLogResponse {
  return {
    id: log.id,
    userId: log.userId,
    userEmail: log.userEmail,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId ?? '',
    payload: log.payload,
    ip: log.ip ?? '',
    userAgent: log.userAgent ?? '',
    createdAt: log.createdAt.toISOString(),
  };
}

export const auditLogService = {
  /**
   * List audit log entries with optional filters. Proprietor only.
   * `limit` caps the result set (default 100, max 500) to keep the UI
   * snappy.
   */
  async list(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLogResponse[]> {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;

    const limit = Math.min(filters.limit ?? 100, 500);

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toAuditLogResponse);
  },

  /**
   * Write a new audit log entry. Best-effort: errors are swallowed
   * so a logging failure never breaks the user-facing operation.
   */
  async log(input: {
    userId: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId?: string;
    payload?: Record<string, unknown> | string | null;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const payloadStr =
      input.payload === null || input.payload === undefined
        ? null
        : typeof input.payload === 'string'
          ? input.payload
          : JSON.stringify(input.payload);

    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          userEmail: input.userEmail,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          payload: payloadStr,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Audit logging must never break the request.
      // eslint-disable-next-line no-console
      console.error('[auditLog] failed to write log entry:', error);
    }
  },
};
