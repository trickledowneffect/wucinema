import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import NowPlayingToast from '../NowPlayingToast/NowPlayingToast';
import PlaybackNavigationBridge from '../PlaybackNavigationBridge/PlaybackNavigationBridge';
import { useEffect } from 'react';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlayerRoute = location.pathname.startsWith('/player/');

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
        
        setTimeout(() => {
          const searchInput = document.querySelector('.search-screen-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 80);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [navigate]);

  return (
    <div className="layout">
      <PlaybackNavigationBridge />
      <Sidebar />
      <div className="layout-main">
        <TopBar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
      {!isPlayerRoute && <NowPlayingToast />}
    </div>
  );
}
