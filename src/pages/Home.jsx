import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import LandingSections from '../components/LandingSections'
import Pricing from '../components/Pricing'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import { FAQ, Roadmap } from '../components/PostPricing'
export default function Home(){return <><Helmet><title>Gakuren | Platform Manajemen Sekolah</title><meta name="description" content="Gakuren menghubungkan administrasi, kehadiran, penggajian, kegiatan belajar, penilaian, dan laporan sekolah dalam satu aplikasi."/></Helmet><Navbar/><main className="landing-page overflow-x-clip"><Hero/><LandingSections/><Pricing/><Roadmap/><FAQ/><CTA/></main><Footer/></>}
