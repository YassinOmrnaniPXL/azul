# Documentation for team.html

**File:** `Frontend2/team.html`

## Purpose

This file displays information about the development team (Team 04) responsible for the Azul web application. It shows team members with their names, roles, and profile pictures.

## Structure

- **HTML Boilerplate:** Standard HTML5 structure.
- **Head:**
    - `meta charset="UTF-8"`: Specifies character encoding.
    - `meta name="viewport"`: Ensures proper responsive behavior.
    - `title`: Sets the page title ("Ons Team | Azul").
    - TailwindCSS CDN: Loads Tailwind framework via CDN script.
    - Tailwind Config: Extended configuration with colors (`azulBlue`, `azulCream`, `azulAccent`, `azulTile1` through `azulTile5`).
    - Google Fonts import: Loads Playfair Display and Raleway fonts.
    - Inline `<style>`: 
        - Styles for team member card animations.
        - Portuguese tile pattern border effects.
        - Fancy title underline effect.
- **Body:** (Solid background color `#f8f5ee`)
    - Container with maximum width and auto margins.
    - Header section:
        - "AZUL" link to home page.
        - `h1`: Main title ("Team 04") with fancy underline effect.
        - Description paragraph about the team.
    - Team container:
        - Responsive grid layout (1 column on small screens, 3 columns on medium screens).
        - Individual team member cards:
            - White background with shadow and border effect.
            - Circular profile image with hover effect.
            - Team member name and role.
            - Decorative accent line.
            - Brief description.
            - Hover animations and transitions.
    - Bottom navigation:
        - Glass effect container with links to home and login pages.
        - Icon and text for each link.

## Styling

- Primarily styled using TailwindCSS utility classes.
- Custom animations for team member cards (fade-in sequence).
- Decorative Portuguese tile-inspired border pattern.
- Consistent styling with other pages using the extended Azul-inspired color palette.
- Custom typography using Google Fonts (Playfair Display for headings, Raleway for body text).
- Interactive elements with hover effects and transitions. 