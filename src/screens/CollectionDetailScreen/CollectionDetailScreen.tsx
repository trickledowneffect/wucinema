import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle, Loader2, ArrowLeft } from 'lucide-react';
import { useJellyfinCollectionDetail } from '../../hooks/useJellyfinCollectionDetail';
import { usePlayback } from '../../hooks/usePlayback';
import PosterCard from '../../components/PosterCard/PosterCard';
import Button from '../../components/Button/Button';
import './CollectionDetailScreen.css';

export default function CollectionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const collectionId = id || '';
  const navigate = useNavigate();

  const { collection, items, isLoading, error } = useJellyfinCollectionDetail(collectionId);
  const { startPlayback } = usePlayback();

  const handlePlayAll = () => {
    if (items.length > 0) {
      void startPlayback(items[0], false);
    }
  };

  const handleShuffle = () => {
    if (items.length > 0) {
      const randomIndex = Math.floor(Math.random() * items.length);
      void startPlayback(items[randomIndex], false);
    }
  };

  if (isLoading) {
    return (
      <div className="collection-detail-loading">
        <Loader2 className="spinning" size={48} />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="collection-detail-error">
        <h2>Error Loading Collection</h2>
        <p>{error || 'Collection not available.'}</p>
        <Button onClick={() => navigate('/collections')}>Go back</Button>
      </div>
    );
  }

  // Use the collection's backdrop, or fallback to the first item's backdrop
  const backdropUrl = collection.backdropImageUrl || items[0]?.backdropImageUrl;

  return (
    <div className="collection-detail">
      {/* Backdrop */}
      <div className="collection-detail-backdrop">
        <div
          className="collection-detail-backdrop-image"
          style={{
            backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
          }}
        />
        <div className="collection-detail-backdrop-gradient" />
      </div>

      <div className="collection-detail-header">
        <button className="collection-detail-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="collection-detail-meta-container">
          <h1 className="collection-detail-title">{collection.name}</h1>
          <div className="collection-detail-meta">
            <span className="collection-detail-count">{items.length} items</span>
          </div>
          {collection.overview && (
            <p className="collection-detail-overview">{collection.overview}</p>
          )}
          
          {items.length > 0 && (
            <div className="collection-detail-actions">
              <Button variant="primary" size="lg" onClick={handlePlayAll}>
                <Play size={18} /> Play All
              </Button>
              <Button variant="secondary" size="lg" onClick={handleShuffle}>
                <Shuffle size={18} /> Shuffle
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="collection-detail-content">
        <div className="collection-items-grid">
          {items.map((item) => (
            <PosterCard
              key={item.id}
              id={item.id}
              title={item.name}
              type={item.type}
              year={item.year}
              imageUrl={item.primaryImageUrl}
              is4K={item.is4K}
              isHDR={item.isHDR}
              isWatched={item.isWatched}
              progress={item.playedPercentage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
