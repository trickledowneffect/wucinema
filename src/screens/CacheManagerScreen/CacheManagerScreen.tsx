import { useState, useEffect, useCallback } from 'react';
import StorageRing from '../../components/StorageRing/StorageRing';
import Toggle from '../../components/Toggle/Toggle';
import Button from '../../components/Button/Button';
import { Trash2, RefreshCw, HardDrive, Image, FileText, Subtitles, List } from 'lucide-react';
import {
  listCachedFiles,
  clearAllCache,
  deleteCachedFile,
  formatCacheSize,
  type CachedFileInfo,
} from '../../services/cache/cacheService';
import './CacheManagerScreen.css';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  metadata: 'Metadata',
  poster: 'Posters',
  backdrop: 'Backdrops',
  subtitle: 'Subtitles',
  list: 'Lists',
  other: 'Other',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  metadata: <FileText size={14} />,
  poster: <Image size={14} />,
  backdrop: <Image size={14} />,
  subtitle: <Subtitles size={14} />,
  list: <List size={14} />,
  other: <HardDrive size={14} />,
};

type FilterTab = 'all' | 'metadata' | 'poster' | 'backdrop' | 'subtitle' | 'list' | 'other';

const TABS: FilterTab[] = ['all', 'metadata', 'poster', 'backdrop', 'subtitle', 'list'];

export default function CacheManagerScreen() {
  const [files, setFiles] = useState<CachedFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [storageLimit, setStorageLimit] = useState(100);
  const [autoDownloadSubs, setAutoDownloadSubs] = useState(true);
  const [smartCacheRemoval, setSmartCacheRemoval] = useState(false);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listCachedFiles();
      // Sort by most recently modified
      list.sort((a, b) => b.modified - a.modified);
      setFiles(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleClearAll = async () => {
    if (!window.confirm('Clear all cached files? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await clearAllCache();
      setFiles([]);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    await deleteCachedFile(key);
    setFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const filtered = activeTab === 'all' ? files : files.filter((f) => f.category === activeTab);
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const categoryBytes = (cat: FilterTab) =>
    files.filter((f) => f.category === cat).reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="cache-manager">
      {/* Header */}
      <div className="cache-manager-header">
        <h1 className="cache-manager-title">Cache Manager</h1>
        <p className="cache-manager-subtitle">
          Offline metadata, posters &amp; subtitles stored locally
        </p>
      </div>

      {/* Layout */}
      <div className="cache-manager-layout">
        {/* Main Panel */}
        <div className="cache-manager-main">
          {/* Tabs */}
          <div className="cache-manager-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`cache-manager-tab ${activeTab === tab ? 'cache-manager-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {CATEGORY_LABELS[tab]}
                {tab !== 'all' && (
                  <span className="cache-tab-badge">
                    {files.filter((f) => f.category === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="cache-manager-toolbar">
            <span className="cache-manager-filter-info">
              {filtered.length} {filtered.length === 1 ? 'file' : 'files'} · {formatCacheSize(filtered.reduce((a, f) => a + f.size, 0))}
            </span>
            <div className="cache-manager-filter-actions">
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                ariaLabel="Refresh cache list"
                onClick={loadFiles}
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="cache-manager-list">
            {isLoading ? (
              <div className="cache-empty-state">
                <RefreshCw size={32} className="cache-spinner" />
                <p>Loading cache…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="cache-empty-state">
                <HardDrive size={48} style={{ opacity: 0.3 }} />
                <p>No cached files in this category.</p>
                <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>
                  Browse your library to start caching metadata and posters.
                </p>
              </div>
            ) : (
              filtered.map((file) => (
                <div key={file.key} className="cache-file-row">
                  <div className="cache-file-icon">
                    {CATEGORY_ICONS[file.category]}
                  </div>
                  <div className="cache-file-info">
                    <span className="cache-file-name" title={file.key}>
                      {file.key.replace(/^(metadata_|img_poster_|img_backdrop_|sub_)/, '').replace(/\.(json|bin|srt)$/, '').slice(0, 40)}
                    </span>
                    <span className="cache-file-meta">
                      {CATEGORY_LABELS[file.category]} · {formatCacheSize(file.size)}
                    </span>
                  </div>
                  <button
                    className="cache-file-delete"
                    aria-label={`Delete ${file.key}`}
                    onClick={() => handleDeleteFile(file.key)}
                    title="Delete this file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="cache-manager-sidebar">
          {/* Storage Card */}
          <div className="cache-storage-card">
            <h2 className="cache-storage-title">Storage</h2>
            <StorageRing
              usedGB={totalBytes / (1024 * 1024 * 1024)}
              otherGB={0}
              totalGB={Math.max(storageLimit / 1024, totalBytes / (1024 * 1024 * 1024) + 0.01)}
            />
            <div className="cache-storage-breakdown">
              {(['metadata', 'poster', 'backdrop', 'subtitle', 'list'] as FilterTab[]).map((cat) => {
                const bytes = categoryBytes(cat);
                if (bytes === 0) return null;
                return (
                  <div key={cat} className="cache-breakdown-row">
                    <span className="cache-breakdown-dot" style={{ background: cat === 'poster' ? '#a855f7' : cat === 'backdrop' ? '#3b82f6' : cat === 'metadata' ? '#22c55e' : cat === 'subtitle' ? '#f59e0b' : '#6b7280' }} />
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span className="cache-breakdown-size">{formatCacheSize(bytes)}</span>
                  </div>
                );
              })}
              <div className="cache-breakdown-row cache-breakdown-total">
                <span>Total</span>
                <span className="cache-breakdown-size">{formatCacheSize(totalBytes)}</span>
              </div>
            </div>
          </div>

          {/* Cache Settings Card */}
          <div className="cache-settings-card">
            <h2 className="cache-settings-title">Cache Settings</h2>

            {/* Storage Limit */}
            <div className="cache-slider-row">
              <div className="cache-slider-header">
                <span className="cache-setting-label">Storage Limit</span>
                <span className="cache-slider-value">{storageLimit} MB</span>
              </div>
              <input
                type="range"
                className="cache-slider"
                min={50}
                max={2000}
                step={50}
                value={storageLimit}
                onChange={(e) => setStorageLimit(Number(e.target.value))}
                aria-label="Storage limit in megabytes"
              />
            </div>

            {/* Auto-download Subtitles */}
            <div className="cache-setting-row">
              <div className="cache-setting-info">
                <div className="cache-setting-label">Auto-cache Subtitles</div>
                <div className="cache-setting-description">
                  Save subtitles permanently when downloaded
                </div>
              </div>
              <Toggle
                active={autoDownloadSubs}
                onChange={setAutoDownloadSubs}
                label="Auto-cache subtitles"
              />
            </div>

            {/* Smart Cache Removal */}
            <div className="cache-setting-row">
              <div className="cache-setting-info">
                <div className="cache-setting-label">Smart Cache Removal</div>
                <div className="cache-setting-description">
                  Auto-remove old entries when space is low
                </div>
              </div>
              <Toggle
                active={smartCacheRemoval}
                onChange={setSmartCacheRemoval}
                label="Smart cache removal"
              />
            </div>

            {/* Clear Cache */}
            <div className="cache-clear-btn">
              <Button
                variant="danger"
                ariaLabel="Clear all cached files"
                onClick={handleClearAll}
                disabled={isClearing || files.length === 0}
              >
                {isClearing ? 'Clearing…' : `Clear All Cache (${formatCacheSize(totalBytes)})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
