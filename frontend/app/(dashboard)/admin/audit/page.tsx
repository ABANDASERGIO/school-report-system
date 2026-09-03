"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { showToast } from "@/components/ui/Toast";
import { auditLogService, type AuditLog } from "@/services/audit-log.service";
import { RefreshCw, History, Filter } from "lucide-react";

const ACTION_COLORS: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  RESULT_BULK_SUBMIT: "success",
  RESULT_SEQUENCE_LOCK: "info",
  TEACHER_PASSWORD_RESET: "warning",
  STUDENT_CREATE: "info",
  STUDENT_DELETE: "danger",
  TEACHER_CREATE: "success",
  TEACHER_SUSPEND: "danger",
  TEACHER_ACTIVATE: "success",
  ENROLLMENT_CREATE: "info",
  ENROLLMENT_WITHDRAW: "warning",
  ASSIGNMENT_CREATE: "info",
  ASSIGNMENT_DELETE: "danger",
  SESSION_CREATE: "info",
  SESSION_SET_CURRENT: "info",
  SETTINGS_UPDATE: "neutral",
};

export default function AuditLogPage() {
  const { isProprietor } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterUserEmail, setFilterUserEmail] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await auditLogService.list({
        action: filterAction || undefined,
        entityType: filterEntityType || undefined,
        userId: filterUserEmail || undefined,
        limit: 200,
      });
      setLogs(data);
    } catch (err) {
      showToast({ type: "error", title: "Failed to load audit logs" });
    } finally {
      setIsLoading(false);
    }
  }, [filterAction, filterEntityType, filterUserEmail]);

  useEffect(() => {
    if (isProprietor) loadLogs();
  }, [isProprietor, loadLogs]);

  if (!isProprietor) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-xl font-bold text-primary">Audit Log</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-8">
              Only the proprietor can view the audit log.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            {logs.length} most recent entr{logs.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={loadLogs}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-primary">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Action"
              placeholder="e.g. TEACHER_PASSWORD_RESET"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            />
            <Input
              label="Entity Type"
              placeholder="e.g. Teacher, Student, Sequence"
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
            />
            <Input
              label="User ID"
              placeholder="User ID (UUID)"
              value={filterUserEmail}
              onChange={(e) => setFilterUserEmail(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilterAction("");
                setFilterEntityType("");
                setFilterUserEmail("");
              }}
            >
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={loadLogs}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <History className="h-8 w-8 mx-auto text-gray-300" />
              <p className="text-sm text-gray-500 mt-2">No audit log entries match these filters.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const color = ACTION_COLORS[log.action] || "neutral";
                return (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={color} size="sm">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            on <span className="font-medium text-primary">{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-gray-400"> · {log.entityId.slice(0, 8)}…</span>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          by <span className="font-medium">{log.userEmail}</span>{" "}
                          <span className="text-gray-400">
                            · {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </p>
                        {log.payload && (
                          <pre className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                            {formatPayload(log.payload)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatPayload(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}
