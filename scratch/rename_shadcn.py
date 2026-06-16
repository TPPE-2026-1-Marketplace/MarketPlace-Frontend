import os
import re

ui_dir = "src/components/ui"
pages_dirs = ["src/pages/manager", "src/pages/pos", "src/pages/ModuleSelection.tsx"]

renames = {
    "badge.tsx": "shadcn-badge.tsx",
    "button.tsx": "shadcn-button.tsx",
    "input.tsx": "shadcn-input.tsx",
    "pagination.tsx": "shadcn-pagination.tsx",
}

for old, new in renames.items():
    old_path = os.path.join(ui_dir, old)
    new_path = os.path.join(ui_dir, new)
    if os.path.exists(old_path):
        os.rename(old_path, new_path)

def update_imports(file_path):
    if not os.path.exists(file_path):
        return
    with open(file_path, "r") as f:
        content = f.read()
    
    original = content
    # Replace relative imports like "./button" or "../../components/ui/button"
    content = re.sub(r'from\s+([\'"])(.*?)button([\'"])', r'from \1\2shadcn-button\3', content)
    content = re.sub(r'from\s+([\'"])(.*?)badge([\'"])', r'from \1\2shadcn-badge\3', content)
    content = re.sub(r'from\s+([\'"])(.*?)input([\'"])', r'from \1\2shadcn-input\3', content)
    content = re.sub(r'from\s+([\'"])(.*?)pagination([\'"])', r'from \1\2shadcn-pagination\3', content)

    if content != original:
        with open(file_path, "w") as f:
            f.write(content)

# Update all UI components
for f in os.listdir(ui_dir):
    if f.endswith(".tsx") or f.endswith(".ts"):
        update_imports(os.path.join(ui_dir, f))

# Update manager and pos
for d in ["src/pages/manager", "src/pages/pos"]:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith(".tsx"):
                update_imports(os.path.join(d, f))

update_imports("src/pages/ModuleSelection.tsx")

