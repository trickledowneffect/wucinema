import React, { useRef } from 'react';
import './MediaGrid.css';

interface MediaGridProps {
  title: string;
  seeAllLink?: string;
  children: React.ReactNode;
}

export default function MediaGrid({
  title,
  seeAllLink,
  children,
}: MediaGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -500, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 500, behavior: 'smooth' });
    }
  };

  return (
    <section className="media-grid">
      <div className="media-grid-header">
        <h2 className="media-grid-title">{title}</h2>
        <div className="media-grid-header-right">
          <div className="media-grid-arrows">
            <button onClick={handleScrollLeft} className="media-grid-arrow-btn" aria-label="Scroll Left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button onClick={handleScrollRight} className="media-grid-arrow-btn" aria-label="Scroll Right">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          {seeAllLink && (
            <a href={seeAllLink} className="media-grid-see-all">
              See All
            </a>
          )}
        </div>
      </div>
      <div className="media-grid-scroll" ref={scrollContainerRef}>
        {children}
      </div>
    </section>
  );
}
