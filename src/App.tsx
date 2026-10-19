import { HashRouter, Outlet, Route, Routes } from 'react-router'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Browse from './pages/Browse'
import DialogueView from './pages/DialogueView'
import Quiz from './pages/Quiz'
import Review from './pages/Review'
import Phrasebook from './pages/Phrasebook'
import Settings from './pages/Settings'
import Import from './pages/Import'

function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<Browse />} />
          <Route path="d/:id" element={<DialogueView />} />
          <Route path="d/:id/quiz" element={<Quiz />} />
          <Route path="review" element={<Review />} />
          <Route path="phrases" element={<Phrasebook />} />
          <Route path="settings" element={<Settings />} />
          <Route path="import" element={<Import />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
