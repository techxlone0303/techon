import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'AI Coach', path: '/coach' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Contact', path: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container-width">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded border border-foreground flex items-center justify-center bg-foreground/5">
              <span className="text-foreground font-bold text-sm tracking-tight">GX</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              GAMEX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link text-sm font-medium uppercase tracking-wider transition-colors pb-1 ${
                  location.pathname === link.path
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Direct AI Coach Hub CTA (No Auth Barrier) */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/coach"
              className="btn-primary text-xs py-2.5 px-4 uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Launch AI Coach Hub
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <div className="container-width py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                  location.pathname === link.path
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-border">
              <Link
                to="/coach"
                onClick={() => setIsOpen(false)}
                className="btn-primary text-xs py-2.5 w-full text-center uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Launch AI Coach Hub
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
