# React + TypeScript + Tailwind CSS Setup Instructions

## Project Structure

This project has been set up with:
- **React 18** with TypeScript
- **Vite** as the build tool
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **shadcn/ui** compatible structure

## Color Palette

The project uses the following color palette:
- Primary: `#0061FF`
- Background: `#EDF2FB`
- Secondary: `#5A95FF`
- Accent: `#A7C1FF`
- Foreground: `#1B1B1B`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Component Structure

Components are located in:
- `/src/components/ui/` - UI components (shadcn/ui compatible)
- Main entry: `/src/main.tsx`
- App component: `/src/App.tsx`

## Testimonial Component

The testimonial component is located at:
- `/src/components/ui/design-testimonial.tsx`

To use it in your app:
```tsx
import { Testimonial } from "@/components/ui/design-testimonial"

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background w-full">
      <Testimonial />
    </main>
  )
}
```

## Products Section Update

The products section has been updated with the new color palette:
- Background: `#EDF2FB`
- Text: `#1B1B1B`
- Borders: `#A7C1FF`
- Active states: `#0061FF` and `#5A95FF`

## Important Notes

1. The `/components/ui` folder is important for shadcn/ui compatibility. All UI components should be placed here.

2. Tailwind CSS is configured with the color palette in `tailwind.config.js`.

3. TypeScript path aliases are configured - use `@/` to import from the `src` directory.

4. The testimonial component uses Framer Motion for animations and requires the `framer-motion` package.



