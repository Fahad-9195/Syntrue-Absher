"""
Simple icon generator for PWA
Creates basic icons with security shield design
"""

def create_svg_icon(size):
    """Create an SVG icon with a shield design"""
    svg = f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" fill="#020617"/>
  <path d="M{size*0.5} {size*0.2} L{size*0.8} {size*0.35} L{size*0.8} {size*0.65} Q{size*0.8} {size*0.85} {size*0.5} {size*0.9} Q{size*0.2} {size*0.85} {size*0.2} {size*0.65} L{size*0.2} {size*0.35} Z" fill="url(#grad)" stroke="#38bdf8" stroke-width="{size*0.02}"/>
  <text x="{size*0.5}" y="{size*0.65}" text-anchor="middle" fill="#020617" font-family="Arial" font-size="{size*0.4}" font-weight="bold">🔒</text>
</svg>'''
    return svg

# Create icons directory
import os
icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(icons_dir, exist_ok=True)

# Generate icons
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    svg_content = create_svg_icon(size)
    svg_path = os.path.join(icons_dir, f'icon-{size}x{size}.svg')
    
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f'✅ Created icon-{size}x{size}.svg')

# Try to convert to PNG if PIL is available
try:
    from PIL import Image
    import cairosvg
    
    for size in sizes:
        svg_path = os.path.join(icons_dir, f'icon-{size}x{size}.svg')
        png_path = os.path.join(icons_dir, f'icon-{size}x{size}.png')
        
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        print(f'✅ Created icon-{size}x{size}.png')
        
except ImportError:
    print('\n⚠️  PIL/cairosvg not available. SVG icons created only.')
    print('To create PNG icons, run: pip install pillow cairosvg')

print('\n✅ Icon generation complete!')
print(f'📁 Icons saved to: {icons_dir}')
