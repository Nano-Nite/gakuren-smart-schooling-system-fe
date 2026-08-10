import { Bell, LayoutDashboard, CalendarCheck, ClipboardList, Users, GraduationCap, Wallet, FileText, Settings } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'
import { attendanceData, recentRequests } from '../data/content'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: CalendarCheck, label: 'Absensi' },
  { icon: ClipboardList, label: 'Izin & Sakit' },
  { icon: Users, label: 'Guru & Pegawai' },
  { icon: GraduationCap, label: 'Siswa' },
  { icon: Wallet, label: 'Payroll' },
  { icon: FileText, label: 'Laporan' },
  { icon: Settings, label: 'Pengaturan' },
]

const stats = [
  { label: 'Hadir Hari Ini', value: '352', delta: '+12% dari kemarin', tone: 'text-emerald-600' },
  { label: 'Izin', value: '15', delta: '-8% dari kemarin', tone: 'text-emerald-600' },
  { label: 'Terlambat', value: '23', delta: '+5% dari kemarin', tone: 'text-rose-600' },
]

export default function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <img src="/favicon.svg" alt="Gakuren logo" className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-white text-xs" />
          Gakuren
        </span>
        <span className="text-sm font-semibold text-slate-700">Dashboard</span>
        <span className="flex items-center gap-3">
          <Bell size={16} className="text-slate-400" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="h-6 w-6 rounded-full bg-slate-200" />
            <span className="hidden sm:inline">Admin Sekolah</span>
          </span>
        </span>
      </div>

      <div className="flex">
        <aside className="hidden w-40 shrink-0 border-r border-slate-100 py-4 sm:block">
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`mx-2 mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                item.active ? 'bg-brand-50 text-brand-700' : 'text-slate-500'
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </div>
          ))}
        </aside>

        <div className="flex-1 space-y-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 p-3">
                <p className="text-[11px] text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{s.value}</p>
                <p className={`text-[10px] font-medium ${s.tone}`}>{s.delta}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <p className="mb-2 text-[11px] font-medium text-slate-500">Grafik Kehadiran</p>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hadirFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A46D6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4A46D6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="hadir" stroke="#4A46D6" strokeWidth={2} fill="url(#hadirFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-[11px] font-medium text-slate-500">Pengajuan Terbaru</p>
              <ul className="space-y-2">
                {recentRequests.map((r) => (
                  <li key={r.name} className="flex items-center gap-2 text-[11px]">
                    <span className="h-5 w-5 shrink-0 rounded-full bg-slate-200" />
                    <span className="flex-1 truncate font-medium text-slate-700">{r.name}</span>
                    <span className="text-slate-400">{r.type}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[11px] font-medium text-slate-500">Periode Payroll</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900">Agustus 2026</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Status</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">Terbuka</span>
              </div>
              <button className="mt-3 w-full rounded-lg bg-brand-600 py-1.5 text-[11px] font-semibold text-white">
                Proses Payroll
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
