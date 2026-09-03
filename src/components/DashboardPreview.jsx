import mockupApps from '../../mockup_apps.png'

export default function DashboardPreview() {
  return <figure className="relative mx-auto w-full max-w-[760px]" aria-label="Gakuren dapat digunakan melalui komputer, tablet, dan ponsel"><div className="absolute inset-x-[8%] top-[18%] h-[58%] rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true"/><img src={mockupApps} alt="Tampilan demo Gakuren pada komputer, tablet, dan ponsel" className="relative h-auto w-full object-contain drop-shadow-[0_28px_45px_rgba(15,23,42,.35)]"/></figure>
}
