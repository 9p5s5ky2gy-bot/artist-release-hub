export const releaseTypes = ['Single', 'EP', 'Álbum', 'Clipe', 'Pré-save', 'Remix', 'Deluxe'];

export function getReleaseCover(release) {
  return release?.coverImage || release?.coverImageUrl || release?.coverUrl || '';
}

export function getReleaseType(release) {
  return release?.releaseType || release?.type || 'Single';
}
