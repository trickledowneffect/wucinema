import { useState } from 'react';
import Badge from '../../components/Badge/Badge';
import Toggle from '../../components/Toggle/Toggle';
import { Globe, Download, Settings, History } from 'lucide-react';
import './SubtitlesScreen.css';

const languages = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian'];

export default function SubtitlesScreen() {
  const [activeLang, setActiveLang] = useState('English');
  const [preferForced, setPreferForced] = useState(false);
  const [preferHI, setPreferHI] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);

  return (
    <div className="subtitles-screen">
      <h1 className="subtitles-title">Subtitles</h1>
      <p className="subtitles-subtitle">Manage subtitle preferences, providers, and downloads</p>

      <div className="subtitles-grid">
        {/* Preferred Languages */}
        <div className="subtitles-card">
          <h2 className="subtitles-card-title">
            <Globe className="subtitles-card-title-icon" size={20} />
            Preferred Languages
          </h2>
          <div className="subtitles-lang-chips">
            {languages.map((lang) => (
              <button
                key={lang}
                className={`subtitles-lang-chip ${activeLang === lang ? 'subtitles-lang-chip--active' : ''}`}
                onClick={() => setActiveLang(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Providers */}
        <div className="subtitles-card">
          <h2 className="subtitles-card-title">
            <Download className="subtitles-card-title-icon" size={20} />
            Providers
          </h2>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">OpenSubtitles</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">Jellyfin Server</span>
            <Badge variant="frost">Auto</Badge>
          </div>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">Local Files</span>
            <Badge variant="default">Active</Badge>
          </div>
        </div>

        {/* Download History */}
        <div className="subtitles-card">
          <h2 className="subtitles-card-title">
            <History className="subtitles-card-title-icon" size={20} />
            Download History
          </h2>
          <div className="subtitles-empty">
            Subtitle download history will appear here
          </div>
        </div>

        {/* Preferences */}
        <div className="subtitles-card">
          <h2 className="subtitles-card-title">
            <Settings className="subtitles-card-title-icon" size={20} />
            Preferences
          </h2>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">Prefer Forced Subtitles</span>
            <Toggle active={preferForced} onChange={setPreferForced} label="Prefer forced subtitles" />
          </div>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">Prefer Hearing Impaired</span>
            <Toggle active={preferHI} onChange={setPreferHI} label="Prefer hearing impaired" />
          </div>
          <div className="subtitles-provider-row">
            <span className="subtitles-provider-name">Auto-download with Cache</span>
            <Toggle active={autoDownload} onChange={setAutoDownload} label="Auto-download with cache" />
          </div>
        </div>
      </div>
    </div>
  );
}
