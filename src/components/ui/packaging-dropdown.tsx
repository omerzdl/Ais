"use client"

import { useState, useRef, useEffect } from "react"

interface PackagingOption {
  id: string
  label: string
}

interface PackagingDropdownProps {
  options: PackagingOption[]
  selectedId?: string
  placeholder?: string
  onSelect?: (id: string) => void
}

export function PackagingDropdown({
  options,
  selectedId,
  placeholder = "Select Packaging",
  onSelect,
}: PackagingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | null>(null)

  const selectedOption = options.find((opt) => opt.id === selectedId)

  // Tek seçenek durumu - badge göster
  if (options.length === 1) {
    return (
      <div className="w-full sm:min-w-[180px] sm:max-w-[260px]">
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-medium break-words bg-transparent text-[#1A2F25] border border-[#8FA895] text-center">
          {options[0].label}
        </div>
      </div>
    )
  }

  // Mouse enter/leave ile açılma/kapanma (sadece desktop)
  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) { // Sadece desktop
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) { // Sadece desktop
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 150)
    }
  }

  // Click ile toggle
  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  // Seçim yapıldığında
  const handleSelect = (id: string) => {
    onSelect?.(id)
    setIsOpen(false)
  }

  // Dışarı tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full sm:min-w-[180px] sm:max-w-[260px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ana Buton */}
      <button
        type="button"
        onClick={handleClick}
        className={`
          w-full rounded-full px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs md:text-sm font-medium transition-all
          flex items-center justify-between break-words
          ${
            isOpen
              ? "bg-[#a84833] text-white shadow-lg rounded-b-none"
              : "bg-transparent text-[#1A2F25] border border-[#8FA895] hover:bg-white active:bg-white"
          }
        `}
      >
        <span className="flex-1 text-left truncate">{selectedOption?.label || placeholder}</span>
        <svg
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ml-2 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menü */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto w-full bg-white border border-[#8FA895] border-t-0 rounded-b-2xl shadow-xl z-50 max-h-[200px] sm:max-h-60 overflow-y-auto overscroll-contain">
          <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`
                  w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm transition-all
                  touch-manipulation
                  ${
                    selectedId === option.id
                      ? "bg-[#a84833] text-white"
                      : "text-[#1A2F25]/70 hover:bg-[#f5f4d0] active:bg-[#f5f4d0] hover:text-[#1A2F25]"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

