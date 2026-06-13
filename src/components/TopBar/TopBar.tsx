import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinimalisticMagniferBold, ScreencastBold, BellBold, UserCircleBold } from 'solar-icon-set';
import { useNotifications } from '../../context/NotificationContext';
import './TopBar.css';

export default function TopBar() {
  const { latestItems, unreadCount, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-search">
        <MinimalisticMagniferBold className="topbar-search-icon" size={16} color="currentColor" />
        <input
          className="topbar-search-input"
          type="text"
          placeholder="Search movies, TV shows..."
          aria-label="Search movies and TV shows"
        />
      </div>

      <div className="topbar-actions">
        <button className="topbar-action-btn" aria-label="Cast to device">
          <ScreencastBold size={20} color="currentColor" />
        </button>
        
        <div className="topbar-notifications-wrap" ref={dropdownRef}>
          <button
            className={`topbar-action-btn ${showDropdown ? 'active' : ''}`}
            aria-label="Notifications"
            onClick={() => {
              setShowDropdown(v => !v);
              markAsRead();
            }}
          >
            <BellBold size={20} color="currentColor" />
            {unreadCount > 0 && (
              <span className="topbar-bell-badge">{unreadCount}</span>
            )}
          </button>
          
          {showDropdown && (
            <div className="topbar-notification-dropdown">
              <div className="topbar-notification-header">
                <h3>Latest Releases</h3>
              </div>
              <div className="topbar-notification-list">
                {latestItems.length === 0 ? (
                  <div className="topbar-notification-empty">
                    No new notifications.
                  </div>
                ) : (
                  latestItems.map((item) => (
                    <div
                      key={item.id}
                      className="topbar-notification-item"
                      onClick={() => {
                        navigate(item.type === 'Episode' ? `/show/${item.seriesId || item.id}` : `/movie/${item.id}`);
                        setShowDropdown(false);
                      }}
                    >
                      <img
                        src={item.primaryImageUrl || '/placeholder.png'}
                        alt={item.name}
                        className="topbar-notification-item-img"
                      />
                      <div className="topbar-notification-item-info">
                        <div className="topbar-notification-item-title">{item.name}</div>
                        <div className="topbar-notification-item-meta">
                          {item.type === 'Episode'
                            ? `New Episode${item.seriesName ? ` · ${item.seriesName}` : ''}`
                            : `New Movie${item.year ? ` · ${item.year}` : ''}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-avatar" role="button" aria-label="User profile" tabIndex={0}>
          <UserCircleBold size={32} color="currentColor" />
        </div>
      </div>
    </header>
  );
}
