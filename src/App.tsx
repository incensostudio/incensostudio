import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Site } from './site/Site'
import { OsApp } from './os/OsApp'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Site />} />
        <Route path="/os" element={<OsApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
