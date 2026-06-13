import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import HomeScreen from '../screens/HomeScreen/HomeScreen';
import SearchScreen from '../screens/SearchScreen/SearchScreen';
import MoviesScreen from '../screens/MoviesScreen/MoviesScreen';
import TvShowsScreen from '../screens/TvShowsScreen/TvShowsScreen';
import CollectionsScreen from '../screens/CollectionsScreen/CollectionsScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen/MovieDetailScreen';
import CacheManagerScreen from '../screens/CacheManagerScreen/CacheManagerScreen';
import SubtitlesScreen from '../screens/SubtitlesScreen/SubtitlesScreen';
import ServerScreen from '../screens/ServerScreen/ServerScreen';
import SettingsScreen from '../screens/SettingsScreen/SettingsScreen';
import PlayerScreen from '../screens/PlayerScreen/PlayerScreen';
import ShowDetailScreen from '../screens/ShowDetailScreen/ShowDetailScreen';
import CollectionDetailScreen from '../screens/CollectionDetailScreen/CollectionDetailScreen';

// Note: LoginScreen is no longer a route — it's rendered by App.tsx
// based on auth state from AuthContext.

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'search', element: <SearchScreen /> },
      { path: 'movies', element: <MoviesScreen /> },
      { path: 'tv-shows', element: <TvShowsScreen /> },
      { path: 'collections', element: <CollectionsScreen /> },
      { path: 'collection/:id', element: <CollectionDetailScreen /> },
      { path: 'movie/:id', element: <MovieDetailScreen /> },
      { path: 'show/:id', element: <ShowDetailScreen /> },
      { path: 'downloads', element: <CacheManagerScreen /> },
      { path: 'subtitles', element: <SubtitlesScreen /> },
      { path: 'server', element: <ServerScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
    ],
  },
  { path: '/player/:itemId', element: <PlayerScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
