import { Clock3, MinusCircle, Smartphone, UserRound } from 'lucide-react'

const attendanceStats = [
  { label: 'Hadir', value: '421', suffix: '/ 490', percent: '99.4%', Icon: UserRound, color: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
  { label: 'Terlambat', value: '10', percent: '4%', Icon: Clock3, color: 'border-orange-200 bg-orange-50 text-orange-600' },
  { label: 'Izin / Sakit', value: '5', percent: '2%', Icon: Smartphone, color: 'border-purple-200 bg-purple-50 text-purple-600' },
  { label: 'Alfa', value: '1', percent: '0.04%', Icon: MinusCircle, color: 'border-rose-200 bg-rose-50 text-rose-600' },
]

export default function AttendanceStats({ horizontal = false }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${horizontal ? 'lg:grid-cols-4' : ''}`}>
      {attendanceStats.map(({ label, value, suffix, percent, Icon, color }) => (
        <article key={label} className={`flex min-h-[92px] items-center gap-3 rounded-xl border p-3 ${color}`}>
          <Icon className="h-9 w-9 shrink-0" strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-xs font-medium">{label}</p>
            <p className="mt-0.5 whitespace-nowrap text-2xl font-bold leading-none">
              {value} <span className="text-sm font-normal opacity-70">{suffix}</span>
            </p>
            <p className="mt-2 text-[10px] opacity-80">{percent}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
