# Mestery Arcade

Mestery Arcade is a collection of web-based games built with HTML, CSS, and JavaScript. It serves as a central hub for multiple arcade-style games.

## Quick Start with Docker

```bash
# Build the Docker image
docker build -t mestery-arcade .

# Run the container
docker run -p 8080:80 mestery-arcade

# Visit http://localhost:8080 to play
```

To run in detached mode:
```bash
docker run -d -p 8080:80 --name mestery-arcade mestery-arcade
```

## Project Structure
- `index.html` - Main arcade page with game selection interface
- `spaceinvaders/` - Directory containing the Space Invaders game
  - `index.html` - Space Invaders game HTML
  - `script.js` - Space Invaders game JavaScript
  - `style.css` - Space Invaders game CSS
- `donkeykong/` - Directory containing the Donkey Kong game
  - `index.html` - Donkey Kong game HTML
  - `script.js` - Donkey Kong game JavaScript
  - `style.css` - Donkey Kong game CSS
- `mrspacman/` - Directory containing the Mr. Pacman game
  - `index.html` - Mr. Pacman game HTML
  - `script.js` - Mr. Pacman game JavaScript
  - `style.css` - Mr. Pacman game CSS
- `roadrash/` - Directory containing the Road Rash game
  - `index.html` - Road Rash game HTML
  - `script.js` - Road Rash game JavaScript
  - `style.css` - Road Rash game CSS

## Game Development Guidelines
1. Follow modern web development practices
2. Keep code clean and well-documented
3. Use semantic HTML elements where appropriate
4. Maintain responsive design principles
5. Ensure cross-browser compatibility for modern browsers

## Code Quality Standards
- All JavaScript should be written in ES6+ syntax
- CSS should follow BEM methodology for class naming
- HTML should be valid and semantic