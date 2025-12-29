import { useState, useRef, useEffect } from 'react';

const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Seçiniz',
  className = '' 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop value
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Tek seçenek durumu
  if (options.length === 1) {
    return (
      <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full bg-transparent border border-[#8FA895] text-[#1A2F25] text-xs md:text-sm font-medium ${className}`}>
        {options[0].label}
      </div>
    );
  }

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2
          min-w-[180px] max-w-[260px]
          px-4 py-3
          text-xs md:text-sm font-medium
          rounded-full
          transition-all duration-300
          ${isOpen 
            ? 'bg-[#a84833] text-white shadow-lg rounded-b-none' 
            : 'bg-transparent text-[#1A2F25] border border-[#8FA895] hover:bg-white'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown 
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-0 w-full min-w-[180px] max-w-[260px] bg-white border border-t-0 border-[#8FA895] rounded-b-2xl shadow-xl z-50 max-h-[240px] overflow-y-auto"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                w-full text-left px-3 py-2 rounded-full
                transition-colors duration-200
                ${selectedValue === option.value
                  ? 'bg-[#a84833] text-white'
                  : 'text-[#1A2F25]/70 hover:bg-white hover:text-[#1A2F25]'
                }
              `}
              role="option"
              aria-selected={selectedValue === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

