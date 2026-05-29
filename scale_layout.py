import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will look for lines containing specific properties, and replace \d+px with clamp
    props = r'(padding|margin|width|max-width|min-width|height|max-height|min-height|gap|top|bottom|left|right|flex|flex-basis)'
    
    def repl_prop(match):
        prop = match.group(1)
        val_str = match.group(2)
        if 'clamp' in val_str:
            return match.group(0)
            
        def repl_px(m):
            val = int(m.group(1))
            if val == 0: return m.group(0)
            if val < 5: return m.group(0) # keep small things static
            v_vw = round(val * 0.1, 2)
            v_max = round(val * 1.5)
            return f"clamp({val}px, {v_vw}vw, {v_max}px)"
            
        # Match only positive px values
        new_val = re.sub(r'(?<!-)\b(\d+)px\b', repl_px, val_str)
        return f"{prop}: {new_val};"

    # Match property: value;
    # Using negative lookbehind or simple matching
    pattern = r'\b(' + props + r')\s*:\s*([^;]+);'
    content = re.sub(pattern, repl_prop, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

for f in ['style.css', 'index.html', 'main.js']:
    process_file(f)
print("Layout scaling complete.")
