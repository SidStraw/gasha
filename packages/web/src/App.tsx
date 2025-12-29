import { Routes, Route, Navigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { LIMITS } from '@gasha/shared'
import Overlay from './pages/Overlay'
import Controller from './pages/Controller'

function App() {
  return (
    <Routes>
      {/* 首頁重導向到新房間 */}
      <Route 
        path="/" 
        element={<Navigate to={`/controller/${nanoid(LIMITS.ROOM_ID_LENGTH)}`} replace />} 
      />
      
      {/* 控制端 */}
      <Route path="/controller/:roomId" element={<Controller />} />
      
      {/* OBS 顯示端 */}
      <Route path="/overlay/:roomId" element={<Overlay />} />
    </Routes>
  )
}

export default App
