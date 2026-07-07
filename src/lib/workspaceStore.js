import { supabase } from './supabaseClient';

const WORKSPACE_TABLE = 'release_hub_workspaces';

export const emptyWorkspace = {
  artists: [],
  releases: [],
  tasks: [],
  dayCompletions: {},
};

export function normalizeWorkspace(data) {
  return {
    artists: Array.isArray(data?.artists) ? data.artists : [],
    releases: Array.isArray(data?.releases) ? data.releases : [],
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    dayCompletions: data?.dayCompletions && typeof data.dayCompletions === 'object' ? data.dayCompletions : {},
  };
}

export function hasWorkspaceData(data) {
  const workspace = normalizeWorkspace(data);
  return (
    workspace.artists.length > 0 ||
    workspace.releases.length > 0 ||
    workspace.tasks.length > 0 ||
    Object.keys(workspace.dayCompletions).length > 0
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
