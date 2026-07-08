import { ExternalLink, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSpotifySearchUrl, searchArtistsOnPlatforms } from '../services/platformSearch';

function formatFollowers(value) {
  if (value === null || value === undefined) return 'Seguidores não disponíveis';
  return `${new Intl.NumberFormat('pt-BR').format(value)} seguidores`;
}

export function PlatformArtistSearch({ stageName, onSelect }) {
  const [query, setQuery] = useState(stageName || '');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [externalSearchUrl, setExternalSearchUrl] = useState('');
  const [manualSpotifyUrl, setManualSpotifyUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stageName && !query) setQuery(stageName);
  }, [query, stageName]);

  async function handleSearch(event) {
    event?.preventDefault();
    setLoading(true);
    setMessage('');
    setResults([]);
    setExternalSearchUrl('');

    try {
      const response = await searchArtistsOnPlatforms(query || stageName || '');
      setResults(response.results || []);
      setMessage(response.message || (response.results?.length ? '' : 'Nenhum artista encontrado.'));
      setExternalSearchUrl(response.externalSearchUrl || getSpotifySearchUrl(query || stageName || ''));
    } catch (error) {
      setMessage(error.message || 'Busca indisponível. Você ainda pode cadastrar manualmente.');
      setExternalSearchUrl(getSpotifySearchUrl(query || stageName || ''));
    } finally {
      setLoading(false);
    }
  }

  function getSpotifyArtistId(url) {
    const match = String(url || '').match(/open\.spotify\.com\/artist\/([^?/#]+)/i);
    return match?.[1] || '';
  }

  function handleManualSpotifyLink() {
    const url = manualSpotifyUrl.trim();
    if (!url) {
      setMessage('Cole o link do perfil do Spotify para vincular.');
      return;
    }

    onSelect({
      id: `spotify-manual-${Date.now()}`,
      platform: 'Spotify',
      platformId: getSpotifyArtistId(url),
      name: query || stageName || 'Artista',
      url,
      image: '',
      followers: null,
    });
    setMessage('Spotify vinculado. Salve o artista para manter a alteracao.');
  }

  return (
    <section className="platform-search-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Encontrar artista nas plataformas</span>
          <h2>Buscar artista nas plataformas</h2>
        </div>
        <Sparkles size={19} />
      </div>

      <div className="platform-search-form">
        <label>
          Nome para busca
          <span className="input-with-icon">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch(event);
              }}
              placeholder="Nome artistico"
            />
          </span>
        </label>
        <button className="secondary-button" disabled={loading} onClick={handleSearch} type="button">
          <Search size={16} />
          <span>{loading ? 'Buscando...' : 'Buscar'}</span>
        </button>
      </div>

      {message && <p className="platform-search-message">{message}</p>}

      {externalSearchUrl && (
        <>
          <a className="secondary-button compact external-search-link" href={externalSearchUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            <span>Abrir busca no Spotify</span>
          </a>
          <div className="platform-search-form">
            <label>
              Link do perfil no Spotify
              <input value={manualSpotifyUrl} onChange={(event) => setManualSpotifyUrl(event.target.value)} placeholder="https://open.spotify.com/artist/..." />
            </label>
            <button className="secondary-button" onClick={handleManualSpotifyLink} type="button">Vincular Spotify</button>
          </div>
        </>
      )}

      {results.length > 0 && (
        <div className="platform-results">
          {results.map((artist) => (
            <article className="platform-result" key={artist.id}>
              {artist.image ? <img src={artist.image} alt={artist.name} /> : <div className="platform-result-fallback">{artist.name[0]}</div>}
              <div>
                <strong>{artist.name}</strong>
                <span>{artist.platform} · {formatFollowers(artist.followers)}</span>
                <small>ID: {artist.platformId}</small>
              </div>
              <button className="secondary-button compact" onClick={() => onSelect(artist)} type="button">
                Selecionar
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
