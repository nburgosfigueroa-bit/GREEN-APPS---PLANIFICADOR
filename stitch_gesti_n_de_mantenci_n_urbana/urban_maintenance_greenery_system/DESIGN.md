---
name: Urban Maintenance & Greenery System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414944'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3e6654'
  primary: '#002d1d'
  on-primary: '#ffffff'
  primary-container: '#1a4332'
  on-primary-container: '#85af99'
  inverse-primary: '#a4d0b9'
  secondary: '#745b00'
  on-secondary: '#ffffff'
  secondary-container: '#fdd355'
  on-secondary-container: '#735a00'
  tertiary: '#202729'
  on-tertiary: '#ffffff'
  tertiary-container: '#363d3f'
  on-tertiary-container: '#a0a7aa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0edd4'
  primary-fixed-dim: '#a4d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#264e3d'
  secondary-fixed: '#ffe08b'
  secondary-fixed-dim: '#ebc246'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#dde4e6'
  tertiary-fixed-dim: '#c1c8ca'
  on-tertiary-fixed: '#161d1f'
  on-tertiary-fixed-variant: '#41484a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-technical:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  button-text:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
The design system is engineered for industrial-grade utility, bridging the gap between natural landscape management and rigorous technical maintenance. It targets field operators, urban planners, and maintenance supervisors who require a tool that feels as robust as the machinery they operate.

The style is **Corporate / Modern** with a high-utility edge. It prioritizes clarity over decoration, utilizing a structured information architecture that remains legible under direct sunlight or in high-pressure environments. The emotional response is one of reliability, precision, and environmental stewardship.

## Colors
This design system utilizes a high-contrast palette optimized for outdoor visibility and clear status signaling.

*   **Primary (Deep Forest):** Used for headers, primary branding, and "active" maintenance states. It establishes a connection to nature and provides a professional, grounded foundation.
*   **Secondary (Safety Yellow):** Reserved for high-priority actions, warnings, and machinery-related statuses. It must always be paired with dark text (Tertiary) to maintain accessibility.
*   **Tertiary (Technical Grey):** Used for data visualization, borders, and secondary text to provide a sophisticated, technical feel.
*   **Backgrounds:** A clean, slightly cool neutral grey minimizes glare while providing a surgical backdrop for information cards.
*   **Semantic Colors:** Success (Emerald), Error (Crimson), and Info (Cerulean) follow standard conventions but are adjusted for high saturation to ensure they are distinguishable in bright environments.

## Typography
The typographic scale is designed for rapid scanning of technical data. 

*   **Headlines:** Use **Hanken Grotesk** for its sharp, contemporary geometry and excellent legibility in large formats.
*   **Body:** **Inter** is the workhorse for all forms and descriptions, chosen for its neutral tone and superior performance at standard sizes.
*   **Technical Labels:** **JetBrains Mono** is introduced for IDs, coordinates, and machinery serial numbers to provide a distinct visual cue that the information is raw data.
*   **Accessibility:** Minimum font size for body text on mobile should be 16px to accommodate field use where hand-shake or environmental factors may affect focus.

## Layout & Spacing
The design system employs a **Fluid Grid** with a logic-based 8px increment system.

*   **Mobile:** Uses a single-column layout with 16px side margins. Touch targets must be a minimum of 48x48px.
*   **Tablet/Desktop:** A 12-column grid. Information is organized into "Data Clusters"—groups of cards that reflow based on priority.
*   **Spacing Philosophy:** Generous internal padding within cards (24px) ensures that text does not feel cramped, which is essential for reading in bright light. Gaps between components are kept tight (12px or 16px) to maintain a sense of technical density and efficiency.

## Elevation & Depth
To maintain a "clean and functional" aesthetic, this design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

*   **Level 0 (Canvas):** The base background color.
*   **Level 1 (Cards):** Pure white background with a 1px border in a light technical grey (#E0E0E0). This provides a crisp edge without the "muddiness" of shadows in sunlight.
*   **Level 2 (Active/Floating):** Use a subtle, high-diffusion shadow (0px 4px 12px rgba(0,0,0,0.08)) only for elements that require immediate physical interaction, like FABs (Floating Action Buttons) or active Modals.
*   **Level 3 (Overlay):** Used for critical alerts, utilizing a dimmed backdrop to pull focus.

## Shapes
The shape language is **Soft (0.25rem)**, conveying precision and structural integrity. 

*   **Standard Elements:** Buttons, input fields, and small tags use a 4px radius. This feels intentional and engineered.
*   **Container Elements:** Larger cards or modals use `rounded-lg` (8px) to soften the overall interface and make the software feel modern and approachable.
*   **Icons:** Use a consistent 2px stroke weight with slight corner rounding to match the UI's geometry.

## Components
Consistent implementation of these components ensures the system remains robust for field use.

*   **Buttons:**
    *   *Primary:* Solid Deep Forest green with white text. High-contrast and prominent.
    *   *Action:* Safety Yellow with Tertiary black text for "Start Task" or "Emergency" functions.
*   **Information Cards:** Must feature a 4px left-accent border that is color-coded to status (e.g., Green for "Maintained", Yellow for "Pending", Red for "Urgent").
*   **Input Fields:** Use thick 2px borders when focused. Labels should always be persistent (not floating) to ensure the user never loses context of the data being entered.
*   **Chips/Status Tags:** Use a "Light Fill" style (low opacity background with high opacity text) to indicate categories like "Irrigation", "Pruning", or "Infrastructure".
*   **Data Lists:** High-density rows with hairline separators. Each row should have a clear "chevron" or "action" icon to indicate drill-down capability.
*   **Specialized Components:** Include a "Map-Toggle" for switching between satellite and schematic views, and "Large-Scale Scanners" for QR/Barcode asset tracking.