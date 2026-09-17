import os
import glob

PAGES_DIR = "/Users/abrar/project/porikroma/Frontend/Porikroma_SWE/src/pages"

pages = ["BookingPage.jsx", "CreateTripPage.jsx", "PlanOptionsPage.jsx", "TripDetailPage.jsx", "AuthorTourPlanPage.jsx", "DashboardPage.jsx"]

for page in pages:
    path = os.path.join(PAGES_DIR, page)
    if not os.path.exists(path):
        continue
        
    with open(path, "r") as f:
        content = f.read()
        
    # Check if useAuth is imported
    if "useAuth" not in content and "AuthContext" not in content:
        # Add import
        content = content.replace("import LogoIcon from '../components/LogoIcon';", "import LogoIcon from '../components/LogoIcon';\nimport { useAuth } from '../contexts/AuthContext';")
        
        # Add destructuring
        if "export default function " in content:
            # Find the component definition
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith("export default function"):
                    # Insert right after
                    lines.insert(i+1, "  const { user, profile, logout } = useAuth();")
                    break
            content = '\n'.join(lines)
            
    # Replace Sarah Jenkins
    content = content.replace('<span className="text-sm font-bold text-navy block truncate">Sarah Jenkins</span>', '<span className="text-sm font-bold text-navy block truncate">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split(\'@\')[0] || \'Traveler\'}</span>')
    
    # Replace initial SJ
    content = content.replace('>\n              SJ\n            </div>', '>\n              {(profile?.full_name || user?.user_metadata?.full_name || user?.email || \'T\')[0].toUpperCase()}\n            </div>')
    
    # Check if AuthorTourPlanPage
    if page == "AuthorTourPlanPage.jsx":
        content = content.replace('travelerName: "Sarah Jenkins"', 'travelerName: profile?.full_name || "Traveler"')
        content = content.replace("{activeTrip.travelerName || 'Sarah Jenkins'}", "{activeTrip.travelerName || profile?.full_name || 'Traveler'}")
        
    with open(path, "w") as f:
        f.write(content)

