# Celo Brand Design System

## 📚 Navigation

**Project Documentation**:
- [PRD](./PRD.md) - Product Requirements Document
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - High-level overview
- [Phase 1 Implementation](./PHASE_1_IMPLEMENTATION.md) - Data collection & processing

**Technical Specifications**:
- [Question Types](./QUESTION_TYPES.md) - Multiple choice and multiple response formats
- [Results Display Specification](./RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status

**Setup Guides**:
- [Farcaster Setup](./FARCASTER_SETUP.md) - Farcaster MiniApp setup guide

---

## Overview

This project uses the official Celo brand palette and typography to create a bold, high-contrast, raw interface. The design system is mobile-first and includes dark mode support.

**Reference**: [Celo Branding Guidelines](https://github.com/orgs/celo-org/discussions/18)

## Color System

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Yellow | `#FCFF52` | Hero sections, key buttons, CTAs |
| Forest Green | `#4E632A` | Alternate backgrounds, dark surfaces |
| Purple | `#1A0329` | High-impact sections, deep contrast |

### Base Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Light Tan | `#FBF6F1` | Main canvas (light mode) |
| Dark Tan | `#E6E3D5` | Secondary blocks (dark mode) |
| Brown | `#635949` | Text accents, subhead backgrounds |
| Black | `#000000` | Core text, high contrast |
| White | `#FFFFFF` | Core text, inverse surfaces |

### Functional Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Inactive | `#9B9B9B` | Disabled elements |
| Body Copy | `#666666` | Paragraph text |
| Success | `#329F3B` | Success states |
| Error | `#E70532` | Error states |

### Accent Pops (Use Sparingly)

| Color | Hex | Usage |
|-------|-----|-------|
| Pink | `#F2A9E7` | Occasional emphasis |
| Orange | `#F29E5F` | Alerts, strong callouts |
| Lime | `#B2EBA1` | Fresh highlights |
| Light Blue | `#8AC0F9` | Micro-interactions |

## Typography

### Headlines - GT Alpina

- **Font**: GT Alpina (fallback: Georgia, Times New Roman)
- **Weight**: 250 (thin)
- **Letter Spacing**: -0.01em
- **Style**: Use italic for emphasis

**Scale**:
- H1: `clamp(48px, 8vw, 72px)` - Line height: 1.17
- H2: `clamp(40px, 6vw, 54px)` - Line height: 1.33
- H3: `clamp(36px, 5vw, 48px)` - Line height: 1
- H4: `clamp(32px, 4vw, 40px)` - Line height: 1

### Body Text - Inter

- **Font**: Inter (system fallback)
- **Weight**: 400 (regular)
- **Letter Spacing**: -0.01em

**Scale**:
- Large: `clamp(18px, 2.5vw, 20px)` - Line height: 1.3
- Medium: `clamp(14px, 2vw, 16px)` - Line height: 1.625
- Small: `clamp(12px, 1.75vw, 14px)` - Line height: 1.29

### Links/Tags/Eyebrows - Inter

- **Font**: Inter
- **Weight**: 750 (heavy)
- **Size**: `clamp(11px, 1.5vw, 12px)`
- **Transform**: Uppercase
- **Letter Spacing**: 0em

## Components

### Buttons

**Primary Button**:
- Background: Yellow (`#FCFF52`)
- Text: Black (`#000000`)
- Border: 2px solid black
- Hover: Invert (black background, yellow text)
- Border radius: 0 (sharp edges)

**Secondary Button**:
- Light mode: Purple background, white text
- Dark mode: Forest green background, white text
- Hover: Invert colors

### Cards

- Background: Secondary color (tan/purple)
- Border: 2px solid (`#CCCCCC` or `#483554`)
- Padding: `clamp(24px, 4vw, 32px)`
- Border radius: 0

### Inputs

- Border: 2px solid black
- Background: Transparent
- Focus: Yellow background, black text
- Border radius: 0

## Dark Mode

### Light Mode
- Background: Light Tan (`#FBF6F1`)
- Text: Black (`#000000`)
- Secondary: Dark Tan (`#E6E3D5`)

### Dark Mode
- Background: Purple (`#1A0329`)
- Text: White (`#FFFFFF`)
- Secondary: Forest Green (`#4E632A`)

### Theme Toggle
- Component: `<ThemeToggle />`
- Location: Navbar (desktop and mobile)
- Persistence: localStorage (`celo-theme`)
- System preference: Detected on first load

## Layout Principles

1. **Raw & Structural**: Sharp rectangles, visible outlines
2. **Asymmetrical**: Break grid norms, unexpected spacing
3. **Big Color Blocks**: Vast negative space and dense sections
4. **Mobile-First**: Responsive using `clamp()` for all sizes
5. **No Gradients**: Hard-edged, stark contrasts only

## Usage Examples

### CSS Classes

```css
/* Typography */
.celo-h1          /* Headline 1 */
.celo-h2          /* Headline 2 */
.celo-body        /* Body text */
.celo-link        /* Links/tags */

/* Colors */
.celo-block-yellow    /* Yellow background block */
.celo-block-purple    /* Purple background block */
.celo-text-yellow     /* Yellow text */

/* Components */
.celo-button          /* Primary button */
.celo-button-secondary /* Secondary button */
.celo-card            /* Card container */
.celo-input           /* Form input */

/* Utilities */
.celo-sharp           /* Remove border radius */
.celo-border          /* Add border */
.celo-spacing-large   /* Large spacing */
```

### React Components

```tsx
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';

// In your app
<ThemeProvider>
  <ThemeToggle />
</ThemeProvider>

// In components
const { theme, toggleTheme } = useTheme();
```

## Mobile-First Responsive

All sizing uses `clamp()` for fluid responsive design:

- **Typography**: Scales from mobile to desktop
- **Spacing**: `clamp(16px, 4vw, 32px)` for padding
- **Containers**: Max-width constraints at breakpoints
- **Viewport**: Proper meta tags for mobile

## Accessibility

- High contrast ratios (WCAG AA compliant)
- Focus states clearly visible
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support

---

**Last Updated**: 2025-11-23  
**Status**: Implemented

