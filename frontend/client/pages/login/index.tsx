import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

function WeConnectIcon() {
  return (
    <svg width="30" height="29" viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 28.75C6.45833 28.75 5.57292 28.3854 4.84375 27.6562C4.11458 26.9271 3.75 26.0417 3.75 25C3.75 23.9583 4.11458 23.0729 4.84375 22.3438C5.57292 21.6146 6.45833 21.25 7.5 21.25C7.79167 21.25 8.0625 21.2812 8.3125 21.3438C8.5625 21.4062 8.80208 21.4896 9.03125 21.5938L10.8125 19.375C10.2292 18.7292 9.82292 18 9.59375 17.1875C9.36458 16.375 9.3125 15.5625 9.4375 14.75L6.90625 13.9062C6.55208 14.4271 6.10417 14.8438 5.5625 15.1562C5.02083 15.4688 4.41667 15.625 3.75 15.625C2.70833 15.625 1.82292 15.2604 1.09375 14.5312C0.364583 13.8021 0 12.9167 0 11.875C0 10.8333 0.364583 9.94792 1.09375 9.21875C1.82292 8.48958 2.70833 8.125 3.75 8.125C4.79167 8.125 5.67708 8.48958 6.40625 9.21875C7.13542 9.94792 7.5 10.8333 7.5 11.875C7.5 11.9167 7.5 11.9583 7.5 12C7.5 12.0417 7.5 12.0833 7.5 12.125L10.0312 13C10.4479 12.25 11.0052 11.6146 11.7031 11.0938C12.401 10.5729 13.1875 10.2396 14.0625 10.0938V7.375C13.25 7.14583 12.5781 6.70312 12.0469 6.04688C11.5156 5.39062 11.25 4.625 11.25 3.75C11.25 2.70833 11.6146 1.82292 12.3438 1.09375C13.0729 0.364583 13.9583 0 15 0C16.0417 0 16.9271 0.364583 17.6562 1.09375C18.3854 1.82292 18.75 2.70833 18.75 3.75C18.75 4.625 18.4792 5.39062 17.9375 6.04688C17.3958 6.70312 16.7292 7.14583 15.9375 7.375V10.0938C16.8125 10.2396 17.599 10.5729 18.2969 11.0938C18.9948 11.6146 19.5521 12.25 19.9688 13L22.5 12.125C22.5 12.0833 22.5 12.0417 22.5 12C22.5 11.9583 22.5 11.9167 22.5 11.875C22.5 10.8333 22.8646 9.94792 23.5938 9.21875C24.3229 8.48958 25.2083 8.125 26.25 8.125C27.2917 8.125 28.1771 8.48958 28.9062 9.21875C29.6354 9.94792 30 10.8333 30 11.875C30 12.9167 29.6354 13.8021 28.9062 14.5312C28.1771 15.2604 27.2917 15.625 26.25 15.625C25.5833 15.625 24.974 15.4688 24.4219 15.1562C23.8698 14.8438 23.4271 14.4271 23.0938 13.9062L20.5625 14.75C20.6875 15.5625 20.6354 16.3698 20.4062 17.1719C20.1771 17.974 19.7708 18.7083 19.1875 19.375L20.9688 21.5625C21.1979 21.4583 21.4375 21.3802 21.6875 21.3281C21.9375 21.276 22.2083 21.25 22.5 21.25C23.5417 21.25 24.4271 21.6146 25.1562 22.3438C25.8854 23.0729 26.25 23.9583 26.25 25C26.25 26.0417 25.8854 26.9271 25.1562 27.6562C24.4271 28.3854 23.5417 28.75 22.5 28.75C21.4583 28.75 20.5729 28.3854 19.8438 27.6562C19.1146 26.9271 18.75 26.0417 18.75 25C18.75 24.5833 18.8177 24.1823 18.9531 23.7969C19.0885 23.4115 19.2708 23.0625 19.5 22.75L17.7188 20.5312C16.8646 21.0104 15.9531 21.25 14.9844 21.25C14.0156 21.25 13.1042 21.0104 12.25 20.5312L10.5 22.75C10.7292 23.0625 10.9115 23.4115 11.0469 23.7969C11.1823 24.1823 11.25 24.5833 11.25 25C11.25 26.0417 10.8854 26.9271 10.1562 27.6562C9.42708 28.3854 8.54167 28.75 7.5 28.75ZM3.75 13.125C4.10417 13.125 4.40104 13.0052 4.64062 12.7656C4.88021 12.526 5 12.2292 5 11.875C5 11.5208 4.88021 11.224 4.64062 10.9844C4.40104 10.7448 4.10417 10.625 3.75 10.625C3.39583 10.625 3.09896 10.7448 2.85938 10.9844C2.61979 11.224 2.5 11.5208 2.5 11.875C2.5 12.2292 2.61979 12.526 2.85938 12.7656C3.09896 13.0052 3.39583 13.125 3.75 13.125ZM7.5 26.25C7.85417 26.25 8.15104 26.1302 8.39062 25.8906C8.63021 25.651 8.75 25.3542 8.75 25C8.75 24.6458 8.63021 24.349 8.39062 24.1094C8.15104 23.8698 7.85417 23.75 7.5 23.75C7.14583 23.75 6.84896 23.8698 6.60938 24.1094C6.36979 24.349 6.25 24.6458 6.25 25C6.25 25.3542 6.36979 25.651 6.60938 25.8906C6.84896 26.1302 7.14583 26.25 7.5 26.25ZM15 5C15.3542 5 15.651 4.88021 15.8906 4.64062C16.1302 4.40104 16.25 4.10417 16.25 3.75C16.25 3.39583 16.1302 3.09896 15.8906 2.85938C15.651 2.61979 15.3542 2.5 15 2.5C14.6458 2.5 14.349 2.61979 14.1094 2.85938C13.8698 3.09896 13.75 3.39583 13.75 3.75C13.75 4.10417 13.8698 4.40104 14.1094 4.64062C14.349 4.88021 14.6458 5 15 5ZM15 18.75C15.875 18.75 16.6146 18.4479 17.2188 17.8438C17.8229 17.2396 18.125 16.5 18.125 15.625C18.125 14.75 17.8229 14.0104 17.2188 13.4062C16.6146 12.8021 15.875 12.5 15 12.5C14.125 12.5 13.3854 12.8021 12.7812 13.4062C12.1771 14.0104 11.875 14.75 11.875 15.625C11.875 16.5 12.1771 17.2396 12.7812 17.8438C13.3854 18.4479 14.125 18.75 15 18.75ZM22.5 26.25C22.8542 26.25 23.151 26.1302 23.3906 25.8906C23.6302 25.651 23.75 25.3542 23.75 25C23.75 24.6458 23.6302 24.349 23.3906 24.1094C23.151 23.8698 22.8542 23.75 22.5 23.75C22.1458 23.75 21.849 23.8698 21.6094 24.1094C21.3698 24.349 21.25 24.6458 21.25 25C21.25 25.3542 21.3698 25.651 21.6094 25.8906C21.849 26.1302 22.1458 26.25 22.5 26.25ZM26.25 13.125C26.6042 13.125 26.901 13.0052 27.1406 12.7656C27.3802 12.526 27.5 12.2292 27.5 11.875C27.5 11.5208 27.3802 11.224 27.1406 10.9844C26.901 10.7448 26.6042 10.625 26.25 10.625C25.8958 10.625 25.599 10.7448 25.3594 10.9844C25.1198 11.224 25 11.5208 25 11.875C25 12.2292 25.1198 12.526 25.3594 12.7656C25.599 13.0052 25.8958 13.125 26.25 13.125Z" fill="#4EDEA3"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14Z" stroke="#64748B" strokeWidth="1.5"/>
      <path d="M7 14C8.65685 14 10 10.866 10 7C10 3.13401 8.65685 0 7 0C5.34315 0 4 3.13401 4 7C4 10.866 5.34315 14 7 14Z" stroke="#64748B" strokeWidth="1.5"/>
      <path d="M0 7H14" stroke="#64748B" strokeWidth="1.5"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function Index() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "vi";

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password, from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.login.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (nextLang: "vi" | "ja") => {
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-inter">
      {/* Left Panel */}
      <div className="relative hidden md:flex flex-col md:w-[42%] bg-gradient-to-b from-[#050B14] to-[#121A24] overflow-hidden md:min-h-screen">
        {/* Logo */}
        <div className="flex items-center gap-3 px-12 pt-14">
          <WeConnectIcon />
          <span className="text-white font-bold text-xl tracking-tight">WeConnect</span>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center px-12 pb-40 md:pb-48">
          <h1 className="text-white font-bold text-4xl leading-snug">
            {t("auth.login.welcomeHero").split("\n")[0]}
            <br />
            {t("auth.login.welcomeHero").split("\n")[1]}
          </h1>
          <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-[400px]">
            {t("auth.login.welcomeDesc")}
          </p>
        </div>

        {/* Wave layers */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none">
          <svg
            viewBox="0 0 500 141"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: "141px", display: "block" }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 140.833H500V20.8333C433.333 -12.5 366.667 -5.83334 300 40.8333C233.333 87.5 133.333 74.1667 0 0.833333V140.833Z"
              fill="#08101A"
            />
          </svg>
          <svg
            viewBox="0 0 500 83"
            preserveAspectRatio="none"
            className="w-full absolute bottom-0 left-0"
            style={{ height: "83px", display: "block" }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 82.8571H500V12.8571C400 -7.14286 316.667 -3.80952 250 22.8571C183.333 49.5238 100 42.8571 0 2.85714V82.8571Z"
              fill="#04070D"
            />
          </svg>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col min-h-screen">
        {/* Language selector */}
        <div className="flex justify-end px-8 pt-12">
          <button
            className="flex items-center gap-2 group"
            onClick={() => handleLanguageChange(currentLang.startsWith("vi") ? "ja" : "vi")}
            type="button"
          >
            <GlobeIcon />
            <span
              className={`text-[11px] font-bold ${currentLang.startsWith("vi") ? "text-[#10B981]" : "text-slate-400"} transition-colors`}
            >
              TIẾNG VIỆT
            </span>
            <span className="text-slate-300 text-[11px]">|</span>
            <span
              className={`text-[11px] font-bold ${currentLang.startsWith("ja") ? "text-[#10B981]" : "text-slate-400"} transition-colors`}
            >
              TIẾNG NHẬT
            </span>
          </button>
        </div>

        {/* Mobile Logo */}
        <div className="flex md:hidden items-center justify-center gap-3 pt-6 pb-2">
          <WeConnectIcon />
          <span className="text-[#1E293B] font-bold text-xl tracking-tight">WeConnect</span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-[420px]">
            <h2 className="text-[#1E293B] text-[28px] font-normal mb-10 leading-snug">
              {t("auth.login.title")}
            </h2>

            {/* Email field */}
            <div className="mb-2">
              <label className="block text-[#64748B] text-[11px] font-bold tracking-widest mb-3 uppercase">
                {t("auth.login.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.login.emailPlaceholder")}
                className="w-full bg-transparent text-[#1E293B] placeholder-[#94A3B8] text-[15px] outline-none pb-3 focus:placeholder-transparent"
              />
              <div className="border-b border-[#E2E8F0]" />
            </div>

            {/* Password field */}
            <div className="mt-8 mb-2">
              <label className="block text-[#64748B] text-[11px] font-bold tracking-widest mb-3 uppercase">
                {t("auth.login.password")}
              </label>
              <div className="flex items-center pb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  className="flex-1 bg-transparent text-[#1E293B] placeholder-[#94A3B8] text-[15px] outline-none focus:placeholder-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <div className="border-b border-[#E2E8F0]" />
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between mt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-[14px] h-[14px] rounded-[3px] border border-[#CBD5E1] flex items-center justify-center flex-shrink-0 transition-colors ${
                    rememberMe ? "bg-[#10B981] border-[#10B981]" : "bg-transparent"
                  }`}
                >
                  {rememberMe && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <span className="text-[#64748B] text-[13px]">{t("auth.login.rememberMe")}</span>
              </label>
              <Link to="/forgot-password" className="text-[#10B981] font-bold text-[13px] hover:opacity-80 transition-opacity">
                {t("auth.login.forgotPasswordLink")}
              </Link>
            </div>

            {/* Login button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-10 bg-[#0F172A] text-white text-[14px] font-normal rounded-md py-[14px] px-4 hover:bg-[#1e293b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
            {error && (
              <p className="mt-3 text-red-500 text-[13px] text-center">{error}</p>
            )}

            {/* Register link */}
            <p className="text-center mt-8 text-[13px]">
              <span className="text-[#64748B]">{t("auth.login.noAccount")}</span>
              <Link to="/register" className="text-[#10B981] font-bold hover:opacity-80 transition-opacity">
                {t("auth.login.registerNow")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
