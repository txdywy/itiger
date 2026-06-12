/**
 * SymbolRenderer - Dynamic inline SVG library for all slot machine themes
 * Renders extremely high-quality vector symbols with gradients, reflections, and glow effects.
 */
export class SymbolRenderer {
  /**
   * Render symbol SVG based on theme and index
   * @param {string} themeId 
   * @param {number} index 
   * @returns {string} SVG HTML string
   */
  static render(themeId, index) {
    if (themeId === 'las-vegas') {
      const names = ['cherry', 'bell', 'clover', 'bar', 'seven', 'diamond', 'crown', 'star'];
      const name = names[index] || names[0];
      return `<img src="assets/images/las-vegas/${name}.png" class="symbol-img" alt="${name}">`;
    }
    if (themeId === 'egypt') {
      const names = ['ankh', 'scarab', 'eye', 'pharaoh', 'urn', 'cobra', 'wild', 'scatter'];
      const name = names[index] || names[0];
      return `<img src="assets/images/egypt/${name}.png" class="symbol-img" alt="${name}">`;
    }
    if (themeId === 'maya' && index === 0) {
      // Maya mask is generated and ready
      return `<img src="assets/images/maya/mask.png" class="symbol-img" alt="mask">`;
    }
    const renderFunc = this._rendererMap[themeId]?.[index] || this._rendererMap['las-vegas'][0];
    return renderFunc();
  }

  // Common SVG gradients & filters to import
  static get defs() {
    return `
      <defs>
        <!-- Gold Gradients -->
        <linearGradient id="gold-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE57F" />
          <stop offset="25%" stop-color="#FFD700" />
          <stop offset="50%" stop-color="#B8860B" />
          <stop offset="75%" stop-color="#FFD700" />
          <stop offset="100%" stop-color="#FFE57F" />
        </linearGradient>
        
        <radialGradient id="gold-glare" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
          <stop offset="40%" stop-color="#FFD700" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#B8860B" stop-opacity="0"/>
        </radialGradient>

        <!-- Glow Filters -->
        <filter id="neon-glow-red" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="neon-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <!-- Drop shadow for 3D depth -->
        <filter id="shadow-3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
    `;
  }
}

// Map of theme -> index -> render function
SymbolRenderer._rendererMap = {
  'las-vegas': {
    // 0: Cherries
    0: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Stems -->
        <path d="M50,20 C60,10 70,22 70,36 M50,20 C40,10 30,22 30,36" stroke="#8BC34A" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M48,18 Q52,14 56,19" stroke="#8BC34A" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Cherry Left -->
        <circle cx="32" cy="45" r="16" fill="radial-gradient(circle at 35% 35%, #FF5252, #B71C1C)"/>
        <circle cx="28" cy="41" r="5" fill="#FFFFFF" opacity="0.6"/>
        <!-- Cherry Right -->
        <circle cx="68" cy="45" r="16" fill="radial-gradient(circle at 35% 35%, #FF5252, #B71C1C)"/>
        <circle cx="64" cy="41" r="5" fill="#FFFFFF" opacity="0.6"/>
      </svg>
    `,
    // 1: Golden Bell
    1: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Bell Body -->
        <path d="M50,15 C35,15 30,35 30,60 C30,64 25,65 25,70 L75,70 C75,65 70,64 70,60 C70,35 65,15 50,15 Z" fill="url(#gold-metal)"/>
        <!-- Handle -->
        <circle cx="50" cy="14" r="7" fill="none" stroke="url(#gold-metal)" stroke-width="4"/>
        <!-- Clapper -->
        <circle cx="50" cy="74" r="8" fill="#FFC107"/>
        <!-- Ring flare -->
        <ellipse cx="50" cy="30" rx="15" ry="5" fill="url(#gold-glare)"/>
      </svg>
    `,
    // 2: Clover (Emerald Lucky Clover)
    2: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#A7FFEB" />
          <stop offset="50%" stop-color="#00E676" />
          <stop offset="100%" stop-color="#004D40" />
        </linearGradient>
        <!-- Stem -->
        <path d="M50,50 Q45,75 35,80" stroke="#00E676" stroke-width="6" stroke-linecap="round" fill="none"/>
        <!-- Leaves -->
        <g fill="url(#emerald)">
          <path d="M50,50 C38,32 62,32 50,50 Z" transform="rotate(0, 50, 50)"/>
          <path d="M50,50 C38,32 62,32 50,50 Z" transform="rotate(90, 50, 50)"/>
          <path d="M50,50 C38,32 62,32 50,50 Z" transform="rotate(180, 50, 50)"/>
          <path d="M50,50 C38,32 62,32 50,50 Z" transform="rotate(270, 50, 50)"/>
        </g>
      </svg>
    `,
    // 3: Golden Bar
    3: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Bar Outline -->
        <polygon points="20,65 30,35 70,35 80,65" fill="url(#gold-metal)" stroke="#553300" stroke-width="2"/>
        <!-- Top Bevel -->
        <polygon points="30,35 34,42 66,42 70,35" fill="#FFF59D" opacity="0.6"/>
        <!-- Inner highlight -->
        <rect x="35" y="46" width="30" height="12" fill="#B8860B" opacity="0.3"/>
        <text x="50" y="55" font-family="'Orbitron', sans-serif" font-size="10" font-weight="900" fill="#553300" text-anchor="middle">BAR</text>
      </svg>
    `,
    // 4: Lucky 777 (Neon)
    4: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#neon-glow-red)">
        ${SymbolRenderer.defs}
        <g fill="none" stroke="#FF1493" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
          <path d="M30,30 L65,30 L45,75" />
          <path d="M20,38 L50,38 L34,70" opacity="0.75" />
          <path d="M40,22 L75,22 L55,67" opacity="0.75" />
        </g>
        <g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
          <path d="M30,30 L65,30 L45,75" />
        </g>
      </svg>
    `,
    // 5: Crystal Diamond
    5: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E0F7FA" />
          <stop offset="50%" stop-color="#00E5FF" />
          <stop offset="100%" stop-color="#006064" />
        </linearGradient>
        <!-- Facets -->
        <polygon points="50,20 75,38 50,80 25,38" fill="url(#diamond-grad)"/>
        <polygon points="50,20 62,38 50,80 38,38" fill="#FFFFFF" opacity="0.4"/>
        <polygon points="50,20 75,38 62,38" fill="#E0F7FA" opacity="0.6"/>
        <polygon points="50,20 25,38 38,38" fill="#E0F7FA" opacity="0.6"/>
      </svg>
    `,
    // 6: Wild Crown
    6: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Crown Base -->
        <rect x="25" y="62" width="50" height="8" rx="2" fill="url(#gold-metal)" stroke="#553300" stroke-width="2"/>
        <!-- Spikes -->
        <path d="M25,62 L20,35 L38,50 L50,25 L62,50 L80,35 L75,62 Z" fill="url(#gold-metal)" stroke="#553300" stroke-width="2"/>
        <!-- Jewels -->
        <circle cx="20" cy="32" r="3" fill="#FF1744"/>
        <circle cx="50" cy="22" r="4" fill="#00E5FF"/>
        <circle cx="80" cy="32" r="3" fill="#FF1744"/>
        <!-- Wild Text -->
        <text x="50" y="82" font-family="'Orbitron', sans-serif" font-size="11" font-weight="900" fill="#FFD700" text-anchor="middle" filter="url(#neon-glow-red)">WILD</text>
      </svg>
    `,
    // 7: Scatter Star
    7: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Star Shape -->
        <path d="M50,15 L62,38 L88,40 L68,58 L75,83 L50,70 L25,83 L32,58 L12,40 L38,38 Z" fill="url(#gold-metal)" stroke="#B8860B" stroke-width="2"/>
        <circle cx="50" cy="50" r="10" fill="url(#gold-glare)"/>
        <!-- Scatter Text -->
        <text x="50" y="94" font-family="'Orbitron', sans-serif" font-size="10" font-weight="900" fill="#FF1493" text-anchor="middle" filter="url(#neon-glow-red)">SCATTER</text>
      </svg>
    `
  },
  'egypt': {
    // 0: Ankh
    0: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="turquoise" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00E5FF" />
          <stop offset="100%" stop-color="#00838F" />
        </linearGradient>
        <!-- Loop -->
        <ellipse cx="50" cy="35" rx="16" ry="20" fill="none" stroke="url(#gold-metal)" stroke-width="8"/>
        <ellipse cx="50" cy="35" rx="10" ry="14" fill="none" stroke="url(#turquoise)" stroke-width="4"/>
        <!-- Cross -->
        <path d="M30,55 L70,55 M50,50 L50,85" stroke="url(#gold-metal)" stroke-width="8" stroke-linecap="round"/>
        <path d="M32,55 L68,55 M50,52 L50,83" stroke="url(#turquoise)" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
    // 1: Scarab
    1: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="lapis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2979FF" />
          <stop offset="100%" stop-color="#0D47A1" />
        </linearGradient>
        <!-- Body -->
        <ellipse cx="50" cy="52" rx="20" ry="26" fill="url(#lapis)"/>
        <!-- Head -->
        <path d="M38,32 C38,22 62,22 62,32 Z" fill="url(#gold-metal)"/>
        <!-- Gold Wings / Legs -->
        <path d="M26,38 Q10,42 22,62 M74,38 Q90,42 78,62 M30,68 Q18,75 28,84 M70,68 Q82,75 72,84" stroke="url(#gold-metal)" stroke-width="4" stroke-linecap="round" fill="none"/>
        <line x1="50" y1="26" x2="50" y2="78" stroke="url(#gold-metal)" stroke-width="2"/>
      </svg>
    `,
    // 2: Eye of Horus
    2: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Eye Contour -->
        <path d="M20,50 Q50,25 80,50 Q50,75 20,50 Z" fill="#FFFFFF" stroke="url(#gold-metal)" stroke-width="5"/>
        <!-- Pupil -->
        <circle cx="50" cy="50" r="14" fill="#0D47A1" stroke="url(#gold-metal)" stroke-width="2"/>
        <circle cx="50" cy="50" r="8" fill="#000000"/>
        <circle cx="53" cy="47" r="3" fill="#FFFFFF"/>
        <!-- Stylized Tear Line -->
        <path d="M35,58 L30,76 L44,65" fill="none" stroke="url(#gold-metal)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    // 3: Pharaoh Mask
    3: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Headpiece Stripes (Gold/Blue) -->
        <path d="M22,35 C20,15 80,15 78,35 L70,60 L62,72 L50,82 L38,72 L30,60 Z" fill="url(#gold-metal)"/>
        <path d="M28,32 Q50,15 72,32 L66,54 L58,68 L50,74 L42,68 L34,54 Z" fill="#0D47A1"/>
        <!-- Face -->
        <path d="M38,42 C38,32 62,32 62,42 L60,60 Q60,70 50,70 Q40,70 40,60 Z" fill="#FFE0B2"/>
        <!-- Beard -->
        <rect x="47" y="70" width="6" height="12" fill="url(#gold-metal)"/>
      </svg>
    `,
    // 4: Sacred Urn
    4: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Body -->
        <ellipse cx="50" cy="55" rx="22" ry="22" fill="url(#gold-metal)"/>
        <ellipse cx="50" cy="55" rx="16" ry="16" fill="#D84315"/>
        <!-- Neck & Lip -->
        <path d="M38,25 L62,25 L58,35 L42,35 Z" fill="url(#gold-metal)"/>
        <ellipse cx="50" cy="25" rx="12" ry="3" fill="#3E2723"/>
        <!-- Handles -->
        <path d="M28,45 Q16,35 30,35 M72,45 Q84,35 70,35" stroke="url(#gold-metal)" stroke-width="4" fill="none"/>
      </svg>
    `,
    // 5: Golden Cobra
    5: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Coiled Body -->
        <path d="M50,80 C20,80 20,68 50,68 C80,68 80,55 50,55 C20,55 20,40 50,40 Z" fill="none" stroke="url(#gold-metal)" stroke-width="8" stroke-linecap="round"/>
        <!-- Hood -->
        <path d="M35,32 C30,18 70,18 65,32 L50,40 Z" fill="url(#gold-metal)"/>
        <!-- Eyes -->
        <circle cx="45" cy="24" r="2" fill="#00E676"/>
        <circle cx="55" cy="24" r="2" fill="#00E676"/>
      </svg>
    `,
    // 6: Wild Horus Falcon
    6: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Wings -->
        <path d="M50,22 C20,25 15,45 28,68 C40,65 48,50 50,45 C52,50 60,65 72,68 C85,45 80,25 50,22 Z" fill="url(#gold-metal)" stroke="#553300" stroke-width="2"/>
        <!-- Horus Head -->
        <path d="M44,32 Q50,14 56,32 L50,42 Z" fill="url(#gold-metal)"/>
        <circle cx="50" cy="30" r="2" fill="#FF1744"/>
        <text x="50" y="86" font-family="'Cinzel', serif" font-size="12" font-weight="900" fill="#FFD700" text-anchor="middle" filter="url(#neon-glow-red)">WILD</text>
      </svg>
    `,
    // 7: Scatter Sun Ra
    7: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Sun Rays -->
        <g stroke="url(#gold-metal)" stroke-width="4" stroke-linecap="round">
          <line x1="50" y1="12" x2="50" y2="88" />
          <line x1="12" y1="50" x2="88" y2="50" />
          <line x1="23" y1="23" x2="77" y2="77" />
          <line x1="23" y1="77" x2="77" y2="23" />
        </g>
        <!-- Center Disc -->
        <circle cx="50" cy="50" r="22" fill="#FF3D00" stroke="url(#gold-metal)" stroke-width="4"/>
        <circle cx="50" cy="50" r="14" fill="url(#gold-metal)"/>
        <text x="50" y="96" font-family="'Cinzel', serif" font-size="9" font-weight="900" fill="#FF5722" text-anchor="middle" filter="url(#neon-glow-red)">SCATTER</text>
      </svg>
    `
  },
  'maya': {
    // 0: Stone Mask
    0: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="stone-grey" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#CFD8DC" />
          <stop offset="100%" stop-color="#37474F" />
        </linearGradient>
        <!-- Mayan Stone Block -->
        <rect x="25" y="25" width="50" height="50" rx="6" fill="url(#stone-grey)" stroke="#1a331a" stroke-width="3"/>
        <!-- Carved details -->
        <circle cx="38" cy="42" r="6" fill="none" stroke="#263238" stroke-width="3"/>
        <circle cx="62" cy="42" r="6" fill="none" stroke="#263238" stroke-width="3"/>
        <path d="M35,60 C40,52 60,52 65,60" fill="none" stroke="#263238" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,
    // 1: Jaguar Profile
    1: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Jaguar Head -->
        <path d="M22,55 C22,30 50,25 72,35 C78,38 82,48 78,55 C70,62 50,65 40,65 L28,68 Z" fill="#FFC107" stroke="#3E2723" stroke-width="3"/>
        <!-- Spots -->
        <circle cx="40" cy="42" r="2.5" fill="#3E2723"/>
        <circle cx="54" cy="46" r="3.5" fill="#3E2723"/>
        <circle cx="65" cy="50" r="2.5" fill="#3E2723"/>
        <!-- Ear -->
        <path d="M34,32 L42,24 L44,34 Z" fill="#FF8F00"/>
        <!-- Green Jade Eye -->
        <circle cx="56" cy="38" r="4" fill="#00E676" stroke="#FFFFFF" stroke-width="1"/>
      </svg>
    `,
    // 2: Emerald Serpent
    2: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="jade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#69F0AE" />
          <stop offset="100%" stop-color="#004D40" />
        </linearGradient>
        <!-- Coiled Snake -->
        <path d="M50,20 C70,20 80,35 65,50 C50,65 30,50 35,35 C40,20 60,32 50,50 Q40,68 50,80" fill="none" stroke="url(#jade-grad)" stroke-width="8" stroke-linecap="round"/>
        <circle cx="50" cy="20" r="2" fill="#FF3D00"/>
      </svg>
    `,
    // 3: Sun Calendar
    3: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Calendar Disk -->
        <circle cx="50" cy="50" r="32" fill="url(#gold-metal)" stroke="#274e13" stroke-width="3"/>
        <circle cx="50" cy="50" r="24" fill="#1b4d3e" stroke="url(#gold-metal)" stroke-width="2"/>
        <!-- Inner Glyph Face -->
        <circle cx="50" cy="50" r="12" fill="url(#gold-metal)"/>
        <path d="M45,48 Q50,43 55,48 M42,52 L58,52" stroke="#274e13" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    // 4: Plumed Headdress
    4: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Jade Feathers -->
        <g stroke="#00E676" stroke-width="5" stroke-linecap="round">
          <line x1="50" y1="50" x2="50" y2="15" />
          <line x1="50" y1="50" x2="26" y2="22" />
          <line x1="50" y1="50" x2="74" y2="22" />
          <line x1="50" y1="50" x2="16" y2="38" />
          <line x1="50" y1="50" x2="84" y2="38" />
        </g>
        <!-- Gold Headband -->
        <path d="M30,55 C30,45 70,45 70,55" fill="none" stroke="url(#gold-metal)" stroke-width="10" stroke-linecap="round"/>
        <!-- Central Red Gem -->
        <circle cx="50" cy="50" r="6" fill="#FF1744" stroke="#FFF" stroke-width="1.5"/>
      </svg>
    `,
    // 5: Mayan Dagger
    5: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Obsidian Blade -->
        <polygon points="50,15 60,55 50,62 40,55" fill="#212121" stroke="#FF5252" stroke-width="2"/>
        <line x1="50" y1="15" x2="50" y2="60" stroke="#424242" stroke-width="1.5"/>
        <!-- Hilt (Gold & Jade) -->
        <rect x="34" y="62" width="32" height="6" fill="url(#gold-metal)" rx="1"/>
        <rect x="44" y="68" width="12" height="18" fill="#00E676" rx="2"/>
      </svg>
    `,
    // 6: Wild Golden Eagle
    6: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Eagle wings -->
        <path d="M50,25 C10,25 20,65 50,70 C80,65 90,25 50,25 Z" fill="url(#gold-metal)" stroke="#3E2723" stroke-width="2"/>
        <!-- Eagle Beak -->
        <path d="M42,34 Q50,18 58,34 L50,44 Z" fill="#FFD700"/>
        <!-- Jade Eyes -->
        <circle cx="47" cy="30" r="2" fill="#00E676"/>
        <circle cx="53" cy="30" r="2" fill="#00E676"/>
        <text x="50" y="85" font-family="'Cinzel', serif" font-size="12" font-weight="900" fill="#00FF88" text-anchor="middle" filter="url(#neon-glow-blue)">WILD</text>
      </svg>
    `,
    // 7: Scatter Fire Sun Stone
    7: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Outer Fire Rays -->
        <g stroke="#FF5722" stroke-width="4" stroke-linecap="round">
          <line x1="50" y1="10" x2="50" y2="90" />
          <line x1="10" y1="50" x2="90" y2="50" />
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="20" y1="80" x2="80" y2="20" />
        </g>
        <!-- Aztec Calendar Shield -->
        <circle cx="50" cy="50" r="24" fill="#004D40" stroke="url(#gold-metal)" stroke-width="4"/>
        <circle cx="50" cy="50" r="16" fill="url(#gold-metal)"/>
        <circle cx="50" cy="50" r="8" fill="#FFD700"/>
        <text x="50" y="96" font-family="'Cinzel', serif" font-size="9" font-weight="900" fill="#FFC107" text-anchor="middle" filter="url(#neon-glow-red)">SCATTER</text>
      </svg>
    `
  },
  'underwater': {
    // 0: Pearl Shell
    0: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="shell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E0F7FA" />
          <stop offset="50%" stop-color="#E1BEE7" />
          <stop offset="100%" stop-color="#80DEEA" />
        </linearGradient>
        <!-- Oyster Shell -->
        <path d="M50,75 C25,75 20,40 38,25 C50,15 50,15 62,25 C80,40 75,75 50,75 Z" fill="url(#shell-grad)" stroke="#006064" stroke-width="2"/>
        <line x1="50" y1="75" x2="50" y2="18" stroke="#00838F" stroke-width="2"/>
        <line x1="50" y1="75" x2="32" y2="30" stroke="#00838F" stroke-width="2"/>
        <line x1="50" y1="75" x2="68" y2="30" stroke="#00838F" stroke-width="2"/>
        <!-- Pearl -->
        <circle cx="50" cy="62" r="8" fill="radial-gradient(circle at 35% 35%, #FFFFFF, #B0BEC5)"/>
      </svg>
    `,
    // 1: Seahorse
    1: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="seahorse-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00E5FF" />
          <stop offset="100%" stop-color="#1A237E" />
        </linearGradient>
        <!-- Seahorse body curve -->
        <path d="M52,22 C42,16 40,26 44,32 C48,38 34,44 38,58 C42,72 54,68 48,78 C44,88 56,86 54,78 C52,70 60,58 56,44 L58,32 C58,26 62,28 52,22 Z" fill="url(#seahorse-grad)" stroke="#00E5FF" stroke-width="2"/>
        <!-- Crown -->
        <path d="M42,20 L44,14 L48,16 L52,14 L54,20" stroke="#FFD700" stroke-width="2" fill="none"/>
        <circle cx="48" cy="24" r="1.5" fill="#FF1744"/>
      </svg>
    `,
    // 2: Clownfish
    2: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Fish Body -->
        <path d="M20,50 C20,32 58,25 72,42 L84,32 L80,50 L84,68 L72,58 C58,75 20,68 20,50 Z" fill="#FF6D00" stroke="#3E2723" stroke-width="3"/>
        <!-- White Stripes -->
        <path d="M38,34 Q44,50 38,66" stroke="#FFFFFF" stroke-width="8" fill="none"/>
        <path d="M58,32 Q64,50 58,68" stroke="#FFFFFF" stroke-width="8" fill="none"/>
        <!-- Eye -->
        <circle cx="30" cy="42" r="3.5" fill="#000000" stroke="#FFFFFF" stroke-width="1.5"/>
      </svg>
    `,
    // 3: Treasure Chest
    3: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Box Body -->
        <rect x="25" y="48" width="50" height="26" fill="#5D4037" stroke="#3E2723" stroke-width="3" rx="2"/>
        <!-- Lid (open slightly) -->
        <path d="M23,48 C23,32 77,32 77,48 Z" fill="#8D6E63" stroke="#3E2723" stroke-width="3"/>
        <!-- Gold Coins inside -->
        <circle cx="40" cy="46" r="6" fill="#FFD700"/>
        <circle cx="50" cy="44" r="7" fill="#FFC107"/>
        <circle cx="60" cy="46" r="6" fill="#FFD700"/>
        <!-- Lock -->
        <rect x="46" y="48" width="8" height="10" fill="url(#gold-metal)"/>
      </svg>
    `,
    // 4: Rusty Anchor
    4: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Ring -->
        <circle cx="50" cy="22" r="8" fill="none" stroke="url(#gold-metal)" stroke-width="4"/>
        <!-- Vertical Shaft -->
        <line x1="50" y1="30" x2="50" y2="72" stroke="url(#gold-metal)" stroke-width="6"/>
        <line x1="36" y1="42" x2="64" y2="42" stroke="url(#gold-metal)" stroke-width="5"/>
        <!-- Curved Hooks -->
        <path d="M24,55 Q50,90 76,55" stroke="url(#gold-metal)" stroke-width="8" stroke-linecap="round" fill="none"/>
        <!-- Arrow tips -->
        <polygon points="24,55 18,62 30,62" fill="url(#gold-metal)"/>
        <polygon points="76,55 70,62 82,62" fill="url(#gold-metal)"/>
      </svg>
    `,
    // 5: Poseidon Trident
    5: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Shaft -->
        <line x1="50" y1="45" x2="50" y2="88" stroke="url(#gold-metal)" stroke-width="5" stroke-linecap="round"/>
        <!-- Prongs Base -->
        <path d="M30,35 Q50,55 70,35" stroke="url(#gold-metal)" stroke-width="6" stroke-linecap="round" fill="none"/>
        <!-- Center Spear -->
        <polygon points="50,12 55,38 45,38" fill="url(#gold-metal)"/>
        <!-- Left Spear -->
        <polygon points="30,22 34,40 26,38" fill="url(#gold-metal)"/>
        <!-- Right Spear -->
        <polygon points="70,22 74,38 66,40" fill="url(#gold-metal)"/>
      </svg>
    `,
    // 6: Wild Tidal Wave
    6: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="wave-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00E5FF" />
          <stop offset="50%" stop-color="#2979FF" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </linearGradient>
        <!-- Wave Crest -->
        <path d="M15,75 C25,75 30,55 45,55 C60,55 60,32 75,32 C85,32 80,45 80,52 C68,48 64,65 50,65 C35,65 30,78 15,75 Z" fill="url(#wave-grad)" stroke="#006064" stroke-width="2"/>
        <path d="M25,70 Q45,35 68,48" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <text x="50" y="86" font-family="'Orbitron', sans-serif" font-size="12" font-weight="900" fill="#00E5FF" text-anchor="middle" filter="url(#neon-glow-blue)">WILD</text>
      </svg>
    `,
    // 7: Scatter Compass Star
    7: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Compass Dial -->
        <circle cx="50" cy="50" r="32" fill="none" stroke="url(#gold-metal)" stroke-width="4"/>
        <!-- Compass points -->
        <polygon points="50,14 54,46 46,46" fill="#FF1744"/>
        <polygon points="50,86 54,54 46,54" fill="url(#gold-metal)"/>
        <polygon points="14,50 46,54 46,46" fill="url(#gold-metal)"/>
        <polygon points="86,50 54,54 54,46" fill="url(#gold-metal)"/>
        <!-- Center Gem -->
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" stroke="#00E5FF" stroke-width="2"/>
        <text x="50" y="96" font-family="'Orbitron', sans-serif" font-size="9" font-weight="900" fill="#00E5FF" text-anchor="middle" filter="url(#neon-glow-blue)">SCATTER</text>
      </svg>
    `
  },
  'space': {
    // 0: Saturn
    0: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="purple-nebula" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E040FB" />
          <stop offset="100%" stop-color="#4A148C" />
        </linearGradient>
        <!-- Ring behind -->
        <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="url(#gold-metal)" stroke-width="6" transform="rotate(-15, 50, 50)" opacity="0.6"/>
        <!-- Sphere -->
        <circle cx="50" cy="50" r="20" fill="url(#purple-nebula)"/>
        <!-- Ring front -->
        <path d="M16,55 A35,12 0 0,0 84,45" fill="none" stroke="url(#gold-metal)" stroke-width="6" transform="rotate(-15, 50, 50)"/>
      </svg>
    `,
    // 1: Chrome Rocket
    1: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Rocket Flame -->
        <polygon points="50,75 42,90 50,84 58,90" fill="#FF3D00"/>
        <polygon points="50,75 46,86 50,82 54,86" fill="#FFD600"/>
        <!-- Rocket Body -->
        <path d="M50,15 C42,32 40,55 42,75 L58,75 C60,55 58,32 50,15 Z" fill="#ECEFF1" stroke="#37474F" stroke-width="2"/>
        <!-- Fins -->
        <path d="M42,60 L28,75 L42,75 Z" fill="#FF1744" stroke="#37474F" stroke-width="2"/>
        <path d="M58,60 L72,75 L58,75 Z" fill="#FF1744" stroke="#37474F" stroke-width="2"/>
        <!-- Port Window -->
        <circle cx="50" cy="42" r="6" fill="#00E5FF" stroke="#37474F" stroke-width="2"/>
      </svg>
    `,
    // 2: Cyber UFO
    2: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Cockpit Glass -->
        <ellipse cx="50" cy="35" rx="16" ry="12" fill="#00E676" opacity="0.8"/>
        <!-- Saucer Disc -->
        <ellipse cx="50" cy="48" rx="34" ry="12" fill="#90A4AE" stroke="#37474F" stroke-width="3"/>
        <!-- Hologram Beam -->
        <polygon points="35,58 20,85 80,85 65,58" fill="url(#gold-glare)" opacity="0.3"/>
        <!-- Lights -->
        <circle cx="28" cy="48" r="2.5" fill="#FFD700"/>
        <circle cx="50" cy="50" r="3" fill="#FF1744"/>
        <circle cx="72" cy="48" r="2.5" fill="#FFD700"/>
      </svg>
    `,
    // 3: Space Helmet
    3: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Helmet Base -->
        <circle cx="50" cy="48" r="26" fill="#FFFFFF" stroke="#37474F" stroke-width="3"/>
        <!-- Visor Glass (Reflective Blue) -->
        <path d="M30,42 C30,28 70,28 70,42 C70,55 30,55 30,42 Z" fill="radial-gradient(circle at 40% 40%, #00E5FF, #0D47A1)"/>
        <!-- Reflection Highlight -->
        <path d="M36,36 Q50,28 64,36" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5"/>
        <!-- Tubing -->
        <rect x="42" y="74" width="16" height="10" fill="#B0BEC5" rx="2"/>
      </svg>
    `,
    // 4: Orbital Station
    4: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <!-- Solar Panels -->
        <rect x="15" y="42" width="22" height="16" fill="#00E5FF" stroke="#37474F" stroke-width="2"/>
        <rect x="63" y="42" width="22" height="16" fill="#00E5FF" stroke="#37474F" stroke-width="2"/>
        <line x1="15" y1="50" x2="85" y2="50" stroke="#37474F" stroke-width="6"/>
        <!-- Central Hub -->
        <circle cx="50" cy="50" r="12" fill="#ECEFF1" stroke="#37474F" stroke-width="3"/>
        <circle cx="50" cy="50" r="5" fill="#FF1744"/>
      </svg>
    `,
    // 5: Crystal Meteorite
    5: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#shadow-3d)">
        ${SymbolRenderer.defs}
        <linearGradient id="crystal-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF4081" />
          <stop offset="100%" stop-color="#301934" />
        </linearGradient>
        <!-- Jagged Rock -->
        <polygon points="50,15 78,35 68,75 32,75 22,35" fill="url(#crystal-pink)" stroke="#FF4081" stroke-width="2"/>
        <!-- Cracks/Faceted lines -->
        <line x1="50" y1="15" x2="50" y2="75" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4"/>
        <line x1="22" y1="35" x2="50" y2="50" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4"/>
        <line x1="78" y1="35" x2="50" y2="50" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4"/>
      </svg>
    `,
    // 6: Wild Black Hole
    6: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#neon-glow-blue)">
        ${SymbolRenderer.defs}
        <radialGradient id="black-hole-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" />
          <stop offset="60%" stop-color="#311B92" />
          <stop offset="90%" stop-color="#E040FB" />
          <stop offset="100%" stop-color="#00E5FF" stop-opacity="0" />
        </radialGradient>
        <!-- Gravity Swirls -->
        <circle cx="50" cy="50" r="38" fill="url(#black-hole-core)"/>
        <circle cx="50" cy="50" r="16" fill="#000000"/>
        <!-- Accretion disk lines -->
        <ellipse cx="50" cy="50" rx="36" ry="6" fill="none" stroke="#00E5FF" stroke-width="3" transform="rotate(-20, 50, 50)" opacity="0.8"/>
        <text x="50" y="86" font-family="'Orbitron', sans-serif" font-size="12" font-weight="900" fill="#E040FB" text-anchor="middle" filter="url(#neon-glow-red)">WILD</text>
      </svg>
    `,
    // 7: Scatter Supernova
    7: () => `
      <svg viewBox="0 0 100 100" class="symbol-svg" filter="url(#neon-glow-blue)">
        ${SymbolRenderer.defs}
        <!-- Radial Rays -->
        <g stroke="#00E5FF" stroke-width="4" stroke-linecap="round">
          <line x1="50" y1="15" x2="50" y2="85" />
          <line x1="15" y1="50" x2="85" y2="50" />
        </g>
        <!-- Flashing core -->
        <circle cx="50" cy="50" r="15" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="24" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
        <text x="50" y="96" font-family="'Orbitron', sans-serif" font-size="9" font-weight="900" fill="#E040FB" text-anchor="middle" filter="url(#neon-glow-red)">SCATTER</text>
      </svg>
    `
  }
};
