import { BellRing, MapPinned, Radar, ShieldCheck } from 'lucide-react'

const chapters = [
  { kicker: '01 · DETEKSI', title: 'Satu siswa tidak hadir.', accent: 'Gakuren langsung menyadarinya.', desc: 'Kehadiran tercatat dari kelas, lengkap dengan waktu dan validasi lokasi.', icon: Radar, color: '#42a5f5' },
  { kicker: '02 · HUBUNGKAN', title: 'Bukan menunggu akhir hari.', accent: 'Orang tua segera mendapat kabar.', desc: 'Notifikasi real-time membuka ruang konfirmasi izin atau sakit dalam satu alur.', icon: BellRing, color: '#34d399' },
  { kicker: '03 · PAHAMI', title: 'Bukan hanya satu titik.', accent: 'Pola kehadiran mulai terlihat.', desc: 'Keterlambatan dan ketidakhadiran berulang tidak lagi tenggelam di dalam spreadsheet.', icon: MapPinned, color: '#a78bfa' },
  { kicker: '04 · BERTINDAK', title: 'Sebelum siswa menjauh,', accent: 'sekolah bisa lebih dulu mendekat.', desc: 'Wali kelas mendapat konteks yang tepat untuk melakukan tindak lanjut yang manusiawi.', icon: ShieldCheck, color: '#fb7185' },
]

export default function ScrollStory() {
  return (
    <section id="cerita" className="relative bg-[#05070c] text-white">
      {chapters.map((chapter, index) => (
        <article key={chapter.kicker} className="landing-section story-chapter relative h-[calc(100svh-73px)]" style={{ '--story-color': chapter.color }}>
          <div className="flex h-full items-center overflow-hidden">
            <div className="story-chapter-bg absolute inset-0" />
            <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_.9fr] lg:items-center lg:px-8">
              <div className="story-chapter-copy max-w-3xl py-8">
                <span className="text-xs font-bold tracking-[0.22em]" style={{ color: chapter.color }}>{chapter.kicker}</span>
                <h2 className="mt-5 max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.06] tracking-[-0.04em]">
                  {chapter.title}<br /><span className="text-white/45">{chapter.accent}</span>
                </h2>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">{chapter.desc}</p>
              </div>

              <div className="relative mx-auto hidden aspect-square w-full max-w-md place-items-center lg:grid">
                <div className="story-ring absolute inset-[8%] rounded-full border border-white/10" style={{ transform: `rotate(${index * 40}deg)` }} />
                <div className="story-ring absolute inset-[19%] rounded-full border border-dashed border-white/15" style={{ transform: `rotate(${-index * 65}deg)` }} />
                <div className="relative grid h-44 w-44 place-items-center rounded-[2.5rem] border border-white/15 bg-white/[.06] shadow-2xl backdrop-blur-xl" style={{ boxShadow: `0 0 90px ${chapter.color}35` }}>
                  <chapter.icon size={58} style={{ color: chapter.color }} />
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
