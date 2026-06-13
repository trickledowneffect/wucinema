// Mock media data for WU-CINE
// All titles are fictional/original - not real movies or shows

export interface Movie {
  id: string;
  title: string;
  year: number;
  runtime: number;
  rating: string;
  score: number;
  genres: string[];
  overview: string;
  backdropGradient: string;
  posterGradient: string;
  is4K: boolean;
  isHDR: boolean;
  isCached: boolean;
  hasSubtitles: boolean;
  isWatched: boolean;
  progress?: number;
  fileSize?: string;
  codec?: string;
  audioCodec?: string;
}

export interface TvShow {
  id: string;
  title: string;
  year: number;
  seasons: number;
  episodes: number;
  rating: string;
  genres: string[];
  overview: string;
  posterGradient: string;
  is4K: boolean;
  isHDR: boolean;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  avatarGradient: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  backdropGradient: string;
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  runtime: number;
  backdropGradient: string;
  is4K: boolean;
  isHDR: boolean;
}

export interface DownloadItem {
  id: string;
  title: string;
  quality: string;
  status: 'downloading' | 'completed' | 'queued' | 'paused' | 'failed';
  totalSize: string;
  downloadedSize?: string;
  speed?: string;
  progress?: number;
  date?: string;
  posterGradient: string;
}

export interface SubtitleResult {
  id: string;
  language: string;
  languageCode: string;
  releaseName: string;
  provider: string;
  matchPercentage: number;
  isHearingImpaired: boolean;
  downloadCount: number;
}

// ---------------------------------------------------------------------------
// Mock Movies
// ---------------------------------------------------------------------------

export const mockMovies: Movie[] = [
  {
    id: 'mov-001',
    title: 'Stellar Convergence',
    year: 2024,
    runtime: 148,
    rating: 'PG-13',
    score: 8.4,
    genres: ['Sci-Fi', 'Drama'],
    overview:
      'When a rogue astrophysicist discovers a pattern hidden in cosmic background radiation, she races to decode a message that could rewrite humanity\'s understanding of time itself.',
    backdropGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    posterGradient: 'linear-gradient(180deg, #1a1a4e 0%, #4a2c6e 50%, #8e44ad 100%)',
    is4K: true,
    isHDR: true,
    isCached: true,
    hasSubtitles: true,
    isWatched: false,
    fileSize: '58.2 GB',
    codec: 'HEVC',
    audioCodec: 'TrueHD Atmos',
  },
  {
    id: 'mov-002',
    title: 'The Glass Meridian',
    year: 2023,
    runtime: 127,
    rating: 'R',
    score: 7.9,
    genres: ['Thriller', 'Mystery'],
    overview:
      'A retired cartographer is drawn back into the field when ancient maps surface that reveal a network of hidden corridors beneath a European capital — corridors someone is willing to kill to keep secret.',
    backdropGradient: 'linear-gradient(135deg, #1c1c1c 0%, #2c3e50 50%, #4a6741 100%)',
    posterGradient: 'linear-gradient(180deg, #1b2838 0%, #2e4057 50%, #5e8c7a 100%)',
    is4K: true,
    isHDR: false,
    isCached: false,
    hasSubtitles: true,
    isWatched: true,
    fileSize: '42.7 GB',
    codec: 'HEVC',
    audioCodec: 'DTS-HD MA',
  },
  {
    id: 'mov-003',
    title: 'Echoes of Neon',
    year: 2025,
    runtime: 114,
    rating: 'R',
    score: 8.1,
    genres: ['Action', 'Cyberpunk'],
    overview:
      'In a rain-soaked megacity where memories can be bootlegged, a disgraced courier discovers her own past has been overwritten — and the original holds the key to toppling a corporate dynasty.',
    backdropGradient: 'linear-gradient(135deg, #0d0d2b 0%, #461b5e 40%, #ff6b6b 100%)',
    posterGradient: 'linear-gradient(180deg, #2d1b69 0%, #b91d73 50%, #f953c6 100%)',
    is4K: true,
    isHDR: true,
    isCached: true,
    hasSubtitles: true,
    isWatched: false,
    progress: 35,
    fileSize: '51.3 GB',
    codec: 'HEVC',
    audioCodec: 'TrueHD Atmos',
  },
  {
    id: 'mov-004',
    title: 'Crimson Tundra',
    year: 2024,
    runtime: 136,
    rating: 'R',
    score: 7.6,
    genres: ['War', 'Drama'],
    overview:
      'Two estranged siblings must cross a frozen no-man\'s-land to deliver a ceasefire treaty before dawn — but the landscape hides dangers older and stranger than any conflict.',
    backdropGradient: 'linear-gradient(135deg, #1a0a0a 0%, #4a1a1a 50%, #8b4513 100%)',
    posterGradient: 'linear-gradient(180deg, #2c0f0f 0%, #6b2d2d 50%, #c0392b 100%)',
    is4K: false,
    isHDR: false,
    isCached: false,
    hasSubtitles: true,
    isWatched: false,
    fileSize: '12.8 GB',
    codec: 'H.264',
    audioCodec: 'AAC 5.1',
  },
  {
    id: 'mov-005',
    title: 'Void Architect',
    year: 2025,
    runtime: 155,
    rating: 'PG-13',
    score: 9.1,
    genres: ['Sci-Fi', 'Horror'],
    overview:
      'The crew of a deep-space construction vessel begins to notice impossible geometry appearing in their blueprints — structures that seem to build themselves in the dark.',
    backdropGradient: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
    posterGradient: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #3a3a6e 100%)',
    is4K: true,
    isHDR: true,
    isCached: true,
    hasSubtitles: true,
    isWatched: false,
    fileSize: '62.1 GB',
    codec: 'HEVC',
    audioCodec: 'TrueHD Atmos',
  },
  {
    id: 'mov-006',
    title: 'The Last Frequency',
    year: 2023,
    runtime: 102,
    rating: 'PG',
    score: 7.3,
    genres: ['Drama', 'Music'],
    overview:
      'An aging radio host in a coastal town discovers her late-night broadcasts are reaching a listener who claims to be decades in the future — and needs her help to prevent a disaster.',
    backdropGradient: 'linear-gradient(135deg, #1a2a3a 0%, #2d6187 50%, #e8a87c 100%)',
    posterGradient: 'linear-gradient(180deg, #1b3a4b 0%, #3d7ea6 50%, #f5b971 100%)',
    is4K: false,
    isHDR: false,
    isCached: true,
    hasSubtitles: false,
    isWatched: true,
    fileSize: '8.4 GB',
    codec: 'H.264',
    audioCodec: 'AAC Stereo',
  },
  {
    id: 'mov-007',
    title: 'Parallel Dusk',
    year: 2024,
    runtime: 131,
    rating: 'PG-13',
    score: 8.7,
    genres: ['Sci-Fi', 'Romance'],
    overview:
      'Every sunset, a physicist in Tokyo and a painter in Lisbon share the same dream. When they finally meet, they realise their connection might be the only thing holding two diverging timelines together.',
    backdropGradient: 'linear-gradient(135deg, #2d1b4e 0%, #8b3a62 50%, #f4a460 100%)',
    posterGradient: 'linear-gradient(180deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)',
    is4K: true,
    isHDR: true,
    isCached: false,
    hasSubtitles: true,
    isWatched: false,
    fileSize: '54.9 GB',
    codec: 'HEVC',
    audioCodec: 'DTS-HD MA',
  },
  {
    id: 'mov-008',
    title: 'Iron Meridian',
    year: 2025,
    runtime: 142,
    rating: 'R',
    score: 8.0,
    genres: ['Action', 'Thriller'],
    overview:
      'A disavowed engineer discovers her former employer is constructing a trans-continental rail weapon. With a ragtag crew of saboteurs, she has 72 hours to derail the project — literally.',
    backdropGradient: 'linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 50%, #c97b2a 100%)',
    posterGradient: 'linear-gradient(180deg, #2c2c2c 0%, #5a4a3a 50%, #d4903a 100%)',
    is4K: true,
    isHDR: false,
    isCached: true,
    hasSubtitles: true,
    isWatched: false,
    progress: 82,
    fileSize: '45.6 GB',
    codec: 'HEVC',
    audioCodec: 'TrueHD 7.1',
  },
];

// ---------------------------------------------------------------------------
// Mock TV Shows
// ---------------------------------------------------------------------------

export const mockTvShows: TvShow[] = [
  {
    id: 'tv-001',
    title: 'Signal Decay',
    year: 2023,
    seasons: 3,
    episodes: 24,
    rating: 'TV-MA',
    genres: ['Sci-Fi', 'Thriller'],
    overview:
      'A team of radio astronomers working at a remote desert array begin receiving coherent signals — not from space, but from beneath the Earth\'s crust.',
    posterGradient: 'linear-gradient(180deg, #0c0c1d 0%, #1a3c5e 50%, #4ecdc4 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'tv-002',
    title: 'The Amber Protocol',
    year: 2024,
    seasons: 2,
    episodes: 16,
    rating: 'TV-14',
    genres: ['Political', 'Drama'],
    overview:
      'When a classified Cold War contingency plan surfaces on the dark web, a junior diplomat must navigate a web of allegiances to prevent its activation.',
    posterGradient: 'linear-gradient(180deg, #2c1810 0%, #8b6914 50%, #daa520 100%)',
    is4K: true,
    isHDR: false,
  },
  {
    id: 'tv-003',
    title: 'Phantom Circuit',
    year: 2025,
    seasons: 1,
    episodes: 8,
    rating: 'TV-MA',
    genres: ['Cyberpunk', 'Crime'],
    overview:
      'In a near-future where illegal neural mods are epidemic, a burned-out detective with her own off-the-books implants hunts a hacker who can rewrite personality.',
    posterGradient: 'linear-gradient(180deg, #1a0533 0%, #6b2fa0 50%, #e040fb 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'tv-004',
    title: 'Deep Frontier',
    year: 2022,
    seasons: 4,
    episodes: 40,
    rating: 'TV-PG',
    genres: ['Adventure', 'Sci-Fi'],
    overview:
      'A civilian research submarine discovers a vast underwater cave system teeming with bioluminescent life — and signs of an intelligence far older than humanity.',
    posterGradient: 'linear-gradient(180deg, #001a33 0%, #004466 50%, #0088aa 100%)',
    is4K: false,
    isHDR: false,
  },
  {
    id: 'tv-005',
    title: 'Obsidian Crown',
    year: 2024,
    seasons: 2,
    episodes: 20,
    rating: 'TV-MA',
    genres: ['Fantasy', 'Drama'],
    overview:
      'Five noble houses vie for a throne carved from volcanic glass in a realm where magic is fueled by sacrifice — and every alliance carries a blood price.',
    posterGradient: 'linear-gradient(180deg, #0d0d0d 0%, #2d1f3d 50%, #6b3fa0 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'tv-006',
    title: 'Neon Parish',
    year: 2025,
    seasons: 1,
    episodes: 10,
    rating: 'TV-14',
    genres: ['Comedy', 'Drama'],
    overview:
      'A disillusioned priest is reassigned to an eccentric parish in a neon-lit entertainment district, where saving souls means learning to love karaoke, poker nights, and very questionable fashion.',
    posterGradient: 'linear-gradient(180deg, #1a1a2e 0%, #e94560 50%, #ffdd57 100%)',
    is4K: false,
    isHDR: false,
  },
];

// ---------------------------------------------------------------------------
// Mock Cast
// ---------------------------------------------------------------------------

export const mockCast: CastMember[] = [
  {
    id: 'cast-001',
    name: 'Elara Thorne',
    character: 'Dr. Maren Voss',
    avatarGradient: 'linear-gradient(135deg, #3a2a1a 0%, #6b4c3b 50%, #a67c5b 100%)',
  },
  {
    id: 'cast-002',
    name: 'Kai Devereaux',
    character: 'Commander Idris',
    avatarGradient: 'linear-gradient(135deg, #2a2a3a 0%, #4b4b6b 50%, #7a7a9b 100%)',
  },
  {
    id: 'cast-003',
    name: 'Suki Namura',
    character: 'Lin Zhao',
    avatarGradient: 'linear-gradient(135deg, #3a1a2a 0%, #6b3b4c 50%, #9b5b7a 100%)',
  },
  {
    id: 'cast-004',
    name: 'Daniil Kross',
    character: 'Viktor Sable',
    avatarGradient: 'linear-gradient(135deg, #1a2a2a 0%, #3b5b5b 50%, #5b8b8b 100%)',
  },
  {
    id: 'cast-005',
    name: 'Lyric Fontaine',
    character: 'Ava Soleil',
    avatarGradient: 'linear-gradient(135deg, #3a2a1a 0%, #8b6b3b 50%, #c9a85b 100%)',
  },
  {
    id: 'cast-006',
    name: 'Mateo Ruiz-Bernal',
    character: 'Inspector Delgado',
    avatarGradient: 'linear-gradient(135deg, #2a1a1a 0%, #5b3b3b 50%, #8b5b5b 100%)',
  },
  {
    id: 'cast-007',
    name: 'Pria Chakravarti',
    character: 'Noor Asfar',
    avatarGradient: 'linear-gradient(135deg, #2a2a1a 0%, #5b5b3b 50%, #8b8b5b 100%)',
  },
  {
    id: 'cast-008',
    name: 'Oscar Lindström',
    character: 'Erik Halvdan',
    avatarGradient: 'linear-gradient(135deg, #1a2a3a 0%, #3b5b6b 50%, #5b8b9b 100%)',
  },
];

// ---------------------------------------------------------------------------
// Mock Collections
// ---------------------------------------------------------------------------

export const mockCollections: Collection[] = [
  {
    id: 'col-001',
    title: 'Sci-Fi Essentials',
    description: 'The definitive collection of mind-bending science fiction across decades.',
    itemCount: 24,
    backdropGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  {
    id: 'col-002',
    title: 'Thriller Marathon',
    description: 'Edge-of-your-seat thrillers guaranteed to keep the lights on.',
    itemCount: 18,
    backdropGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  {
    id: 'col-003',
    title: 'Director Spotlight',
    description: 'Curated filmographies from the most visionary directors working today.',
    itemCount: 32,
    backdropGradient: 'linear-gradient(135deg, #2d1b4e 0%, #5b2c6f 50%, #8e44ad 100%)',
  },
  {
    id: 'col-004',
    title: 'Award Winners',
    description: 'Critically acclaimed films that dominated the festival circuit.',
    itemCount: 15,
    backdropGradient: 'linear-gradient(135deg, #1a1a1a 0%, #4a3728 50%, #c9a84c 100%)',
  },
];

// ---------------------------------------------------------------------------
// Mock Continue Watching
// ---------------------------------------------------------------------------

export const mockContinueWatching: ContinueWatchingItem[] = [
  {
    id: 'cw-001',
    title: 'Echoes of Neon',
    progress: 25,
    runtime: 114,
    backdropGradient: 'linear-gradient(135deg, #0d0d2b 0%, #461b5e 40%, #ff6b6b 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'cw-002',
    title: 'Signal Decay',
    subtitle: 'S02 E05 — The Resonance',
    progress: 45,
    runtime: 52,
    backdropGradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a3c5e 50%, #4ecdc4 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'cw-003',
    title: 'Obsidian Crown',
    subtitle: 'S01 E08 — Blood Tithe',
    progress: 70,
    runtime: 58,
    backdropGradient: 'linear-gradient(135deg, #0d0d0d 0%, #2d1f3d 50%, #6b3fa0 100%)',
    is4K: true,
    isHDR: true,
  },
  {
    id: 'cw-004',
    title: 'Parallel Dusk',
    progress: 15,
    runtime: 131,
    backdropGradient: 'linear-gradient(135deg, #2d1b4e 0%, #8b3a62 50%, #f4a460 100%)',
    is4K: true,
    isHDR: true,
  },
];

// ---------------------------------------------------------------------------
// Mock Downloads
// ---------------------------------------------------------------------------

export const mockDownloads: DownloadItem[] = [
  {
    id: 'dl-001',
    title: 'Void Architect',
    quality: '4K HDR',
    status: 'downloading',
    totalSize: '62.1 GB',
    downloadedSize: '27.9 GB',
    speed: '24.3 MB/s',
    progress: 45,
    posterGradient: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #3a3a6e 100%)',
  },
  {
    id: 'dl-002',
    title: 'Phantom Circuit — Season 1',
    quality: '4K HDR',
    status: 'queued',
    totalSize: '84.5 GB',
    posterGradient: 'linear-gradient(180deg, #1a0533 0%, #6b2fa0 50%, #e040fb 100%)',
  },
  {
    id: 'dl-003',
    title: 'The Amber Protocol — S01',
    quality: '1080p',
    status: 'paused',
    totalSize: '32.0 GB',
    downloadedSize: '18.7 GB',
    progress: 58,
    posterGradient: 'linear-gradient(180deg, #2c1810 0%, #8b6914 50%, #daa520 100%)',
  },
  {
    id: 'dl-004',
    title: 'Iron Meridian',
    quality: '4K',
    status: 'completed',
    totalSize: '45.6 GB',
    date: '2025-06-08',
    posterGradient: 'linear-gradient(180deg, #2c2c2c 0%, #5a4a3a 50%, #d4903a 100%)',
  },
  {
    id: 'dl-005',
    title: 'The Last Frequency',
    quality: '1080p',
    status: 'completed',
    totalSize: '8.4 GB',
    date: '2025-06-06',
    posterGradient: 'linear-gradient(180deg, #1b3a4b 0%, #3d7ea6 50%, #f5b971 100%)',
  },
];

// ---------------------------------------------------------------------------
// Mock Subtitle Results
// ---------------------------------------------------------------------------

export const mockSubtitleResults: SubtitleResult[] = [
  {
    id: 'sub-001',
    language: 'English',
    languageCode: 'EN',
    releaseName: 'Stellar.Convergence.2024.2160p.WEB-DL.DDP5.1.Atmos.DV.MKV',
    provider: 'OpenSubtitles',
    matchPercentage: 98,
    isHearingImpaired: false,
    downloadCount: 14320,
  },
  {
    id: 'sub-002',
    language: 'Spanish',
    languageCode: 'ES',
    releaseName: 'Stellar.Convergence.2024.2160p.BluRay.REMUX',
    provider: 'OpenSubtitles',
    matchPercentage: 94,
    isHearingImpaired: false,
    downloadCount: 8740,
  },
  {
    id: 'sub-003',
    language: 'French',
    languageCode: 'FR',
    releaseName: 'Stellar.Convergence.2024.2160p.WEB-DL.DDP5.1',
    provider: 'OpenSubtitles',
    matchPercentage: 91,
    isHearingImpaired: true,
    downloadCount: 5610,
  },
  {
    id: 'sub-004',
    language: 'German',
    languageCode: 'DE',
    releaseName: 'Stellar.Convergence.2024.2160p.BluRay.x265',
    provider: 'OpenSubtitles',
    matchPercentage: 87,
    isHearingImpaired: false,
    downloadCount: 4290,
  },
  {
    id: 'sub-005',
    language: 'Portuguese',
    languageCode: 'PT',
    releaseName: 'Stellar.Convergence.2024.1080p.WEB-DL.DD5.1',
    provider: 'OpenSubtitles',
    matchPercentage: 82,
    isHearingImpaired: false,
    downloadCount: 3150,
  },
  {
    id: 'sub-006',
    language: 'Italian',
    languageCode: 'IT',
    releaseName: 'Stellar.Convergence.2024.2160p.WEB-DL.DDP5.1.Atmos',
    provider: 'OpenSubtitles',
    matchPercentage: 79,
    isHearingImpaired: true,
    downloadCount: 2680,
  },
];
