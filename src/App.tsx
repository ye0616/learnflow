import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import FlowEditor from './pages/FlowEditor'
import MyFlowsPage from './pages/MyFlowsPage'
import SettingsPage from './pages/SettingsPage'
import RoomListPage from './pages/RoomListPage'
import RoomCreatePage from './pages/RoomCreatePage'
import StudyRoomPage from './pages/StudyRoomPage'
import ProfilePage from './pages/ProfilePage'
import PortfolioBuilderPage from './pages/PortfolioBuilderPage'
import PortfolioShowcase from './pages/PortfolioShowcase'
import { StudyMap, Workshop, Report } from './pages/PlaceholderPages'

function AppLayout() {
  const location = useLocation()
  const isEditor = location.pathname === '/editor'
  const hideSidebar = isEditor || location.pathname === '/portfolio/showcase'
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {!hideSidebar && <Sidebar />}
      <main className={`flex-1 overflow-hidden flex flex-col ${isEditor ? '' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor" element={<FlowEditor />} />
          <Route path="/flows" element={<MyFlowsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/room" element={<RoomListPage />} />
          <Route path="/room/new" element={<RoomCreatePage />} />
          <Route path="/room/:id" element={<StudyRoomPage />} />
          <Route path="/map" element={<StudyMap />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/portfolio/builder" element={<PortfolioBuilderPage />} />
          <Route path="/portfolio/showcase" element={<PortfolioShowcase />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
