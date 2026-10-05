import { Route, Routes } from 'react-router'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ChapterPage } from './pages/ChapterPage'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Privacy } from './pages/Privacy'
import { ProgressProvider } from './ProgressContext'
import { usePageMeta } from './usePageMeta'

function Pages() {
  usePageMeta()
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chapters/:slug" element={<ChapterPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App() {
  return (
    <ProgressProvider>
      <a className="skip" href="#content">Skip to content</a>
      <Header />
      <div id="content">
        <Pages />
      </div>
      <Footer />
    </ProgressProvider>
  )
}
