# Documentation for index.html

**File:** `Frontend2/index.html`

## Purpose

This file serves as the main landing page for the Azul web application. It provides an introduction to the Azul board game, includes a visual element (image), and directs users to the login page.

## Structure

- **HTML Boilerplate:** Standard HTML5 structure (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`).
- **Head:**
    - `meta charset="UTF-8"`: Specifies character encoding.
    - `meta name="viewport"`: Ensures proper responsive behavior.
    - `title`: Sets the page title ("Welkom bij Azul").
    - TailwindCSS CDN: Loads Tailwind framework via CDN script.
    - Tailwind Config: Extended configuration with colors (`azulBlue`, `azulCream`, `azulAccent`, `azulTile1` through `azulTile5`).
    - Google Fonts import: Loads Playfair Display and Raleway fonts.
    - Inline `<style>`: 
        - Defines animations for decorative elements and content appearance.
        - Styles for decorative floating tiles.
- **Body:**
    - Uses a solid background color (`#f8f5ee`) for clean, distraction-free design.
    - Includes decorative floating tile elements with animations.
    - Main Content `div` (`.blurred-content`):
        - Contains the visible content with padding, rounded corners, shadow, border, and max-width.
        - `h1`: Main title ("AZUL") with fancy styling.
        - `p`: Subtitle describing the game.
        - `img`: Game image with hover animation.
        - Descriptive paragraph about the Azul board game.
        - Call-to-action button linking to login page.
        - Secondary links to registration and team pages.
        - Decorative footer pattern.

## Styling

- Primarily styled using TailwindCSS utility classes.
- Custom animations defined for fade-in effects and floating elements.
- Uses the extended color palette inspired by Azul tiles.
- Custom typography using Google Fonts (Playfair Display for headings, Raleway for body text).
- Features subtle hover animations and transitions for interactive elements. 