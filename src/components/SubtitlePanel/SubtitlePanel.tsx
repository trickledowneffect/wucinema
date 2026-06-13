import { useState } from 'react';
import { Download, Eye, Loader2, Settings, CheckCircle, HeadphoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOpenSubtitles } from '../../hooks/useOpenSubtitles';
import './SubtitlePanel.css';

interface SubtitlePanelProps {
  itemId?: string;
  movieTitle?: string;
  movieYear?: number;
  /** Override language list; defaults to ['en','es','fr'] */
  languages?: string[];
}

const TABS = ['Embedded', 'Server', 'Online'] as const;

// Human-readable language names from ISO 639-1 codes.
const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', ru: 'Russian', ar: 'Arabic', nl: 'Dutch',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish',
  pl: 'Polish', tr: 'Turkish', th: 'Thai', cs: 'Czech',
};

function langLabel(code: string): string {
  return LANG_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

export default function SubtitlePanel({
  itemId,
  movieTitle,
  movieYear,
  languages = ['en', 'es', 'fr'],
}: SubtitlePanelProps) {
  const [activeTab, setActiveTab] = useState<number>(2);
  const navigate = useNavigate();

  const { results, isLoading, error, notConfigured, downloadedIds, download } =
    useOpenSubtitles(itemId, movieTitle, movieYear, languages);

  return (
    <div className="subtitle-panel">
      <div className="subtitle-panel-header">
        <h3 className="subtitle-panel-title">Subtitles</h3>
      </div>

      <div className="subtitle-panel-tabs" role="tablist">
        {TABS.map((tab, index) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === index}
            className={`subtitle-panel-tab${activeTab === index ? ' subtitle-panel-tab--active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="subtitle-panel-content" role="tabpanel">
        {activeTab === 0 && (
          <p className="subtitle-placeholder">
            Embedded subtitle tracks will appear here when connected to Jellyfin.
          </p>
        )}

        {activeTab === 1 && (
          <p className="subtitle-placeholder">
            Server-provided subtitles will appear here when connected to Jellyfin.
          </p>
        )}

        {activeTab === 2 && (
          <>
            {notConfigured ? (
              <div className="subtitle-not-configured">
                <p className="subtitle-not-configured-text">
                  OpenSubtitles API key is not configured.
                </p>
                <button
                  className="subtitle-configure-btn"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={13} />
                  Configure in Settings
                </button>
              </div>
            ) : isLoading ? (
              <div className="subtitle-loading">
                <Loader2 className="subtitle-spinner" size={20} />
                <span>Searching OpenSubtitles…</span>
              </div>
            ) : error ? (
              <div className="subtitle-error">
                <p className="subtitle-error-text">Search failed: {error}</p>
              </div>
            ) : (
              <>
                {movieTitle && (
                  <p className="subtitle-panel-search-info">
                    {results.length} results for{' '}
                    <strong>&ldquo;{movieTitle}{movieYear ? ` (${movieYear})` : ''}&rdquo;</strong>
                  </p>
                )}

                {results.length === 0 ? (
                  <p className="subtitle-placeholder">No online subtitle results found.</p>
                ) : (
                  results.map((sub) => {
                    const file = sub.attributes.files[0];
                    if (!file) return null;
                    const fileId = file.file_id;
                    const isDone = downloadedIds.has(fileId);

                    return (
                      <div key={sub.id} className="subtitle-row">
                        <span className="subtitle-lang">
                          {langLabel(sub.attributes.language)}
                        </span>
                        <span className="subtitle-name" title={sub.attributes.release}>
                          {file.file_name || sub.attributes.release}
                        </span>
                        {sub.attributes.hearing_impaired && (
                          <span className="subtitle-hi-badge" title="Hearing impaired">
                            <HeadphoneOff size={12} />
                          </span>
                        )}
                        <span className="subtitle-provider">OpenSubtitles</span>
                        <span className="subtitle-match">
                          {sub.attributes.ratings
                            ? `⭐ ${sub.attributes.ratings.toFixed(1)}`
                            : `↓ ${sub.attributes.download_count.toLocaleString()}`}
                        </span>
                        <button
                          className="subtitle-preview-btn"
                          aria-label={`Preview ${sub.attributes.language} subtitle`}
                          title="Preview on OpenSubtitles"
                          onClick={() => window.open(sub.attributes.url, '_blank')}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className={`subtitle-download-btn ${isDone ? 'subtitle-download-btn--done' : ''}`}
                          aria-label={`Download ${sub.attributes.language} subtitle`}
                          disabled={isDone}
                          onClick={() => void download(fileId, file.file_name)}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle size={12} />
                              Saved
                            </>
                          ) : (
                            <>
                              <Download size={12} />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
