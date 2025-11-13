import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Header: React.FC<{ onGetStarted: () => void; }> = ({ onGetStarted }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
  ];
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (!href) return;
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };


  const handleMobileLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    handleNavClick(e);
    setIsMenuOpen(false);
  };
  
  const handleMobileGetStarted = () => {
    onGetStarted();
    setIsMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMenuOpen ? 'bg-dark/80 backdrop-blur-lg border-b border-slate-800' : 'bg-transparent'}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 text-xl font-bold text-white">
            <LogoIcon className="text-primary" />
            InterviewAI
          </a>
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={handleNavClick} className="text-gray-300 hover:text-primary transition-colors duration-300">
                {link.name}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
                <button onClick={signOut} className="bg-slate-700 text-white font-semibold px-5 py-2 rounded-lg hover:bg-slate-600 transition-colors duration-300">
                    Logout
                </button>
            ) : (
                <button onClick={onGetStarted} className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-300">
                    Get Started
                </button>
            )}
          </div>
          <button className="md:hidden text-white z-50" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
             {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
             )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
        <div className="bg-dark/95 backdrop-blur-lg">
            <nav className="container mx-auto px-6 flex flex-col items-center space-y-6 py-8">
                {navLinks.map((link) => (
                  <a key={link.name} href={link.href} onClick={handleMobileLinkClick} className="text-xl text-gray-300 hover:text-primary transition-colors duration-300">
                    {link.name}
                  </a>
                ))}
                <div className="border-t border-slate-700 w-full max-w-xs my-4"></div>
                {user ? (
                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-full max-w-xs bg-slate-700 text-white font-semibold px-8 py-3 rounded-lg hover:bg-slate-600 transition-colors duration-300 text-lg">
                        Logout
                    </button>
                ) : (
                    <button onClick={handleMobileGetStarted} className="w-full max-w-xs bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-500 transition-colors duration-300 text-lg">
                        Get Started
                    </button>
                )}
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;