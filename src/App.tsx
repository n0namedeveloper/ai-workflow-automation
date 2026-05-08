import { Routes, Route } from 'react-router'
import { SidebarProvider } from '@/components/ui/sidebar'
import Home from './pages/Home'
import Workflows from './pages/Workflows'
import PipelineRuns from './pages/PipelineRuns'
import Settings from './pages/Settings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import AppLayout from './components/AppLayout'

export default function App() {
  return (
    <SidebarProvider defaultOpen={true}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/runs" element={<PipelineRuns />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SidebarProvider>
  )
}
