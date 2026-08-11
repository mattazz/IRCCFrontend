import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { DrawAnalysisPage } from './pages/DrawAnalysisPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/draws" element={<DrawAnalysisPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
