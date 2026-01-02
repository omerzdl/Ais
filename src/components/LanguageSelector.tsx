import React, { useState, useEffect, useRef } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'tr', label: 'TR' },
    { code: 'ru', label: 'RU' },
    { code: 'sr', label: 'SR' },
    { code: 'hr', label: 'HR' },
    { code: 'ro', label: 'RO' }
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1 rounded-full bg-white/30 backdrop-blur-md border border-[#8FA895]/20 text-[#153A60] text-sm font-bold hover:bg-white/40 transition-colors px-3 py-1.5 shadow-lg ${
          isOpen ? 'rounded-b-none' : ''
        }`}
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        <span>{currentLang.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-0 bg-white rounded-b-2xl shadow-xl border border-[#8FA895]/30 border-t-0 z-50 min-w-[120px]"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-none last:rounded-b-2xl ${
                language === lang.code
                  ? 'bg-[#FF8C00] text-white font-bold'
                  : 'text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#FF8C00]'
              }`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

