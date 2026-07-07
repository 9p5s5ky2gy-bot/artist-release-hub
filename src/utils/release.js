export const releaseTypes = ['Single', 'EP', 'Álbum', 'Clipe', 'Pré-save', 'Remix', 'Deluxe'];

export function getReleaseCover(release) {
  return release?.coverImage || release?.coverImageUrl || release?.coverUrl || '';
}

export function getReleaseType(release) {
  return release?.releaseType || release?.type || 'Single';
}

export function getDailyActionCount(release) {
  const value = Number(release?.dailyActionCount || release?.postsPerDay || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.min(3, Math.max(1, Math.round(value)));
}
