import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import LandingSections from '../components/LandingSections'
import Pricing from '../components/Pricing'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
export default function Home(){return <><Helmet><title>Gakuren — Sistem Operasional Sekolah</title><meta name="description" content="Gakuren mengubah data kehadiran menjadi tindakan lebih cepat untuk operasional sekolah Indonesia."/></Helmet><Navbar/><main className="landing-page overflow-x-clip"><Hero/><LandingSections/><Pricing/><CTA/></main><Footer/></>}
