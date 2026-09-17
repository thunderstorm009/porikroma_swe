import os

PAGES_DIR = "/Users/abrar/project/porikroma/Frontend/Porikroma_SWE/src/pages"
pages = ["BookingPage.jsx", "CreateTripPage.jsx", "PlanOptionsPage.jsx", "TripDetailPage.jsx", "DashboardPage.jsx"]

for page in pages:
    path = os.path.join(PAGES_DIR, page)
    if not os.path.exists(path):
        continue
        
    with open(path, "r") as f:
        content = f.read()
        
    # Replace logout onClick
    content = content.replace("onClick={() => onNavigate('landing')}", "onClick={async () => { await logout(); onNavigate('auth', 'login'); }}")
    
    with open(path, "w") as f:
        f.write(content)
