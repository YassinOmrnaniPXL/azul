# Documentation for login.html

**File:** `Frontend2/login.html`

## Purpose

This file provides the user interface for logging into the Azul web application. Users enter their email and password to authenticate.

## Structure

- **HTML Boilerplate:** Standard HTML5 structure.
- **Head:**
    - `meta charset="UTF-8"`: Specifies character encoding.
    - `meta name="viewport"`: Ensures proper responsive behavior.
    - `title`: Sets the page title ("Login | Azul").
    - TailwindCSS CDN: Loads Tailwind framework via CDN script.
    - Tailwind Config: Extended configuration with colors (`azulBlue`, `azulCream`, `azulAccent`, `azulTile1` through `azulTile5`).
    - Google Fonts import: Loads Playfair Display and Raleway fonts.
    - Inline `<style>`: 
        - Defines animations for form appearance.
        - Styles for form container, input focus effects, and button hover effects.
        - Decorative corner patterns.
- **Body:** (Solid background color `#f8f5ee`)
    - Form Container: 
        - Uses animation for smooth appearance.
        - Styled with white background, padding, rounded corners, shadow, max-width, and border.
        - Decorative corner patterns in each corner.
        - "AZUL" link to home page.
        - `h2`: Title ("Inloggen").
        - `form` (`id="loginForm"`):
            - Contains input fields for email and password.
            - `label` and `input type="email"` for email address.
            - `label` and `input type="password"` for password.
            - Inputs styled with focus effects and transitions.
            - `div` (`id="errorMessage"`): Placeholder for displaying login errors.
            - Submit button with gradient hover effect.
            - Register link to registration page.
        - Footer links to home page and team page.
- **External Scripts:**
    - `<script src="js/login.js"></script>`: Links to the JavaScript file handling the login form logic.

## Styling

- Primarily styled using TailwindCSS utility classes.
- Custom animations for form appearance.
- Consistent styling with other pages using the extended Azul-inspired color palette.
- Custom typography using Google Fonts (Playfair Display for headings, Raleway for body text).
- Interactive elements with hover effects and transitions. 