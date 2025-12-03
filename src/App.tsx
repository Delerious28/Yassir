import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'))
const Leads = lazy(() => import('./pages/Leads'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Logs = lazy(() => import('./pages/Logs'))
const Settings = lazy(() => import('./pages/Settings'))
const SendPage = lazy(() => import('./pages/Send'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-lg" style={{ color: 'rgb(var(--muted))' }}>Loading...</div></div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaigns/:id/send" element={<CampaignDetail />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
