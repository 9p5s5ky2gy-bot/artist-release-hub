import { supabase } from './supabaseClient';

const WORKSPACE_TABLE = 'release_hub_workspaces';

export const emptyWorkspace = {
  artists: [],
  releases: [],
  tasks: [],
  dayCompletions: {},
  pitching: [],
  pitchBriefs: {},
  pitchChecklists: {},
  briefings: [],
  reports: [],
};

export function normalizeWorkspace(data) {
  const safeData = data && typeof data === 'object' ? data : {};
  return {
    ...safeData,
    artists: Array.isArray(data?.artists) ? data.artists : [],
    releases: Array.isArray(data?.releases) ? data.releases : [],
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    dayCompletions: data?.dayCompletions && typeof data.dayCompletions === 'object' ? data.dayCompletions : {},
    pitching: Array.isArray(data?.pitching) ? data.pitching : [],
    pitchBriefs: data?.pitchBriefs && typeof data.pitchBriefs === 'object' ? data.pitchBriefs : {},
    pitchChecklists: data?.pitchChecklists && typeof data.pitchChecklists === 'object' ? data.pitchChecklists : {},
    briefings: Array.isArray(data?.briefings) ? data.briefings : [],
    reports: Array.isArray(data?.reports) ? data.reports : [],
  };
}

export function hasWorkspaceData(data) {
  const workspace = normalizeWorkspace(data);
  return (
    workspace.artists.length > 0 ||
    workspace.releases.length > 0 ||
    workspace.tasks.length > 0 ||
    Object.keys(workspace.dayCompletions).length > 0 ||
    workspace.pitching.length > 0 ||
    Object.keys(workspace.pitchBriefs).length > 0 ||
    Object.keys(workspace.pitchChecklists).length > 0 ||
    workspace.briefings.length > 0 ||
    workspace.reports.length > 0
  );
}

export async function loadWorkspace(userId) {
  const { data, error } = await supabase
    .from(WORKSPACE_TABLE)
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    workspace: normalizeWorkspace(data?.data),
    updatedAt: data?.updated_at || null,
    exists: Boolean(data),
  };
}

export async function saveWorkspace(userId, workspace) {
  const payload = {
    user_id: userId,
    data: normalizeWorkspace(workspace),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(WORKSPACE_TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('updated_at')
    .single();

  if (error) throw error;

  return data?.updated_at || payload.updated_at;
}
