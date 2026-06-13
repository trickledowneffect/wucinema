// ============================================
// OpenSubtitles REST API v2 — Type Definitions
// https://opensubtitles.stoplight.io/docs/opensubtitles-api
// ============================================

export interface OsLoginResponse {
  user: {
    allowed_downloads: number;
    level: string;
    user_id: number;
    ext_installed: boolean;
    vip: boolean;
  };
  base_url: string;
  token: string;
  status: number;
}

export interface OsSubtitleFile {
  file_id: number;
  cd_number: number;
  file_name: string;
}

export interface OsSubtitleAttributes {
  subtitle_id: string;
  language: string;         // ISO 639-1, e.g. "en"
  download_count: number;
  new_download_count: number;
  hearing_impaired: boolean;
  hd: boolean;
  fps: number;
  votes: number;
  points: number;
  ratings: number;
  from_trusted: boolean | null;
  foreign_parts_only: boolean;
  ai_translated: boolean;
  machine_translated: boolean;
  release: string;          // release group name
  comments: string;
  legacy_subtitle_id: number | null;
  uploader: {
    uploader_id: number | null;
    name: string;
    rank: string;
  };
  feature_details: {
    feature_id: number;
    feature_type: string;
    year: number;
    title: string;
    movie_name: string;
    imdb_id: number;
    tmdb_id: number;
  };
  url: string;
  related_links: { label: string; url: string; img_url: string }[];
  files: OsSubtitleFile[];
}

export interface OsSubtitleResult {
  id: string;
  type: string;
  attributes: OsSubtitleAttributes;
}

export interface OsSearchResponse {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: OsSubtitleResult[];
}

export interface OsDownloadResponse {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
}
