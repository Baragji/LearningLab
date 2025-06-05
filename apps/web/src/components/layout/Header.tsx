// apps/web/src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

// Tilføj CSS-klasser for animationer
const ANIMATION_CLASSES = {
  fadeIn: "animate-fadeIn",
  fadeOut: "animate-fadeOut",
  scaleIn: "animate-scaleIn",
  scaleOut: "animate-scaleOut",
  slideDown: "animate-slideDown",
  slideUp: "animate-slideUp",
  rotate: "animate-rotate",
  hover: "hover:scale-110 active:scale-90 transition-transform duration-200",
};

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll event to change header appearance and track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled for glassmorphism effect
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }

      // Calculate scroll progress for potential progress indicator
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Enhanced header classes with improved glassmorphism effect
  const headerClasses = `
    sticky top-0 left-0 right-0 z-50 
    transition-all duration-300 ease-in-out
    ${
      scrolled
        ? "backdrop-blur-md backdrop-saturate-150 bg-white/60 dark:bg-gray-800/60 shadow-lg border-b border-gray-200/30 dark:border-gray-700/30"
        : "bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200/10 dark:border-gray-700/10"
    }
  `;

  return (
    <>
      <header className={headerClasses}>
        {/* Enhanced scroll progress indicator */}
        <div
          className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 absolute top-0 left-0 transition-all duration-200 ease-out shadow-sm"
          style={{
            width: `${scrollProgress * 100}%`,
            opacity: scrolled ? 1 : 0.8,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center group">
                  {/* Logo with enhanced animation */}
                  <div
                    className={`h-8 w-8 mr-2 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-md flex items-center justify-center shadow-sm ${ANIMATION_CLASSES.hover}`}
                  >
                    <span className="text-white font-bold">LL</span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-semibold text-lg opacity-0 animate-fadeInSlideRight">
                    LearningLab
                  </span>
                </Link>
              </div>

              {/* Desktop navigation */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/courses", label: "Kurser" },
                  { href: "/profile", label: "Min Profil" },
                ].map((item, i) => (
                  <div
                    key={item.href}
                    className={`opacity-0 animate-fadeInDown`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Link
                      href={item.href}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 hover:backdrop-blur-sm transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right side controls */}
            <div className="flex items-center">
              {/* Theme toggle with animation */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors ${ANIMATION_CLASSES.hover}`}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? (
                  <svg
                    className="h-5 w-5 animate-rotateIn"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 animate-rotateIn"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* User menu */}
              <div className="ml-4 relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${ANIMATION_CLASSES.hover}`}
                  id="user-menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Åbn brugermenu</span>
                  {user ? (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white animate-scaleIn">
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center animate-scaleIn">
                      <svg
                        className="h-5 w-5 text-gray-500 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>

                {/* User dropdown menu with enhanced glassmorphism effect */}
                {userMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/70 dark:bg-gray-700/70 backdrop-blur-md backdrop-saturate-150 border border-gray-200/30 dark:border-gray-700/30 focus:outline-none animate-menuAppear"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200/30 dark:border-gray-600/30">
                          <p className="font-medium">{user.name || "Bruger"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/60 hover:backdrop-blur-sm transition-all duration-200"
                        >
                          Min Profil
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/60 hover:backdrop-blur-sm transition-all duration-200"
                        >
                          Indstillinger
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/60 hover:backdrop-blur-sm transition-all duration-200"
                        >
                          Log ud
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/60 hover:backdrop-blur-sm transition-all duration-200"
                        >
                          Log ind
                        </Link>
                        <Link
                          href="/signup"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-600/60 hover:backdrop-blur-sm transition-all duration-200"
                        >
                          Opret konto
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu button with animation */}
              <div className="ml-4 md:hidden flex items-center">
                <button
                  onClick={toggleMobileMenu}
                  className={`p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors ${ANIMATION_CLASSES.hover}`}
                  aria-label={
                    mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
                  }
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu with enhanced glassmorphism effect */}
        {mobileMenuOpen && (
          <div className="md:hidden overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-md backdrop-saturate-150 border-t border-gray-200/30 dark:border-gray-700/30 shadow-lg animate-slideDown">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/courses", label: "Kurser" },
                { href: "/profile", label: "Min Profil" },
              ].map((item, i) => (
                <div
                  key={item.href}
                  className="animate-fadeInDown"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Link
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 hover:backdrop-blur-sm transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
