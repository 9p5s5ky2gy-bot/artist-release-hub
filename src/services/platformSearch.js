const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';

function mapSpotifyArtist(item) {
  return {
    id: `spotify-${item.id}`,
    platform: 'Spotify',
    platformId: item.id,
    name: item.name,
    url: item.external_urls?.spotify || '',
    image: item.images?.[0]?.url || '',
    followers: item.followers?.total ?? null,
  };
}

export function getSpotifySearchUrl(query) {
  return `https://open.spotify.com/search/${encodeURIComponent(query || '')}/artists`;
}

export async function searchArtistsOnPlatforms(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return { results: [], message: 'Digite um nome artístico para buscar.' };

  const spotifyToken = import.meta.env.VITE_SPOTIFY_ACCESS_TOKEN;

  if (!spotifyToken) {
    return {
      results: [],
      externalSearchUrl: getSpotifySearchUrl(cleanQuery),
      message: 'Busca automática do Spotify preparada. Sem token configurado, use a busca externa ou preencha manualmente.',
    };
  }

  const url = `${SPOTIFY_SEARCH_URL}?type=artist&limit=6&q=${encodeURIComponent(cleanQuery)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${spotifyToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível buscar no Spotify agora. O cadastro manual continua disponível.');
  }

  const data = await response.json();
  return {
    results: (data.artists?.items || []).map(mapSpotifyArtist),
    externalSearchUrl: getSpotifySearchUrl(cleanQuery),
    message: '',
  };
}
