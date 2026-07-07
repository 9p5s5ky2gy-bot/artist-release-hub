import { formatDateInput, addDays } from '../utils/date';
import { generateTasksForRelease } from '../utils/calendar';

export function createDemoData() {
  const artists = [
    {
      id: 'artist-luna-norte',
      stageName: 'Luna Norte',
      legalName: 'Marina Costa',
      instagram: 'https://instagram.com/lunanorte',
      tiktok: 'https://tiktok.com/@lunanorte',
      youtube: 'https://youtube.com/@lunanorte',
      spotify: 'https://open.spotify.com/artist/lunanorte',
      email: 'contato@lunanorte.com',
      phone: '+55 11 90000-0000',
      notes: 'Pop alternativo com estética noturna, letras confessionais e comunidade ativa no Instagram.',
      genre: 'Pop alternativo',
      archetype: 'Sonhadora urbana, visual neon editorial',
      visualColors: '#59e3a7, #ff6b6b, #15181f',
    },
    {
      id: 'artist-matteo-riva',
      stageName: 'Matteo Riva',
      legalName: 'Mateus Ribeiro',
      instagram: 'https://instagram.com/matteoriva',
      tiktok: 'https://tiktok.com/@matteoriva',
      youtube: 'https://youtube.com/@matteoriva',
      spotify: 'https://open.spotify.com/artist/matteoriva',
      email: 'mgmt@matteoriva.com',
      phone: '+55 21 98888-0000',
      notes: 'R&B brasileiro, voz suave, foco em Reels com storytelling romântico.',
      genre: 'R&B / Soul',
      archetype: 'Romântico elegante, estética filme 35mm',
      visualColors: '#f4c95d, #4fc3f7, #111111',
    },
  ];

  const releases = [
    {
      id: 'release-noite-clara',
      artistId: 'artist-luna-norte',
      songTitle: 'Noite Clara',
      releaseDate: formatDateInput(addDays(new Date(), 14)),
      presaveDate: formatDateInput(addDays(new Date(), 0)),
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
      presaveLink: 'https://example.com/presave-noite-clara',
      spotifyLink: '',
      youtubeLink: '',
      tiktokLink: 'https://tiktok.com/@lunanorte',
      instagramLink: 'https://instagram.com/lunanorte',
      driveLink: 'https://drive.google.com',
      canvaLink: 'https://canva.com',
      customLinks: [{ label: 'Press kit', url: 'https://example.com/press-kit' }],
      notes: 'Campanha com foco em pré-save, contagem regressiva e vídeos de estética noturna.',
      status: 'pré-save ativo',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'release-ceu-em-mim',
      artistId: 'artist-matteo-riva',
      songTitle: 'Céu em Mim',
      releaseDate: formatDateInput(addDays(new Date(), -3)),
      presaveDate: formatDateInput(addDays(new Date(), -17)),
      coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
      presaveLink: 'https://example.com/presave-ceu-em-mim',
      spotifyLink: 'https://open.spotify.com',
      youtubeLink: 'https://youtube.com',
      tiktokLink: 'https://tiktok.com/@matteoriva',
      instagramLink: 'https://instagram.com/matteoriva',
      driveLink: 'https://drive.google.com',
      canvaLink: '',
      customLinks: [],
      notes: 'Já lançado. Manter pós-lançamento com cortes de letra e prova social.',
      status: 'pós-lançamento',
      createdAt: new Date().toISOString(),
    },
  ];

  const tasks = releases.flatMap((release) => generateTasksForRelease(release));

  return { artists, releases, tasks };
}
