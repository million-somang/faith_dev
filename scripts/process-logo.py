import os
from PIL import Image

src_path = r'C:/Users/USER/.gemini/antigravity/brain/528b371c-eaf6-496d-8a08-2a8caae77a92/.user_uploaded/media_1787726703286.png'
base_dir = r'C:/project/faithportal'

# Load image
img = Image.open(src_path).convert('RGBA')
w, h = img.size

# Square canvas size
max_dim = max(w, h)
square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
offset_x = (max_dim - w) // 2
offset_y = (max_dim - h) // 2
square_img.paste(img, (offset_x, offset_y), img)

# Destinations
destinations = [
    # Main portal public
    os.path.join(base_dir, 'apps', 'main-portal', 'public'),
    # Root public
    os.path.join(base_dir, 'public'),
    # Mini apps public
    os.path.join(base_dir, 'apps', 'app-novel', 'public'),
    os.path.join(base_dir, 'apps', 'app-calculator', 'public'),
    os.path.join(base_dir, 'apps', 'app-freecell', 'public'),
    os.path.join(base_dir, 'apps', 'app-tetris', 'public'),
    os.path.join(base_dir, 'apps', 'app-sudoku', 'public'),
    os.path.join(base_dir, 'apps', 'app-2048', 'public'),
    os.path.join(base_dir, 'apps', 'app-minesweeper', 'public'),
    os.path.join(base_dir, 'apps', 'app-news', 'public'),
]

for d in destinations:
    if not os.path.exists(d):
        continue
    
    # 1. logo.png (Original Square)
    square_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(d, 'logo.png'), 'PNG')
    # 2. logo-512.png
    square_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(d, 'logo-512.png'), 'PNG')
    # 3. logo-192.png
    square_img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(d, 'logo-192.png'), 'PNG')
    # 4. favicon.ico
    square_img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(d, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64)])
    # 5. favicon.png
    square_img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(d, 'favicon.png'), 'PNG')
    print(f'[SUCCESS] Processed logo assets for: {d}')

print('All logo processing completed successfully!')
