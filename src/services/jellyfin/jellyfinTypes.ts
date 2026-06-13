// ============================================
// Jellyfin API response types
// ============================================

/** GET /System/Info/Public */
export interface JellyfinSystemInfo {
  ServerName: string;
  Version: string;
  Id: string;
  LocalAddress?: string;
  OperatingSystem?: string;
  StartupWizardCompleted?: boolean;
}

/** POST /Users/AuthenticateByName → response */
export interface JellyfinAuthResponse {
  User: JellyfinUser;
  AccessToken: string;
  ServerId: string;
}

/** Jellyfin user object */
export interface JellyfinUser {
  Name: string;
  ServerId: string;
  Id: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  Policy?: {
    IsAdministrator?: boolean;
    IsDisabled?: boolean;
  };
}

/** Single item in GET /Users/{userId}/Views → Items[] */
export interface JellyfinUserView {
  Name: string;
  Id: string;
  CollectionType?: string; // e.g. 'movies', 'tvshows', 'boxsets', 'music'
  Type: string;           // e.g. 'CollectionFolder'
  ImageTags?: Record<string, string>;
}

/** GET /Users/{userId}/Views → response wrapper */
export interface JellyfinUserViewsResponse {
  Items: JellyfinUserView[];
  TotalRecordCount: number;
}

// ============================================
// App-level types
// ============================================

/** Stored server connection profile */
export interface ServerProfile {
  serverUrl: string;             // primary/active URL
  localServerUrl?: string;       // optional LAN address
  remoteServerUrl?: string;      // optional WAN/remote address
  serverId: string;
  serverName: string;
  serverVersion: string;
}

/** Persisted app session (saved to localStorage) */
export interface AppSession {
  // Server
  serverUrl: string;
  localServerUrl?: string;
  remoteServerUrl?: string;
  activeServerUrl: string;       // the URL currently in use
  serverId: string;
  serverName: string;
  serverVersion: string;

  // Auth
  accessToken: string;
  userId: string;
  username: string;

  // Device
  deviceId: string;

  // Meta
  lastConnectedAt: string;       // ISO 8601
}

/** Connection status for the UI */
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

// ============================================
// Phase 3: Library Browsing Types
// ============================================

export interface JellyfinImageTags {
  Primary?: string;
  Backdrop?: string;
  Logo?: string;
  Thumb?: string;
}

export interface JellyfinUserData {
  PlaybackPositionTicks: number;
  PlayCount: number;
  IsFavorite: boolean;
  Played: boolean;
  UnplayedItemCount?: number;
}

export interface JellyfinMediaSource {
  Id: string;
  Path: string;
  Protocol: string;
  Container: string;
  Size: number;
  Bitrate: number;
  RunTimeTicks: number;
  VideoType: string;
}

export interface JellyfinMediaStream {
  Codec: string;
  Type: 'Video' | 'Audio' | 'Subtitle';
  Index: number;
  IsInterlaced?: boolean;
  ChannelLayout?: string;
  BitRate?: number;
  Language?: string;
  Title?: string;
  DisplayTitle?: string;
  VideoRange?: string; // e.g., "HDR"
  Width?: number;
  Height?: number;
}

export interface JellyfinPerson {
  Id: string;
  Name: string;
  Role?: string;       // Character name
  Type?: string;       // 'Actor', 'Director', 'Writer', etc.
  PrimaryImageTag?: string; // If set, person has a photo
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  OriginalTitle?: string;
  ServerId: string;
  Type: 'Movie' | 'Series' | 'Episode' | 'BoxSet' | 'Folder' | string;
  RunTimeTicks?: number;
  ProductionYear?: number;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  Overview?: string;
  Genres?: string[];
  CommunityRating?: number;
  OfficialRating?: string;
  ImageTags: JellyfinImageTags;
  BackdropImageTags?: string[];
  UserData?: JellyfinUserData;
  MediaSources?: JellyfinMediaSource[];
  MediaStreams?: JellyfinMediaStream[];
  People?: JellyfinPerson[]; // Cast, directors, etc.
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

// ============================================
// UI Model (WuCinemaMediaItem)
// ============================================

export interface CastMember {
  id: string;
  name: string;
  role?: string;        // Character name
  type?: string;        // 'Actor', 'Director', etc.
  imageUrl?: string;    // Full Jellyfin person photo URL
}

export interface WuCinemaMediaItem {
  id: string;
  name: string;
  originalTitle?: string;
  type: string;
  year?: number;
  overview?: string;
  runtimeMinutes: number;
  communityRating?: number;
  officialRating?: string;
  genres: string[];
  
  // Image URLs (built by mapper)
  primaryImageUrl?: string;
  backdropImageUrl?: string;
  logoImageUrl?: string;

  // Cast
  cast: CastMember[];
  
  // TV specific
  seriesName?: string;
  seriesId?: string;
  seasonId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  
  // User state
  isWatched: boolean;
  playedPercentage: number;
  resumePositionTicks: number;
  unplayedCount?: number;
  
  // Media info
  is4K: boolean;
  is1080p?: boolean;
  is720p?: boolean;
  isHDR: boolean;
  videoCodec?: string;
  audioCodec?: string;
}
