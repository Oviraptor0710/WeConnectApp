import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import SearchPopup from "./SearchPopup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserOut {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  role: string;
}

const WeConnectLogo = () => (
  <svg width="28" height="25" viewBox="0 0 30 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 28.75C6.45833 28.75 5.57292 28.3854 4.84375 27.6562C4.11458 26.9271 3.75 26.0417 3.75 25C3.75 23.9583 4.11458 23.0729 4.84375 22.3438C5.57292 21.6146 6.45833 21.25 7.5 21.25C7.79167 21.25 8.0625 21.2812 8.3125 21.3438C8.5625 21.4062 8.80208 21.4896 9.03125 21.5938L10.8125 19.375C10.2292 18.7292 9.82292 18 9.59375 17.1875C9.36458 16.375 9.3125 15.5625 9.4375 14.75L6.90625 13.9062C6.55208 14.4271 6.10417 14.8438 5.5625 15.1562C5.02083 15.4688 4.41667 15.625 3.75 15.625C2.70833 15.625 1.82292 15.2604 1.09375 14.5312C0.364583 13.8021 0 12.9167 0 11.875C0 10.8333 0.364583 9.94792 1.09375 9.21875C1.82292 8.48958 2.70833 8.125 3.75 8.125C4.79167 8.125 5.67708 8.48958 6.40625 9.21875C7.13542 9.94792 7.5 10.8333 7.5 11.875C7.5 11.9167 7.5 11.9583 7.5 12C7.5 12.0417 7.5 12.0833 7.5 12.125L10.0312 13C10.4479 12.25 11.0052 11.6146 11.7031 11.0938C12.401 10.5729 13.1875 10.2396 14.0625 10.0938V7.375C13.25 7.14583 12.5781 6.70312 12.0469 6.04688C11.5156 5.39062 11.25 4.625 11.25 3.75C11.25 2.70833 11.6146 1.82292 12.3438 1.09375C13.0729 0.364583 13.9583 0 15 0C16.0417 0 16.9271 0.364583 17.6562 1.09375C18.3854 1.82292 18.75 2.70833 18.75 3.75C18.75 4.625 18.4792 5.39062 17.9375 6.04688C17.3958 6.70312 16.7292 7.14583 15.9375 7.375V10.0938C16.8125 10.2396 17.599 10.5729 18.2969 11.0938C18.9948 11.6146 19.5521 12.25 19.9688 13L22.5 12.125C22.5 12.0833 22.5 12.0417 22.5 12C22.5 11.9583 22.5 11.9167 22.5 11.875C22.5 10.8333 22.8646 9.94792 23.5938 9.21875C24.3229 8.48958 25.2083 8.125 26.25 8.125C27.2917 8.125 28.1771 8.48958 28.9062 9.21875C29.6354 9.94792 30 10.8333 30 11.875C30 12.9167 29.6354 13.8021 28.9062 14.5312C28.1771 15.2604 27.2917 15.625 26.25 15.625C25.5833 15.625 24.974 15.4688 24.4219 15.1562C23.8698 14.8438 23.4271 14.4271 23.0938 13.9062L20.5625 14.75C20.6875 15.5625 20.6354 16.3698 20.4062 17.1719C20.1771 17.974 19.7708 18.7083 19.1875 19.375L20.9688 21.5625C21.1979 21.4583 21.4375 21.3802 21.6875 21.3281C21.9375 21.276 22.2083 21.25 22.5 21.25C23.5417 21.25 24.4271 21.6146 25.1562 22.3438C25.8854 23.0729 26.25 23.9583 26.25 25C26.25 26.0417 25.8854 26.9271 25.1562 27.6562C24.4271 28.3854 23.5417 28.75 22.5 28.75C21.4583 28.75 20.5729 28.3854 19.8438 27.6562C19.1146 26.9271 18.75 26.0417 18.75 25C18.75 24.5833 18.8177 24.1823 18.9531 23.7969C19.0885 23.4115 19.2708 23.0625 19.5 22.75L17.7188 20.5312C16.8646 21.0104 15.9531 21.25 14.9844 21.25C14.0156 21.25 13.1042 21.0104 12.25 20.5312L10.5 22.75C10.7292 23.0625 10.9115 23.4115 11.0469 23.7969C11.1823 24.1823 11.25 24.5833 11.25 25C11.25 26.0417 10.8854 26.9271 10.1562 27.6562C9.42708 28.3854 8.54167 28.75 7.5 28.75Z" fill="#4EDEA3" />
  </svg>
);

const HomeIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.66667 13.3333H4.16667V8.33333H9.16667V13.3333H11.6667V5.83333L6.66667 2.08333L1.66667 5.83333V13.3333ZM0 15V5L6.66667 0L13.3333 5V15H7.5V10H5.83333V15H0Z" fill="currentColor" />
  </svg>
);

const FriendsIcon = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM15 13.3333V10.8333C15 10.2222 14.8299 9.63542 14.4896 9.07292C14.1493 8.51042 13.6667 8.02778 13.0417 7.625C13.75 7.70833 14.4167 7.85069 15.0417 8.05208C15.6667 8.25347 16.25 8.5 16.7917 8.79167C17.2917 9.06944 17.6736 9.37847 17.9375 9.71875C18.2014 10.059 18.3333 10.4306 18.3333 10.8333V13.3333H15ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM15 3.33333C15 4.25 14.6736 5.03472 14.0208 5.6875C13.3681 6.34028 12.5833 6.66667 11.6667 6.66667C11.5139 6.66667 11.3194 6.64931 11.0833 6.61458C10.8472 6.57986 10.6528 6.54167 10.5 6.5C10.875 6.05556 11.1632 5.5625 11.3646 5.02083C11.566 4.47917 11.6667 3.91667 11.6667 3.33333C11.6667 2.75 11.566 2.1875 11.3646 1.64583C11.1632 1.10417 10.875 0.611111 10.5 0.166667C10.6944 0.0972222 10.8889 0.0520833 11.0833 0.03125C11.2778 0.0104167 11.4722 0 11.6667 0C12.5833 0 13.3681 0.326389 14.0208 0.979167C14.6736 1.63194 15 2.41667 15 3.33333ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z" fill="currentColor" />
  </svg>
);

const MessageIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 16.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H3.33333L0 16.6667ZM2.625 11.6667H15V1.66667H1.66667V12.6042L2.625 11.6667Z" fill="currentColor" />
  </svg>
);

const EventIcon = () => (
  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5Z" fill="currentColor" />
  </svg>
);

const GameIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.1125 11.6667C1.40417 11.6667 0.855556 11.4201 0.466667 10.9271C0.0777778 10.434 -0.0680556 9.83333 0.0291667 9.125L0.904167 2.875C1.02917 2.04167 1.40069 1.35417 2.01875 0.8125C2.63681 0.270833 3.3625 0 4.19583 0H12.4458C13.2792 0 14.0049 0.270833 14.6229 0.8125C15.241 1.35417 15.6125 2.04167 15.7375 2.875L16.6125 9.125C16.7097 9.83333 16.5639 10.434 16.175 10.9271C15.7861 11.4201 15.2375 11.6667 14.5292 11.6667C14.2375 11.6667 13.9667 11.6146 13.7167 11.5104C13.4667 11.4062 13.2375 11.25 13.0292 11.0417L11.1542 9.16667H5.4875L3.6125 11.0417C3.40417 11.25 3.175 11.4062 2.925 11.5104C2.675 11.6146 2.40417 11.6667 2.1125 11.6667ZM12.4875 6.66667C12.7236 6.66667 12.9215 6.58681 13.0813 6.42708C13.241 6.26736 13.3208 6.06944 13.3208 5.83333C13.3208 5.59722 13.241 5.39931 13.0813 5.23958C12.9215 5.07986 12.7236 5 12.4875 5C12.2514 5 12.0535 5.07986 11.8938 5.23958C11.734 5.39931 11.6542 5.59722 11.6542 5.83333C11.6542 6.06944 11.734 6.26736 11.8938 6.42708C12.0535 6.58681 12.2514 6.66667 12.4875 6.66667ZM10.8208 4.16667C11.0569 4.16667 11.2549 4.08681 11.4146 3.92708C11.5743 3.76736 11.6542 3.56944 11.6542 3.33333C11.6542 3.09722 11.5743 2.89931 11.4146 2.73958C11.2549 2.57986 11.0569 2.5 10.8208 2.5C10.5847 2.5 10.3868 2.57986 10.2271 2.73958C10.0674 2.89931 9.9875 3.09722 9.9875 3.33333C9.9875 3.56944 10.0674 3.76736 10.2271 3.92708C10.3868 4.08681 10.5847 4.16667 10.8208 4.16667ZM4.77917 6.66667H6.02917V5.20833H7.4875V3.95833H6.02917V2.5H4.77917V3.95833H3.32083V5.20833H4.77917V6.66667Z" fill="currentColor" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z" fill="#94A3B8" />
  </svg>
);

const navLinks = [
  { href: "/", label: "navbar.home", icon: HomeIcon },
  { href: "/friends", label: "navbar.friends", icon: FriendsIcon },
  { href: "/chat", label: "navbar.chat", icon: MessageIcon },
  { href: "/events", label: "navbar.events", icon: EventIcon },
  { href: "/games", label: "navbar.games", icon: GameIcon },
];

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close search popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserOut>("/api/v1/users/me"),
  });

  let displayLinks = [...navLinks];
  if (user?.role === "ORGANIZER") {
    displayLinks = [
      { href: "/organizer/stats", label: "Thống kê", icon: HomeIcon },
      { href: "/organizer/events", label: "Sự kiện", icon: EventIcon }
    ];
  } else if (user?.role === "admin") {
    displayLinks = [
      { href: "/admin/stats", label: "Thống kê", icon: HomeIcon },
      { href: "/admin/events-management", label: "Sự kiện", icon: EventIcon }
    ];
  }

  return (
    <header className="bg-white border-b border-wc-border sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-16 gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <WeConnectLogo />
          <div className="flex flex-col leading-none">
            <span className="text-wc-dark font-extrabold text-[18px] tracking-tight">
              WeConnect
            </span>
            {(user?.role === "ORGANIZER" || user?.role === "admin") && (
              <span className="text-[10px] font-bold text-wc-green uppercase tracking-wider mt-0.5">
                {user?.role}
              </span>
            )}
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-stretch h-16 gap-1">
          {displayLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(href);
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-2 px-4 text-sm font-semibold transition-colors ${active
                    ? "text-wc-green border-b-2 border-wc-green"
                    : "text-wc-gray hover:text-wc-green"
                  }`}
              >
                <span className={active ? "text-wc-green" : "text-wc-gray"}>
                  <Icon />
                </span>
                {t(label)}
              </Link>
            );
          })}
        </nav>

        {/* Search + avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {user?.role !== "ORGANIZER" && user?.role !== "admin" && (
            <div className="relative hidden lg:block" ref={searchRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`);
                  setIsSearchOpen(false);
                }}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder={t("navbar.searchPlaceholder")}
                  className="w-72 pl-9 pr-4 py-1.5 rounded-lg border border-wc-border bg-wc-bg text-xs text-wc-gray placeholder-wc-gray outline-none focus:ring-2 focus:ring-wc-green/20"
                />
              </form>

              <SearchPopup
                searchQuery={searchQuery}
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
              />
            </div>
          )}
          <div className="border-l border-wc-border pl-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-wc-green/10 bg-wc-slate hover:opacity-80 transition-opacity cursor-pointer">
                  <img
                    src={user?.avatar_url 
                      ? (user.avatar_url.startsWith("/") ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : user.avatar_url)
                      : "https://api.builder.io/api/v1/image/assets/TEMP/970853f39e1b18632ca69640ab7ac67726e7dc95?width=72"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  {t("navbar.viewProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-red-500 focus:text-red-500 focus:bg-red-50"
                >
                  {t("navbar.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Hamburger button on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-wc-gray hover:text-wc-green hover:bg-wc-light transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-wc-border bg-white px-4 py-4 flex flex-col gap-2 shadow-inner">
          {displayLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(href);
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${active
                    ? "text-wc-green bg-[#F1F5F0]"
                    : "text-wc-gray hover:text-wc-green hover:bg-wc-bg"
                  }`}
              >
                <span className={active ? "text-wc-green" : "text-wc-gray"}>
                  <Icon />
                </span>
                {t(label)}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
