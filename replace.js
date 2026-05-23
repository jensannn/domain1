const fs = require('fs');
const path = require('path');

const files = ['style.css', 'main.js', 'index.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    if (file === 'style.css') {
        content = content.replace(/:root\s*\{[\s\S]*?\}/, `:root {
  --bg:        #F5F5DC;
  --bg2:       #FFFDD0;
  --bg3:       #FAF9F6;
  --cyan:      #6D92A0;
  --cyan-dim:  #4A6B78;
  --pink:      #C8A2C8;
  --pink-dim:  #A380A3;
  --orange:    #B38B6D;
  --orange-dim:#8A654C;
  --red:       #C292A1;
  --red-dim:   #9C6C7B;
  --gold:      #A8A5A6;
  --green:     #9DC183;
  --lime:      #A2E4B8;
  --purple:    #CCCCFF;
  --blue:      #8CBED6;
  --white:     #2D2A26;
  --white-dim: #605C5A;
  --gray:      #A8A5A6;
  --font-pixel: 'Press Start 2P', monospace;
  --font-mono:  'Share Tech Mono', monospace;
}`);
    }

    // Replace harsh whites in text
    content = content.replace(/color:\s*#FFF(?:FFF)?;/gi, 'color: var(--white);');
    content = content.replace(/color:\s*#fff(?:fff)?;/gi, 'color: var(--white);');

    // Hardcoded Neon Gradients
    content = content.replace(/linear-gradient\(135deg,#FF3FFF,#FF8C00,#FFD700,#39FF14,#00F5FF,#4488FF,#BB00FF,#FF3FFF\)/g, 'linear-gradient(135deg, var(--blue), var(--lime), var(--pink), var(--cyan))');
    content = content.replace(/linear-gradient\(90deg,#FF3FFF,#FF8C00,#FFD700,#39FF14,#00F5FF,#4488FF,#BB00FF,#FF3FFF\)/g, 'linear-gradient(90deg, var(--blue), var(--lime), var(--pink), var(--cyan))');
    
    // Other gradients using hardcoded neon
    content = content.replace(/rgba\(18,\s*10,\s*43/g, 'rgba(45,42,38'); 
    content = content.replace(/rgba\(12,\s*6,\s*28/g, 'rgba(30,28,25'); 
    content = content.replace(/rgba\(153,\s*0,\s*230/g, 'rgba(200,162,200'); 
    content = content.replace(/rgba\(230,\s*0,\s*153/g, 'rgba(200,162,200'); 
    content = content.replace(/rgba\(0,\s*182,\s*192/g, 'rgba(109,146,160'); 
    content = content.replace(/rgba\(22,\s*115,\s*22/g, 'rgba(157,193,131'); 
    content = content.replace(/rgba\(168,\s*23,\s*23/g, 'rgba(194,146,161'); 
    content = content.replace(/rgba\(30,\s*158,\s*30/g, 'rgba(157,193,131');
    content = content.replace(/rgba\(217,\s*30,\s*30/g, 'rgba(194,146,161');

    // Remove Glowing text-shadows
    content = content.replace(/text-shadow:\s*0\s+0\s+\d+px\s+[^;]+;/gi, 'text-shadow: none;');
    content = content.replace(/text-shadow:\s*0\s+0\s+\d+px\s+[^;]+(;|")/gi, 'text-shadow: none$1');
    
    // Dampen glowing box-shadows (like 0 0 18px var(--cyan) or 0 0 20px var(--pink)22)
    content = content.replace(/0\s+0\s+[1-9]\d*px\s+(var\([^)]+\)(?:[0-9a-fA-F]{2})?|rgba?\([^)]+\)|#[0-9a-fA-F]+)\s*([,;])/gi, '0 2px 4px rgba(0,0,0,0.1)$2');

    // Remove drop-shadow glows in filters
    content = content.replace(/drop-shadow\(0\s+0\s+\d+px\s+rgba?\([^)]+\)\)/gi, 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');
    
    // main.js hardcoded tier badge colors
    if (file === 'main.js') {
        content = content.replace(/'#4a6080'/g, "'#8CBED6'");
        content = content.replace(/'#00aacc'/g, "'#6D92A0'");
        content = content.replace(/'#9900cc'/g, "'#C8A2C8'");
        content = content.replace(/'#FFD700'/g, "'#A8A5A6'");
        content = content.replace(/color:\s*'#fff'/g, "color: '#2D2A26'");
    }

    fs.writeFileSync(file, content, 'utf8');
});
console.log("Colors and shadows updated.");
