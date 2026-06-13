import type { ReactNode } from 'react';
import { Check, Pause, AlertCircle, Loader } from 'lucide-react';
import type { DownloadItem } from '../../data/mockMedia';
import './CacheItemRow.css';

interface CacheItemRowProps {
  item: DownloadItem;
}

function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'orange' | 'frost' | 'ember' | 'default';
}) {
  return (
    <span className={`cache-item-badge cache-item-badge--${variant}`}>
      {children}
    </span>
  );
}

export default function CacheItemRow({ item }: CacheItemRowProps) {
  return (
    <div className="cache-item-row">
      {/* Poster */}
      <div
        className="cache-item-poster"
        style={{ background: item.posterGradient }}
        aria-hidden="true"
      />

      {/* Info */}
      <div className="cache-item-info">
        <div className="cache-item-title" title={item.title}>
          {item.title}
        </div>
        <div className="cache-item-meta">
          {item.status === 'downloading' && (
            <>
              <Badge variant="orange">{item.quality}</Badge>
              <Badge variant="orange">DOWNLOADING</Badge>
            </>
          )}

          {item.status === 'completed' && (
            <>
              <Badge variant="frost">{item.quality}</Badge>
            </>
          )}

          {item.status === 'queued' && (
            <>
              <Badge variant="default">{item.quality}</Badge>
              <Badge variant="default">QUEUED</Badge>
            </>
          )}

          {item.status === 'paused' && (
            <>
              <Badge variant="default">{item.quality}</Badge>
              <Badge variant="ember">PAUSED</Badge>
            </>
          )}

          {item.status === 'failed' && (
            <>
              <Badge variant="ember">FAILED</Badge>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="cache-item-status">
        {item.status === 'downloading' && (
          <>
            <div className="cache-item-progress">
              <div
                className="cache-item-progress-bar"
                style={{ width: `${item.progress ?? 0}%` }}
              />
            </div>
            <span className="cache-item-size">
              {item.downloadedSize} / {item.totalSize}
            </span>
            {item.speed && (
              <span className="cache-item-speed">{item.speed}</span>
            )}
          </>
        )}

        {item.status === 'completed' && (
          <>
            <Check size={16} className="cache-item-check" aria-label="Completed" />
            <span className="cache-item-size">{item.totalSize}</span>
            {item.date && (
              <span className="cache-item-date">{item.date}</span>
            )}
          </>
        )}

        {item.status === 'queued' && (
          <Loader size={16} className="cache-item-size" aria-label="Queued" />
        )}

        {item.status === 'paused' && (
          <>
            {item.progress !== undefined && (
              <div className="cache-item-progress">
                <div
                  className="cache-item-progress-bar"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
            <Pause size={16} className="cache-item-size" aria-label="Paused" />
          </>
        )}

        {item.status === 'failed' && (
          <AlertCircle size={16} className="cache-item-badge--ember" aria-label="Failed" />
        )}
      </div>
    </div>
  );
}
