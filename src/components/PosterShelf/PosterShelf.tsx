import { useEffect, useRef } from 'react';
import PosterCard from '../PosterCard/PosterCard';
import type { WuCinemaMediaItem } from '../../services/jellyfin/jellyfinTypes';
import './PosterShelf.css';

interface PosterShelfProps {
  movies: WuCinemaMediaItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onActivate: (movie: WuCinemaMediaItem) => void;
}

export default function PosterShelf({ movies, selectedIndex, onSelect, onActivate }: PosterShelfProps) {
  const shelfRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item when it changes
  useEffect(() => {
    if (selectedRef.current && shelfRef.current) {
      const container = shelfRef.current;
      const element = selectedRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate scroll position to center the element
      const scrollLeft = element.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="poster-shelf" ref={shelfRef}>
      <div className="poster-shelf-inner">
        {movies.map((movie, index) => {
          const isSelected = index === selectedIndex;
          
          return (
            <div 
              key={movie.id} 
              className={`poster-shelf-item ${isSelected ? 'selected' : ''}`}
              ref={isSelected ? selectedRef : null}
              onClick={() => {
                if (isSelected) {
                  onActivate(movie);
                } else {
                  onSelect(index);
                }
              }}
              onDoubleClick={() => onActivate(movie)}
            >
              <PosterCard
                id={movie.id}
                title={movie.name}
                year={movie.year}
                imageUrl={movie.primaryImageUrl}
                is4K={movie.is4K}
                isHDR={movie.isHDR}
                isWatched={movie.isWatched}
                progress={movie.playedPercentage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
