import { useLanguage } from "../contexts/LanguageContext"
import LanguageSelector from "../components/LanguageSelector"

export function CatalogPage() {
  const { t } = useLanguage()

  const handleDownloadPDF = () => {
    // PDF indirme işlemi - gerçek PDF URL'i buraya eklenecek
    const pdfUrl = "/Ais_Temizlik_Katalog_2024.pdf" // Örnek URL
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = "Ais_Temizlik_Katalog_2024.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-[#153A60]">
      {/* Header with buttons */}
      <div className="sticky top-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Back to Home Button - Left */}
          <button
            onClick={handleGoHome}
            className="glassmorphism-button glassmorphism-button-md glassmorphism-button-on-blue flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t('catalog.backToHome')}
          </button>

          {/* Language Selector and Download PDF Button - Right */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={handleDownloadPDF}
              className="glassmorphism-button glassmorphism-button-md glassmorphism-button-on-blue flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t('catalog.downloadPDF')}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* E-Catalog Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-12 font-heading">
          {t('catalog.title')}
        </h1>
      </div>
    </div>
  )
}

