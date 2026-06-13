import { NavLink } from 'react-router-dom';
import {
  HomeBold,
  MagniferBold,
  ClapperboardPlayBold,
  TVBold,
  DownloadMinimalisticBold,
  SubtitlesBold,
  ServerMinimalisticBold,
  SettingsMinimalisticBold,
} from 'solar-icon-set';
import './Sidebar.css';

const mainNavItems = [
  { path: '/',         label: 'Home',      Icon: HomeBold },
  { path: '/search',   label: 'Search',    Icon: MagniferBold },
  { path: '/movies',   label: 'Movies',    Icon: ClapperboardPlayBold },
  { path: '/tv-shows', label: 'TV Shows',  Icon: TVBold },
  { path: '/downloads',label: 'Downloads', Icon: DownloadMinimalisticBold },
  { path: '/subtitles',label: 'Subtitles', Icon: SubtitlesBold },
  { path: '/server',   label: 'Server',    Icon: ServerMinimalisticBold },
];

import { useNotifications } from '../../context/NotificationContext';

export default function Sidebar() {
  const { unreadCount } = useNotifications();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/wucine_logo_icon.png" alt="WU-CINE Logo" className="sidebar-logo-img" />
        <img src="/wucine_wordmark_text_white.png" alt="WU-CINE" className="sidebar-wordmark-img" />
      </div>

      <nav className="sidebar-nav">
        {mainNavItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={path === '/'}
          >
            <span className="nav-item-icon">
              <Icon size={20} />
            </span>
            <span>{label}</span>
            {label === 'Home' && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-nav-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-item-icon">
            <SettingsMinimalisticBold size={20} />
          </span>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
