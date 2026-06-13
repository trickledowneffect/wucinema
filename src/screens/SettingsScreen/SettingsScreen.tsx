import { useState, useEffect } from 'react';
import Toggle from '../../components/Toggle/Toggle';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import { Palette, Server, Play, HardDrive, Subtitles, CheckCircle, XCircle, Info, LogIn } from 'lucide-react';
import { testMpvPath, testBundledMpv } from '../../services/playback/mpvService';
import { setPlaybackSetting } from '../../services/playback/playbackSettings';
import {
  getStoredCredentials,
  setStoredCredentials,
  login as osLogin,
} from '../../services/subtitles/openSubtitlesClient';
import './SettingsScreen.css';

export default function SettingsScreen() {
  const [fullscreen, setFullscreen] = useState(true);
  const [mpvPath, setMpvPath] = useState(() => localStorage.getItem('mpvPath') || '');
  const [preferredPlayer, setPreferredPlayer] = useState(() => localStorage.getItem('preferredPlayer') || 'integrated');
  const [externalFallbackWhenUnavailable, setExternalFallbackWhenUnavailable] = useState(
    () => localStorage.getItem('useExternalFallbackWhenUnavailable') === 'true',
  );
  const [fallbackMpvStatus, setFallbackMpvStatus] = useState<'Checking...' | 'Ready' | 'Missing'>('Checking...');
  const [integratedPlayerStatus] = useState<'Not ready' | 'Ready'>('Not ready');
  const [autoDetect, setAutoDetect] = useState(true);
  const [avoidTranscoding, setAvoidTranscoding] = useState(() => localStorage.getItem('avoidTranscoding') !== 'false');
  const [preferDirectPlay, setPreferDirectPlay] = useState(() => localStorage.getItem('preferDirectPlay') !== 'false');
  const [autoSubs, setAutoSubs] = useState(true);
  const [smartCache, setSmartCache] = useState(false);
  const [preferForced, setPreferForced] = useState(false);
  const [preferHI, setPreferHI] = useState(false);

  // OpenSubtitles optional account (for >5 downloads/day quota)
  const [osUsername, setOsUsername] = useState(() => getStoredCredentials().username);
  const [osPassword, setOsPassword] = useState(() => getStoredCredentials().password);
  const [osLoginStatus, setOsLoginStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [osLoginMsg, setOsLoginMsg] = useState('');

  useEffect(() => {
    testBundledMpv()
      .then(() => setFallbackMpvStatus('Ready'))
      .catch(() => setFallbackMpvStatus('Missing'));
  }, []);

  const handleMpvPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMpvPath(value);
    setPlaybackSetting('mpvPath', value);
  };

  const handleAvoidTranscodingChange = (val: boolean) => {
    setAvoidTranscoding(val);
    setPlaybackSetting('avoidTranscoding', val);
  };

  const handlePreferDirectPlayChange = (val: boolean) => {
    setPreferDirectPlay(val);
    setPlaybackSetting('preferDirectPlay', val);
  };

  const handleTestBundledMpv = async () => {
    try {
      const result = await testBundledMpv();
      setFallbackMpvStatus('Ready');
      alert(`Success! External fallback MPV detected:\n${result}`);
    } catch (e: any) {
      setFallbackMpvStatus('Missing');
      alert(`Failed to test fallback MPV:\n${e}`);
    }
  };

  const handleTestMpv = async () => {
    if (!mpvPath) {
      alert('Please enter an MPV path first.');
      return;
    }
    try {
      const result = await testMpvPath(mpvPath);
      alert(`Success! Custom fallback MPV detected:\n${result}`);
    } catch (e: any) {
      alert(`Failed to test fallback MPV path:\n${e}`);
    }
  };

  const handleOsCredentialsChange = (field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setOsUsername(value);
      setStoredCredentials(value, osPassword);
    } else {
      setOsPassword(value);
      setStoredCredentials(osUsername, value);
    }
  };

  const handleOsLogin = async () => {
    setOsLoginStatus('testing');
    setOsLoginMsg('');
    try {
      await osLogin(osUsername, osPassword);
      setOsLoginStatus('ok');
      setOsLoginMsg('Logged in successfully! Download quota increased to 20/day.');
    } catch (e: any) {
      setOsLoginStatus('error');
      setOsLoginMsg(String(e?.message || e));
    }
  };

  return (
    <div className="settings-screen">
      <h1 className="settings-title">Settings</h1>

      {/* Appearance */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <Palette className="settings-section-title-icon" size={20} />
            Appearance
          </h2>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Theme</span></div>
            <select className="settings-select" defaultValue="ignite-glass">
              <option value="ignite-glass">Ignite Glass</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Accent Colour</span></div>
            <input className="settings-input" type="text" defaultValue="#5F0540" style={{ minWidth: 120 }} />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Poster Size</span></div>
            <select className="settings-select" defaultValue="medium">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Layout</span></div>
            <select className="settings-select" defaultValue="comfortable">
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Server */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <Server className="settings-section-title-icon" size={20} />
            Server
          </h2>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Server URL</span></div>
            <input className="settings-input" type="text" placeholder="https://jellyfin.example.com" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Local URL</span></div>
            <input className="settings-input" type="text" placeholder="http://192.168.1.100:8096" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Auto-detect Network</span></div>
            <Toggle active={autoDetect} onChange={setAutoDetect} label="Auto-detect network" />
          </div>
          <div className="settings-row">
            <div className="settings-row-value" style={{ gap: 'var(--space-3)' }}>
              <Button variant="secondary" size="sm" ariaLabel="Test connection">Test Connection</Button>
              <Button variant="danger" size="sm" ariaLabel="Logout">Logout</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Playback */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <Play className="settings-section-title-icon" size={20} />
            Playback
          </h2>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Preferred Player</span>
              <span className="settings-row-description">Integrated native player is the default target.</span>
            </div>
            <select
              className="settings-select"
              value={preferredPlayer}
              onChange={(e) => {
                setPreferredPlayer(e.target.value);
                setPlaybackSetting('preferredPlayer', e.target.value as 'integrated' | 'external');
              }}
            >
              <option value="integrated">Integrated native player</option>
              <option value="external">External mpv fallback</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Integrated Player Status</span>
              <span className="settings-row-status" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '4px', color: integratedPlayerStatus === 'Ready' ? 'var(--accent-frost)' : 'var(--accent-orange)' }}>
                {integratedPlayerStatus === 'Ready' ? <><CheckCircle size={12} /> Ready</> : <><XCircle size={12} /> Not ready yet</>}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestBundledMpv} ariaLabel="Test fallback MPV">Check fallback MPV</Button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Use external mpv fallback when integrated player is unavailable</span></div>
            <Toggle active={externalFallbackWhenUnavailable} onChange={(val) => {
              setExternalFallbackWhenUnavailable(val);
              setPlaybackSetting('useExternalFallbackWhenUnavailable', val);
            }} label="Use fallback automatically" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Fallback MPV Status</span>
              <span className="settings-row-description">
                {fallbackMpvStatus === 'Ready' ? 'Fallback mpv is available.' : fallbackMpvStatus === 'Missing' ? 'Fallback mpv is missing.' : 'Checking fallback mpv.'}
              </span>
            </div>
            <Badge variant={fallbackMpvStatus === 'Ready' ? 'success' : 'ember'}>
              {fallbackMpvStatus}
            </Badge>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Avoid Transcoding</span></div>
            <Toggle active={avoidTranscoding} onChange={handleAvoidTranscodingChange} label="Avoid transcoding" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Prefer Direct Play</span></div>
            <Toggle active={preferDirectPlay} onChange={handlePreferDirectPlayChange} label="Prefer direct play" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Advanced: Custom mpv Path</span>
              <span className="settings-row-description">Used only for the fallback path.</span>
            </div>
            <input 
              className="settings-input" 
              type="text" 
              placeholder="/usr/bin/mpv or C:\mpv\mpv.exe" 
              value={mpvPath}
              onChange={handleMpvPathChange}
            />
            <Button variant="secondary" size="sm" onClick={handleTestMpv} ariaLabel="Test MPV">Test Path</Button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Start Fullscreen</span></div>
            <Toggle active={fullscreen} onChange={setFullscreen} label="Start fullscreen" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Preferred Audio Language</span></div>
            <select className="settings-select" defaultValue="en">
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Preferred Subtitle Language</span></div>
            <select className="settings-select" defaultValue="en">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cache */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <HardDrive className="settings-section-title-icon" size={20} />
            Cache
          </h2>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Cache Folder</span></div>
            <input className="settings-input" type="text" placeholder="C:\Users\...\WU-CINE\Cache" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Storage Limit</span></div>
            <select className="settings-select" defaultValue="100">
              <option value="50">50 GB</option>
              <option value="100">100 GB</option>
              <option value="200">200 GB</option>
              <option value="500">500 GB</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Auto-download Subtitles</span></div>
            <Toggle active={autoSubs} onChange={setAutoSubs} label="Auto-download subtitles" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Smart Cache Removal</span></div>
            <Toggle active={smartCache} onChange={setSmartCache} label="Smart cache removal" />
          </div>
          <div className="settings-row">
            <Button variant="danger" size="sm" ariaLabel="Clear all cache">Clear Cache</Button>
          </div>
        </div>
      </div>

      {/* Subtitles */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <Subtitles className="settings-section-title-icon" size={20} />
            Subtitles
          </h2>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Preferred Languages</span></div>
            <input className="settings-input" type="text" defaultValue="English, Spanish" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">OpenSubtitles Account</span>
              <span className="settings-row-description">Optional. Log in to get 20 subtitle downloads/day instead of 5.</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Username</span></div>
            <input
              className="settings-input"
              type="text"
              placeholder="OpenSubtitles username"
              value={osUsername}
              onChange={(e) => handleOsCredentialsChange('username', e.target.value)}
            />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Password</span></div>
            <input
              className="settings-input"
              type="password"
              placeholder="Password"
              value={osPassword}
              onChange={(e) => handleOsCredentialsChange('password', e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              ariaLabel="Test OpenSubtitles login"
              onClick={() => void handleOsLogin()}
            >
              <LogIn size={13} />
              {osLoginStatus === 'testing' ? 'Testing…' : 'Log In'}
            </Button>
          </div>
          {osLoginStatus !== 'idle' && osLoginMsg && (
            <div className="settings-row">
              <span
                style={{
                  fontSize: '12px',
                  color: osLoginStatus === 'ok' ? 'var(--accent-frost)' : 'rgba(255,100,100,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {osLoginStatus === 'ok' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {osLoginMsg}
              </span>
            </div>
          )}
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Prefer Forced</span></div>
            <Toggle active={preferForced} onChange={setPreferForced} label="Prefer forced subtitles" />
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Prefer Hearing Impaired</span></div>
            <Toggle active={preferHI} onChange={setPreferHI} label="Prefer hearing impaired" />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <div className="settings-section-card">
          <h2 className="settings-section-title">
            <Info className="settings-section-title-icon" size={20} />
            About
          </h2>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Version</span></div>
            <span className="settings-row-label">WU-CINE v0.1.0</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-info"><span className="settings-row-label">Build</span></div>
            <span className="settings-row-label">Phase 4 — Playback</span>
          </div>
          <div className="settings-row">
            <Button variant="secondary" size="sm" ariaLabel="Run diagnostics">Diagnostics</Button>
          </div>
        </div>
      </div>

      <div className="settings-version">WU-CINE v0.1.0 • Phase 4 Playback</div>
    </div>
  );
}
