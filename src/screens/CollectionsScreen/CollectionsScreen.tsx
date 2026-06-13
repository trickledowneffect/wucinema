import { useNavigate } from 'react-router-dom';
import { useJellyfinCollections } from '../../hooks/useJellyfinCollections';
import { Loader2, FolderOpen } from 'lucide-react';
import './CollectionsScreen.css';

export default function CollectionsScreen() {
  const navigate = useNavigate();
  const { collections, isLoading, error } = useJellyfinCollections();

  if (isLoading) {
    return (
      <div className="collections-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 'var(--space-4)', color: 'var(--text-secondary)' }}>
        <Loader2 className="spinning" size={48} style={{ color: 'var(--brand-primary, #ff5722)' }} />
        <span>Loading collections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collections-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 'var(--space-4)', color: 'var(--text-secondary)' }}>
        <h2>Error Loading Collections</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="collections-screen">
      <h1 className="collections-title">Collections</h1>
      {collections.length === 0 ? (
        <div className="collections-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 'var(--space-4)', color: 'var(--text-muted)' }}>
          <FolderOpen size={48} />
          <p>No collections found on this server.</p>
        </div>
      ) : (
        <div className="collections-grid">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="collection-card"
              onClick={() => navigate(`/collection/${collection.id}`)}
            >
              <div
                className="collection-card-image"
                style={{
                  backgroundImage: collection.backdropImageUrl ? `url(${collection.backdropImageUrl})` : undefined,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div className="collection-card-overlay">
                <div className="collection-card-title">{collection.name}</div>
                {collection.overview && (
                  <div className="collection-card-description">
                    {collection.overview}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
