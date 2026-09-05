import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmation: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  const submit = event => {
    event.preventDefault();
    if (!/^[\p{L}\s.'-]{2,100}$/u.test(form.name.trim())) return setMessage("Nama hanya boleh berisi huruf dan tanda baca nama, sepanjang 2–100 karakter.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setMessage("Masukkan alamat email yang valid.");
    if (form.password.length < 8) return setMessage("Password minimal 8 karakter.");
    if (form.password.length > 128) return setMessage("Password maksimal 128 karakter.");
    if (form.password !== form.confirmation) return setMessage("Konfirmasi password tidak cocok.");
    setMessage("Form sudah valid. Endpoint registrasi backend belum tersedia untuk membuat akun.");
  };

  return <>
    <Helmet><title>Daftar | Gakuren</title></Helmet>
    <div className="login-page relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-20 dark:from-[#0b1220] dark:via-[#121212] dark:to-[#111827]">
      <Link to="/login" className="action-lift absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white/80 px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm sm:left-6 sm:top-6"><ArrowLeft className="h-4 w-4" />Kembali ke login</Link>
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <div className="w-full max-w-md">
        <div className="mb-7 text-center"><img src="/favicon.svg" alt="Gakuren" className="mx-auto h-16 w-16 rounded-2xl bg-white p-1 shadow-lg" /><h1 className="login-title mt-4 text-3xl font-bold text-brand-900 dark:text-blue-100">Buat Akun</h1><p className="login-subtitle mt-2 text-brand-600 dark:text-blue-200">Daftar menggunakan alamat email Anda</p></div>
        <form onSubmit={submit} className="login-card space-y-4 rounded-2xl border border-transparent bg-white p-6 shadow-panel dark:border-white/10 dark:bg-[#1e1e1e] sm:p-8">
          {[["Nama lengkap", "name", "text", User], ["Email", "email", "email", Mail]].map(([label, name, type, Icon]) => <label key={name} className="block text-sm font-medium text-brand-900 dark:text-slate-200"><span className="mb-2 block">{label}</span><span className="relative block"><Icon className="absolute left-3 top-3.5 h-5 w-5 text-brand-400" /><input required maxLength={name === "email" ? 254 : 100} name={name} type={type} value={form[name]} onChange={update} className="w-full rounded-lg border border-brand-200 py-3 pl-10 pr-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" /></span></label>)}
          {["password", "confirmation"].map((name, index) => <label key={name} className="block text-sm font-medium text-brand-900 dark:text-slate-200"><span className="mb-2 block">{index ? "Konfirmasi password" : "Password"}</span><span className="relative block"><Lock className="absolute left-3 top-3.5 h-5 w-5 text-brand-400" /><input required minLength={8} maxLength={128} name={name} type={showPassword ? "text" : "password"} value={form[name]} onChange={update} className="w-full rounded-lg border border-brand-200 py-3 pl-10 pr-12 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />{index === 0 && <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-3.5 text-brand-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}</span></label>)}
          {message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{message}</p>}
          <button className="login-submit w-full rounded-lg bg-brand-700 py-3 font-semibold text-white shadow-md">Daftar</button>
          <p className="text-center text-sm text-brand-600">Sudah punya akun? <Link to="/login" className="font-semibold">Masuk</Link></p>
        </form>
      </div>
    </div>
  </>;
}
