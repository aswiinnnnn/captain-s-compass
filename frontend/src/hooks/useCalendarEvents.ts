/**
 * useCalendarEvents — React Query hook for the Risk Calendar API.
 *
 * Maps the backend's snake_case response fields to the frontend's
 * camelCase CalendarEvent shape and normalises the severity casing
 * (backend mixes "high" / "High" depending on provider).
 *
 * Endpoints used:
 *   GET  /api/calendar/          — list events (with optional ?port_id / ?event_type)
 *   POST /api/calendar/          — create a user event
 *   DELETE /api/calendar/{id}    — delete an event
 *   POST /api/calendar/sync      — trigger external provider sync
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarEvent, CalendarEventType } from '@/data/portIntelligenceData';

const API_BASE = '/api/calendar';

// ── Backend response shape (snake_case) ───────────────────────
interface ApiEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  detail: string;
  port_id: string | null;
  region: string;
  start_date: string;
  end_date: string;
  severity: string;
}

interface SyncResult {
  synced: number;
}

// ── Normalisers ────────────────────────────────────────────────
function normalizeSeverity(s: string): CalendarEvent['severity'] {
  switch (s.toLowerCase()) {
    case 'critical': return 'Critical';
    case 'high':     return 'High';
    case 'medium':
    case 'moderate': return 'Moderate';
    default:         return 'Low';
  }
}

function mapApiEvent(e: ApiEvent): CalendarEvent {
  return {
    id:          e.id,
    type:        e.type as CalendarEventType,
    title:       e.title,
    description: e.description,
    detail:      e.detail ?? '',
    portId:      e.port_id,
    region:      e.region,
    startDate:   e.start_date,
    endDate:     e.end_date,
    severity:    normalizeSeverity(e.severity),
  };
}

// ── API helpers ────────────────────────────────────────────────
async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch calendar events (${res.status})`);
  const data: ApiEvent[] = await res.json();
  return data.map(mapApiEvent);
}

async function createCalendarEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const body = {
    type:        event.type,
    title:       event.title,
    description: event.description,
    detail:      event.detail,
    port_id:     event.portId ?? null,
    region:      event.region,
    start_date:  event.startDate,
    end_date:    event.endDate,
    severity:    event.severity,
  };
  const res = await fetch(API_BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create event (${res.status})`);
  return mapApiEvent(await res.json());
}

async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete event (${res.status})`);
}

async function syncCalendarEvents(): Promise<SyncResult> {
  const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
  if (!res.ok) throw new Error(`Sync failed (${res.status})`);
  return res.json();
}

// ── Hook ───────────────────────────────────────────────────────
export function useCalendarEvents() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey:  ['calendarEvents'],
    queryFn:   fetchCalendarEvents,
    staleTime: 5 * 60 * 1000,   // consider fresh for 5 min; re-fetch on sync
  });

  const addMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  const removeMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  const syncMutation = useMutation({
    mutationFn: syncCalendarEvents,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  return {
    events:      query.data ?? [],
    isLoading:   query.isLoading,
    isError:     query.isError,
    /** POST a new user-created event */
    addEvent:    addMutation.mutate,
    /** DELETE an event by id */
    removeEvent: removeMutation.mutate,
    /** Trigger the external provider sync (Tavily + holidays + weather) */
    syncEvents:  syncMutation.mutate,
    isSyncing:   syncMutation.isPending,
  };
}
