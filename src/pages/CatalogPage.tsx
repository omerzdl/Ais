import { useEffect, useRef, useState, useCallback } from "react"
import { useLanguage } from "../contexts/LanguageContext"
// @ts-ignore - page-flip doesn't have type definitions
import { PageFlip } from "page-flip"

// PDF.js types
declare global {
  interface Window {
    pdfjsLib: any
  }
}

// Constants
const PAGE_WIDTH = 630 // Desktop spread width
const MOBILE_PAGE_WIDTH = 324 // Mobile max page width
const RESIZE_DEBOUNCE_MS = 250

export function CatalogPage() {
  const { t } = useLanguage()
  const bookRef = useRef<HTMLDivElement>(null)
  const pageFlipRef = useRef<PageFlip | null>(null)
  const pdfLoadedRef = useRef(false) // prevent double load in React strict mode
  
  // ==========================================
  // DEFENSIVE: Double-Mount Protection Lock
  // ==========================================
  const mountLockRef = useRef<boolean>(false) // Primary lock for init protection
  const cleanupCompletedRef = useRef<boolean>(true)
  const destroyInProgressRef = useRef<boolean>(false)
  
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pageAspectRatios, setPageAspectRatios] = useState<number[]>([])
  const pageTurnSoundRef = useRef<HTMLAudioElement | null>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pdfAspectRatioRef = useRef<number>(0)
  const initInProgressRef = useRef(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 850)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Lock body scroll on catalog page to avoid extra scrollbars
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Load PDF.js
  useEffect(() => {
    const loadPDFJS = async () => {
      if (window.pdfjsLib) {
        // Set worker if not already set
        if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        }
        return Promise.resolve()
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        script.async = true
        
        script.onload = () => {
          // Set worker source
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          console.log("PDF.js loaded successfully")
          resolve()
        }
        
        script.onerror = () => {
          console.error("Failed to load PDF.js")
          reject(new Error("Failed to load PDF.js"))
        }
        
        document.head.appendChild(script)
      })
    }

    loadPDFJS().catch((error) => {
      console.error("Error loading PDF.js:", error)
      setIsLoading(false)
    })
  }, [])

  // Load page turn sound
  useEffect(() => {
    try {
      pageTurnSoundRef.current = new Audio("/page-turn-sound-effect.wav")
      pageTurnSoundRef.current.volume = 0.4
      pageTurnSoundRef.current.preload = "auto"
      // Handle errors silently
      pageTurnSoundRef.current.onerror = () => {
        pageTurnSoundRef.current = null
      }
    } catch (error) {
      // Sound file not available, continue without sound
      pageTurnSoundRef.current = null
    }
  }, [])

  // Load and render PDF
  useEffect(() => {
    const loadPDF = async () => {
      // DEFENSIVE: Prevent double PDF load in Strict Mode
      if (pdfLoadedRef.current) {
        console.log("📄 PDF already loaded, skipping...")
        return
      }
      
      // Acquire PDF load lock immediately
      pdfLoadedRef.current = true

      // Wait for PDF.js to load with timeout
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max wait
      
      while (!window.pdfjsLib && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!window.pdfjsLib) {
        console.error("PDF.js failed to load after timeout")
        setIsLoading(false)
        pdfLoadedRef.current = false // Release lock on error
        return
      }

      try {
        // Add cache-busting parameter to ensure latest PDF is loaded
        const timestamp = new Date().getTime();
        const pdfUrl = `/Ais_Catalog.pdf?v=${timestamp}`;
        console.log("📄 Loading PDF:", pdfUrl)
        const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        console.log(`✅ PDF loaded successfully. Total pages: ${pdf.numPages}`)
        setTotalPages(pdf.numPages)

        // Render all pages to canvas and calculate aspect ratios
        const images: string[] = []
        const aspectRatios: number[] = []
        
        for (let i = 1; i <= pdf.numPages; i++) {
          console.log(`Rendering page ${i}/${pdf.numPages}`)
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2.0 })
          
          // Calculate aspect ratio for this page
          const aspectRatio = viewport.width / viewport.height
          aspectRatios.push(aspectRatio)
          
          // Store first page aspect ratio for desktop sizing
          if (i === 1) {
            pdfAspectRatioRef.current = aspectRatio
          }
          
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          if (!context) {
            throw new Error("Failed to get canvas context")
          }
          
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise

          images.push(canvas.toDataURL("image/png"))
        }

        console.log(`✅ All ${images.length} pages rendered successfully`)
        setPageImages(images)
        setPageAspectRatios(aspectRatios)
        setIsLoading(false)
        // pdfLoadedRef.current already set to true at the beginning
      } catch (error) {
        console.error("❌ Error loading PDF:", error)
        setIsLoading(false)
        pdfLoadedRef.current = false // Release lock on error
      }
    }

    loadPDF()
  }, [])

  // Update book position for clip-path (Desktop only)
  const updateBookPosition = useCallback((_index: number = currentPage) => {
    if (isMobile || !bookRef.current) {
      // Mobilde hiçbir şey yapma
      const bookEl = bookRef.current
      if (bookEl) {
        bookEl.style.transform = "none"
        bookEl.style.clipPath = "none"
      }
      return
    }

    const bookEl = bookRef.current
    if (!bookEl) return

    const numVisiblePages = pageImages.length
    if (numVisiblePages === 0) return

    // DISABLE CLIPPING - Let PageFlip handle everything naturally
    // This prevents pages from disappearing during transitions
    bookEl.style.transform = "none"
    bookEl.style.clipPath = "none"
    
    // PageFlip library handles cover pages and spread views automatically
    // No manual manipulation needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pageImages.length])

  // Play page turn sound (Desktop only)
  const playPageTurnSound = useCallback(() => {
    // Mobilde ses efekti çalınmamalı
    if (isMobile) return
    
    if (pageTurnSoundRef.current) {
      try {
        pageTurnSoundRef.current.currentTime = 0
        pageTurnSoundRef.current.play().catch(() => {
          // Autoplay policy - ignore errors
        })
      } catch (error) {
        // Ignore sound errors
      }
    }
  }, [isMobile])

  // ==========================================
  // BRUTE-FORCE: Agresif DOM & Instance Cleanup
  // ==========================================
  const aggressiveCleanup = useCallback(() => {
    console.log("🧹 AGGRESSIVE CLEANUP: Starting...")
    
    // STEP 1: Destroy PageFlip Instance (with safety checks)
    if (pageFlipRef.current && !destroyInProgressRef.current) {
      destroyInProgressRef.current = true
      try {
        console.log("🧹 Destroying PageFlip instance...")
        pageFlipRef.current.destroy()
      } catch (error) {
        console.warn("⚠️ PageFlip destroy error (non-critical):", error)
      }
    }
    
    // STEP 2: REF SYNCHRONIZATION - Garantili null assignment
    pageFlipRef.current = null
    destroyInProgressRef.current = false
    
    // STEP 2.5: GLOBAL CLEANUP - Remove ALL PageFlip containers from entire document
    console.log("🧹 Global PageFlip cleanup...")
    const globalPageFlipContainers = document.querySelectorAll('.stf__wrapper, .stf__parent, [class*="stf"]')
    if (globalPageFlipContainers.length > 0) {
      console.log(`🗑️ Removing ${globalPageFlipContainers.length} global PageFlip containers`)
      globalPageFlipContainers.forEach(el => {
        try {
          el.remove()
        } catch (e) {
          console.warn("Failed to remove element:", e)
        }
      })
    }
    
    // STEP 3: DOM SANITIZATION - Nuclear cleanup
    if (bookRef.current) {
      console.log("🧹 DOM Sanitization: Nuclear cleanup starting...")
      
      // First, remove any PageFlip wrappers that might be OUTSIDE bookRef
      const parent = bookRef.current.parentElement
      if (parent) {
        console.log("🔍 Checking parent for PageFlip wrappers...")
        const siblingWrappers = parent.querySelectorAll('.stf__wrapper, .stf__parent, [class*="stf"]')
        if (siblingWrappers.length > 0) {
          console.log(`🗑️ Removing ${siblingWrappers.length} sibling PageFlip wrappers`)
          siblingWrappers.forEach(el => {
            if (el !== bookRef.current) {
              el.remove()
            }
          })
        }
      }
      
      // Remove ALL child nodes from bookRef
      while (bookRef.current.firstChild) {
        bookRef.current.removeChild(bookRef.current.firstChild)
      }
      
      // Remove any lingering attributes from PageFlip
      const attributes = bookRef.current.attributes
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attr = attributes[i]
        if (attr.name !== 'id' && attr.name !== 'class' && attr.name !== 'style') {
          bookRef.current.removeAttribute(attr.name)
        }
      }
      
      console.log("✅ DOM nuclear cleanup complete")
    }
    
    // STEP 4: Query selector cleanup - remove ALL page-flip related elements globally
    const orphanedSelectors = [
      '[class*="page-flip"]',
      '[class*="stf"]', // PageFlip's own classes
      '.page',
      '.page-content',
      '.page-wrapper'
    ]
    
    orphanedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        console.log(`🧹 Removing ${elements.length} orphaned elements: ${selector}`)
        elements.forEach(el => {
          // Only remove if not inside bookRef (we already cleaned that)
          if (bookRef.current && !bookRef.current.contains(el)) {
            el.remove()
          }
        })
      }
    })
    
    cleanupCompletedRef.current = true
    console.log("✅ AGGRESSIVE CLEANUP: Complete")
  }, [])

  // Initialize PageFlip for Desktop
  const initFlip = useCallback(() => {
    console.log("🔍 initFlip called", {
      mountLock: mountLockRef.current,
      hasBookRef: !!bookRef.current,
      pageImagesCount: pageImages.length,
      isMobile
    })

    // DOUBLE-MOUNT PROTECTION: Only check mountLockRef (not initInProgressRef)
    // because initInProgressRef is managed by useEffect
    if (mountLockRef.current) {
      console.log("🔒 MOUNT LOCK: Init already in progress, blocking duplicate")
      return
    }
    
    if (!bookRef.current || pageImages.length === 0 || isMobile) {
      console.log("⏭️ initFlip: Skipping", { 
        hasBookRef: !!bookRef.current, 
        pageImagesCount: pageImages.length, 
        isMobile 
      })
      // Release useEffect lock if we're skipping
      initInProgressRef.current = false
      return
    }

    // Acquire mount lock for initFlip
    console.log("🔐 Acquiring mount lock...")
    mountLockRef.current = true
    cleanupCompletedRef.current = false

    console.log("🚀 initFlip: Starting initialization with DEFENSIVE protection")

    // STEP 1: Aggressive cleanup before init (synchronous)
    aggressiveCleanup()
    
    // STEP 2: Check bookRef after cleanup
    if (!bookRef.current) {
      console.warn("⚠️ bookRef lost during cleanup")
      mountLockRef.current = false
      initInProgressRef.current = false
      return
    }

    // STEP 3: Calculate dimensions - optimize for proper fit
    const aspectRatio = pdfAspectRatioRef.current || (pageAspectRatios[0] || 1.414)
    const maxHeight = window.innerHeight * 0.75 // tighter fit to avoid scroll
    const maxWidth = window.innerWidth * 0.78 // balanced fit
    
    // Start with width-based calculation for better initial fit
    let width = maxWidth
    let height = width / aspectRatio

    // If height exceeds max, recalculate based on height
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    // Ensure minimum dimensions but don't exceed maximums
    const finalWidth = Math.min(Math.max(width, PAGE_WIDTH), maxWidth)
    const finalHeight = Math.min(Math.max(height, 400), maxHeight)

    // STEP 4: DOM SANITIZATION - Final clear before rebuild
    bookRef.current.innerHTML = ""

    // STEP 5: Create pages - PageFlip will handle them automatically
    const pages: HTMLElement[] = []
    pageImages.forEach((imageSrc, index) => {
      const page = document.createElement("div")
      page.className = "page"
      page.setAttribute(
        "data-density",
        index === 0 || index === pageImages.length - 1 ? "hard" : "soft"
      )
      // Remove borders and shadows - ensure visibility
      page.style.border = "none"
      page.style.boxShadow = "none"
      page.style.background = "#fdfbf7"
      page.style.overflow = "hidden"
      page.style.display = "block"
      page.style.visibility = "visible"

      const pageContent = document.createElement("div")
      pageContent.className = "page-content"
      pageContent.style.width = "100%"
      pageContent.style.height = "100%"
      pageContent.style.display = "flex"
      pageContent.style.alignItems = "center"
      pageContent.style.justifyContent = "center"
      pageContent.style.overflow = "hidden"
      pageContent.style.padding = "0"
      
      const pageImg = document.createElement("img")
      pageImg.src = imageSrc
      pageImg.alt = `Page ${index + 1}`
      pageImg.style.width = "100%"
      pageImg.style.height = "100%"
      pageImg.style.objectFit = "contain"
      pageImg.style.display = "block"
      pageImg.style.visibility = "visible"
      pageImg.style.opacity = "1"
      pageImg.style.pointerEvents = "auto"
      
      // Ensure image loads before adding to page
      pageImg.onload = () => {
        // Image loaded successfully - ensure it stays visible
        console.log(`✓ Page ${index + 1} image loaded`)
      }
      pageImg.onerror = () => {
        console.error(`❌ Failed to load page ${index + 1} image`)
      }
      
      pageContent.appendChild(pageImg)
      page.appendChild(pageContent)

      bookRef.current!.appendChild(page)
      pages.push(page)
    })
    
    console.log(`📄 Created ${pages.length} page elements (${finalWidth}x${finalHeight})`)

    // STEP 6: Initialize PageFlip with calculated dimensions
    console.log(`🎨 Initializing PageFlip...`)
    
    try {
        const pageFlip = new PageFlip(bookRef.current, {
          width: finalWidth,
          height: finalHeight,
          maxShadowOpacity: 0.1, // Subtle shadow for depth
          showCover: true,
          drawShadow: true,
          flippingTime: 800,
          usePortrait: true,
          startPage: 0, // Always start from first page to avoid display issues
          size: "fixed", // Changed from "stretch" to "fixed" for consistent display
          minWidth: finalWidth,
          maxWidth: finalWidth,
          minHeight: finalHeight,
          maxHeight: finalHeight,
          disableFlipByClick: false,
          mobileScrollSupport: false,
        })

      pageFlip.on("flip", (e: any) => {
        const newPage = e.data
        setCurrentPage(newPage)
        updateBookPosition(newPage)
        playPageTurnSound()
      })

      // STEP 7: Load pages from HTML elements
      console.log(`📚 Loading ${pages.length} pages into PageFlip...`)
      pageFlip.loadFromHTML(pages)
      
      // REF SYNCHRONIZATION: Assign after successful load
      pageFlipRef.current = pageFlip
      
      console.log("✅ PageFlip initialized successfully")

      // Update book position for initial page
      updateBookPosition(0)
      
      // Force a redraw to ensure PageFlip renders properly
      if (pageFlip && typeof pageFlip.update === 'function') {
        pageFlip.update()
        console.log("🎨 PageFlip update() called")
      }
      
      // If we need to start from a different page, flip to it after initialization
      if (currentPage > 0 && currentPage < pageImages.length) {
        pageFlip.turnToPage(currentPage)
      }
      
      // RELEASE ALL LOCKS after successful initialization
      mountLockRef.current = false
      initInProgressRef.current = false
      console.log("🔓 ALL LOCKS: Released")
      
    } catch (error) {
      console.error("❌ Error initializing PageFlip:", error)
      // Release all locks on error
      mountLockRef.current = false
      initInProgressRef.current = false
      aggressiveCleanup()
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pageImages, pageAspectRatios])

  // Initialize Mobile Slider
  const initMobileSlider = useCallback(() => {
    if (!bookRef.current || pageImages.length === 0 || !isMobile) return

    bookRef.current.innerHTML = ""
    
    // Create container
    const container = document.createElement("div")
    container.className = "mobile-slider-container"
    container.style.position = "relative"
    container.style.width = "100%"
    container.style.overflow = "visible"
    container.style.display = "flex"
    container.style.justifyContent = "center"
    container.style.alignItems = "flex-start"

    // Create pages with absolute positioning
    pageImages.forEach((imageSrc, index) => {
      const pageWrapper = document.createElement("div")
      pageWrapper.className = "mobile-page-wrapper"
      pageWrapper.style.position = "absolute"
      pageWrapper.style.top = "0"
      pageWrapper.style.left = "50%"
      pageWrapper.style.transform = "translateX(-50%)"
      pageWrapper.style.width = "90vw"
      pageWrapper.style.maxWidth = `${MOBILE_PAGE_WIDTH}px`
      pageWrapper.style.display = index === currentPage ? "flex" : "none"
      pageWrapper.style.flexDirection = "column"
      pageWrapper.style.alignItems = "center"
      pageWrapper.style.justifyContent = "center"
      pageWrapper.style.zIndex = index === currentPage ? "10" : "1"

      const aspectRatio = pageAspectRatios[index] || 1.414
      const pageWidth = Math.min(window.innerWidth * 0.9, MOBILE_PAGE_WIDTH)
      const calculatedHeight = pageWidth / aspectRatio
      const maxHeight = window.innerHeight * 0.75
      const finalHeight = Math.min(calculatedHeight, maxHeight)
      const finalWidth = finalHeight * aspectRatio

      pageWrapper.style.width = `${finalWidth}px`
      pageWrapper.style.height = `${finalHeight}px`

      const img = document.createElement("img")
      img.src = imageSrc
      img.style.width = "100%"
      img.style.height = "100%"
      img.style.objectFit = "contain"
      img.style.display = "block"
      img.style.pointerEvents = "none"
      img.style.userSelect = "none"

      pageWrapper.appendChild(img)
      container.appendChild(pageWrapper)
    })

    // Set container height based on current page
    const currentPageWrapper = container.children[currentPage] as HTMLElement
    if (currentPageWrapper) {
      container.style.height = `${currentPageWrapper.offsetHeight}px`
    }

    bookRef.current.appendChild(container)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pageImages, pageAspectRatios])

  // Initialize PageFlip (Desktop) or Mobile Slider
  useEffect(() => {
    console.log("📍 useEffect [MOUNT]: Entry point", {
      isLoading,
      hasBookRef: !!bookRef.current,
      pageImagesCount: pageImages.length,
      aspectRatiosCount: pageAspectRatios.length,
      mountLock: mountLockRef.current,
      initInProgress: initInProgressRef.current,
      hasPageFlip: !!pageFlipRef.current
    })

    if (isLoading || !bookRef.current || pageImages.length === 0 || pageAspectRatios.length === 0) {
      console.log("Waiting for PDF to load...", {
        isLoading,
        hasBookRef: !!bookRef.current,
        pageImagesCount: pageImages.length,
        aspectRatiosCount: pageAspectRatios.length
      })
      return
    }

    // CRITICAL: Check if already initialized or in progress
    if (mountLockRef.current || initInProgressRef.current) {
      console.log("🔒 useEffect: Already initialized or in progress, skipping")
      return
    }

    // DEFENSIVE: Clean up any previous instance before initializing
    console.log("🧹 Pre-mount cleanup check...")
    if (pageFlipRef.current) {
      console.log("⚠️ Found existing PageFlip instance, cleaning up...")
      aggressiveCleanup()
    }

    console.log("🚀 Initializing viewer...", { isMobile, pageCount: pageImages.length })

    // Immediately acquire lock to prevent double initialization
    initInProgressRef.current = true

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!isMobile) {
        // Desktop: Initialize PageFlip with defensive protection
        console.log("🖥️ Initializing PageFlip for desktop")
        initFlip()
      } else {
        // Mobile: Simple slider
        console.log("📱 Initializing mobile slider")
        initMobileSlider()
        // Release lock for mobile
        initInProgressRef.current = false
      }
    }, 100)

    // ==========================================
    // CLEANUP: Profesyonel ve Agresif Temizlik
    // ==========================================
    return () => {
      console.log("🧹 useEffect CLEANUP [UNMOUNT]: Starting...")
      
      console.log("⏹️ Clearing timer...")
      clearTimeout(timer)
      
      // BRUTE-FORCE: Call aggressive cleanup
      console.log("🗑️ Calling aggressive cleanup...")
      aggressiveCleanup()
      
      // Reset all state flags
      console.log("🔓 Releasing all locks...")
      initInProgressRef.current = false
      mountLockRef.current = false
      
      console.log("✅ useEffect CLEANUP [UNMOUNT]: Complete")
    }
    // Remove initFlip and initMobileSlider from dependencies to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isMobile, pageImages.length, pageAspectRatios.length])

  // Navigation handlers
  const goToPrevPage = () => {
    if (isMobile) {
      if (currentPage > 0) {
        const newPage = currentPage - 1
        setCurrentPage(newPage)
        showMobilePage(newPage)
        // Mobilde ses efekti çalınmamalı
      }
    } else {
      if (pageFlipRef.current) {
        pageFlipRef.current.flipPrev()
      }
    }
  }

  const goToNextPage = () => {
    if (isMobile) {
      if (currentPage < totalPages - 1) {
        const newPage = currentPage + 1
        setCurrentPage(newPage)
        showMobilePage(newPage)
        // Mobilde ses efekti çalınmamalı
      }
    } else {
      if (pageFlipRef.current) {
        pageFlipRef.current.flipNext()
      }
    }
  }

  // Show specific mobile page (animasyon yok, anında geçiş)
  const showMobilePage = (pageIndex: number) => {
    if (!bookRef.current || !isMobile) return
    const container = bookRef.current.querySelector(".mobile-slider-container") as HTMLElement
    if (!container) return
    
    const wrappers = container.querySelectorAll(".mobile-page-wrapper")
    
    // Eski sayfayı anında gizle
    wrappers.forEach((wrapper, index) => {
      const element = wrapper as HTMLElement
      if (index === pageIndex) {
        // Yeni sayfayı anında göster
        element.style.display = "flex"
        element.style.zIndex = "10"
        element.classList.add("active")
        
        // Container yüksekliğini güncelle
        container.style.height = `${element.offsetHeight}px`
      } else {
        // Diğer sayfaları anında gizle
        element.style.display = "none"
        element.style.zIndex = "1"
        element.classList.remove("active")
      }
    })
  }

  // Update mobile page display when currentPage changes
  useEffect(() => {
    if (isMobile && pageImages.length > 0) {
      showMobilePage(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isMobile, pageImages.length])

  // Touch handlers for mobile swipe (iyileştirilmiş)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = touchStartX.current
    touchEndY.current = touchStartY.current
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = Math.abs(currentX - touchStartX.current)
    const diffY = Math.abs(currentY - touchStartY.current)
    
    // Yatay kaydırma > dikey kaydırma ise scroll'u engelle
    if (diffX > diffY && diffX > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return
    touchEndX.current = e.changedTouches[0].clientX
    touchEndY.current = e.changedTouches[0].clientY
    handleSwipe()
  }

  const handleSwipe = () => {
    if (!isMobile) return
    const swipeThreshold = 50
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchStartY.current - touchEndY.current)

    // Yatay kaydırma dikey kaydırmadan daha fazla olmalı
    if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        // Swipe left - next page
        goToNextPage()
      } else {
        // Swipe right - previous page
        goToPrevPage()
      }
    }
  }

  // Handle window resize (debounced) - with defensive protection
  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const newIsMobile = window.innerWidth < 850
        
        // Eğer mobil/desktop geçişi varsa, sistemi agresif cleanup ile yeniden başlat
        if (newIsMobile !== isMobile) {
          console.log("📱 Mobile/Desktop transition detected, cleaning up...")
          
          // Aggressive cleanup before mode switch
          aggressiveCleanup()
          
          // Reset flags
          mountLockRef.current = false
          initInProgressRef.current = false
          
          setIsMobile(newIsMobile)
          // useEffect will handle reinitialization
          return
        }

        // Desktop'ta PageFlip'i yeniden başlat
        if (!newIsMobile && pageImages.length > 0) {
          // Check if PageFlip exists and is healthy
          if (pageFlipRef.current && typeof pageFlipRef.current.update === "function") {
            try {
              pageFlipRef.current.update()
            } catch (error) {
              console.warn("⚠️ PageFlip update failed, reinitializing...", error)
              aggressiveCleanup()
              mountLockRef.current = false
              initInProgressRef.current = false
              initFlip()
            }
          }
        } else if (newIsMobile && pageImages.length > 0) {
          // Mobilde slider'ı yeniden başlat
          initMobileSlider()
        }
      }, RESIZE_DEBOUNCE_MS)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, pageImages.length, pageAspectRatios.length])

  // Download PDF
  const handleDownloadPDF = () => {
    // Add cache-busting parameter to ensure latest PDF is downloaded
    const timestamp = new Date().getTime();
    const pdfUrl = `/Ais_Catalog.pdf?v=${timestamp}`
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = "Ais_Catalog.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Show check icon temporarily
    const downloadBtn = document.querySelector('[data-download-btn]') as HTMLElement
    if (downloadBtn) {
      const originalHTML = downloadBtn.innerHTML
      downloadBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `
      setTimeout(() => {
        downloadBtn.innerHTML = originalHTML
      }, 1000)
    }
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div
      className="catalog-page"
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        position: "relative",
        overflow: isMobile ? "visible" : "hidden",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loader */}
      {isLoading && (
        <div
          className="loader"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
            zIndex: 9999,
            color: "#1E293B",
            gap: "1rem",
          }}
        >
          <div className="animate-spin" style={{ width: "48px", height: "48px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p style={{ fontSize: "1.25rem", fontWeight: 500 }}>Preparing Catalog...</p>
        </div>
      )}

      {/* Top Bar */}
      <div
        style={{
          position: "fixed",
          top: "40px",
          left: "20px",
          right: "20px",
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Home Button */}
        <button
          onClick={handleGoHome}
          className="glassmorphism-button glassmorphism-button-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>{t("catalog.backToHome")}</span>
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownloadPDF}
          data-download-btn
          className="glassmorphism-button glassmorphism-button-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>{t("catalog.downloadPDF")}</span>
        </button>
      </div>

      {/* Book Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          padding: isMobile ? "72px 0 72px" : "96px 0 72px",
          overflow: "hidden",
        }}
      >
        <div
          ref={bookRef}
          id="book"
          className="book-wrapper"
          style={{
            perspective: isMobile ? "none" : "1500px",
            boxShadow: isMobile ? "none" : "0 45px 112.5px rgba(0,0,0,0.45)",
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? "324px" : "none",
            margin: isMobile ? "0 auto" : "0",
            overflow: "visible",
            display: "block",
            visibility: "visible",
            opacity: 1,
            minHeight: isMobile ? "360px" : "420px",
            maxHeight: "calc(100vh - 180px)",
            position: "relative",
            zIndex: 1,
          }}
        />
      </div>

      {/* Navigation Arrows */}
      {!isMobile ? (
        // Desktop: Side arrows
        <>
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            style={{
              position: "fixed",
              left: "40px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "white",
              border: "none",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              opacity: currentPage === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (currentPage > 0) {
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                e.currentTarget.style.background = "#f0f0f0"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1)"
              e.currentTarget.style.background = "white"
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1}
            style={{
              position: "fixed",
              right: "40px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "white",
              border: "none",
              cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (currentPage < totalPages - 1) {
                e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                e.currentTarget.style.background = "#F8FAFC"
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1)"
              e.currentTarget.style.background = "white"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      ) : (
        // Mobile: Bottom arrows
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "0",
            right: "0",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "white",
              border: "none",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              opacity: currentPage === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages - 1}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "white",
              border: "none",
              cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
