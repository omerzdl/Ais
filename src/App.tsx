import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LanguageProvider } from "./contexts/LanguageContext"
import { Testimonial } from "@/components/ui/design-testimonial"
import { PackagingDropdown } from "@/components/ui/packaging-dropdown"
import { ContactForm } from "@/components/ui/contact-form"

// Helper function to detect base path (matches logic in index.html)
function getBasePath(): string {
  // In dev mode (localhost with port 4182), always use empty base path
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port === '4182' || window.location.port === '') {
      return ''
    }
  }
  // Check if we're on GitHub Pages
  if (window.location.hostname === 'omerzdl.github.io') {
    return '/Ais'
  }
  // Check if path starts with /Ais (but not in dev mode)
  if (window.location.pathname.startsWith('/Ais')) {
    return '/Ais'
  }
  // Check if Vite's script tag has /Ais in the path (production build with base path)
  const viteScript = document.querySelector('script[src*="/assets/"]')
  if (viteScript && viteScript.getAttribute('src')?.includes('/Ais/')) {
    return '/Ais'
  }
  return ''
}

function HomePage() {
  const [selectedPackaging, setSelectedPackaging] = useState<string>()

  const packagingOptions = [
    { id: "1", label: "Standard Packaging" },
    { id: "2", label: "Premium Packaging" },
    { id: "3", label: "Custom Packaging" },
    { id: "4", label: "Bulk Packaging" },
  ]

  return (
    <main className="min-h-screen bg-[#f5f4d0] py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Packaging Dropdown Demo */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-[#1A2F25] font-heading">
            Packaging Dropdown
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <p className="text-sm text-[#1A2F25]/70">Multiple Options:</p>
              <PackagingDropdown
                options={packagingOptions}
                selectedId={selectedPackaging}
                onSelect={setSelectedPackaging}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#1A2F25]/70">Single Option (Badge):</p>
              <PackagingDropdown
                options={[{ id: "1", label: "Single Packaging Option" }]}
              />
            </div>
          </div>
        </section>

        {/* Contact Form Demo */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-[#1A2F25] font-heading">
            Contact Form
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <ContactForm
              onSubmit={(data) => {
                console.log("Form submitted:", data)
                alert("Form submitted successfully!")
              }}
            />
          </div>
        </section>

        {/* Original Testimonial (optional) */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-[#1A2F25] font-heading">
            Testimonial (Original)
          </h2>
          <div className="bg-background rounded-2xl p-8">
            <Testimonial />
          </div>
        </section>
      </div>
    </main>
  )
}

export default function App() {
  const basePath = getBasePath()
  
  return (
    <LanguageProvider>
      <BrowserRouter basename={basePath}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

