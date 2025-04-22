# Documentation for register.html

**File:** `Frontend2/register.html`

## Purpose

This file presents the user registration form. New users can create an account by providing their email, desired username, password, and optionally the date of their last visit to Portugal.

## Structure

- **HTML Boilerplate:** Standard HTML5 structure.
- **Head:**
    - `meta charset="UTF-8"`: Specifies character encoding.
    - `meta name="viewport"`: Ensures proper responsive behavior.
    - `title`: Sets the page title ("Registreren | Azul").
    - TailwindCSS CDN: Loads Tailwind framework via CDN script.
    - Tailwind Config: Extended configuration with colors (`azulBlue`, `azulCream`, `azulAccent`, `azulTile1` through `azulTile5`).
    - Google Fonts import: Loads Playfair Display and Raleway fonts.
    - Inline `<style>`: 
        - Defines animations for form appearance.
        - Styles for form container, input focus effects, button hover effects.
        - Decorative edge tiles and progress indicators.
- **Body:** (Solid background color `#f8f5ee`)
    - Decorative edge tiles positioned around the page.
    - Form Container: 
        - Uses animation for smooth appearance.
        - Styled with white background, padding, rounded corners, shadow, max-width, and border.
        - "AZUL" link to home page.
        - `h2`: Title ("Registreren").
        - Progress indicator dots.
        - `form` (`id="registerForm"`):
            - Contains all input fields required for registration.
            - Email, username, password, confirm password fields.
            - Optional date field for last visit to Portugal.
            - All inputs styled with focus effects and transitions.
            - `div` (`id="errorMessage"`): Placeholder for displaying registration errors.
            - Submit button with gradient hover effect.
        - Footer links to login and home pages.
        - Decorative colored pattern at the bottom.
- **External Scripts:**
    - `<script src="js/register.js"></script>`: Links to the JavaScript file handling the registration form logic.

## Styling

- Primarily styled using TailwindCSS utility classes.
- Custom animations for form appearance.
- Consistent styling with other pages using the extended Azul-inspired color palette.
- Custom typography using Google Fonts (Playfair Display for headings, Raleway for body text).
- Interactive elements with hover effects and transitions.
- Decorative elements inspired by the Portuguese tile theme of Azul. 