import { HelmetProvider, Helmet } from 'react-helmet-async'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import CTA from './components/CTA'
import Footer from './components/Footer'
import OfflineBanner from './components/OfflineBanner'

export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Gakuren — Kelola Kehadiran, Sederhanakan Sekolah</title>
        <meta
          name="description"
          content="Gakuren membantu sekolah mengelola absensi, izin, penggajian guru, hingga laporan dalam satu platform yang aman, mudah digunakan, dan terintegrasi."
        />
      </Helmet>
      <OfflineBanner />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </HelmetProvider>
  )
}
