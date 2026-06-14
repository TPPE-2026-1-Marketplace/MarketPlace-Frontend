import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Imports
    content = re.sub(r'import Link from ["\']next/link["\'];?', 'import { Link } from "react-router-dom";', content)
    content = re.sub(r'import \{ useRouter \} from ["\']next/navigation["\'];?', 'import { useNavigate } from "react-router-dom";', content)
    content = re.sub(r'import \{ useSearchParams \} from ["\']next/navigation["\'];?', 'import { useSearchParams } from "react-router-dom";', content)
    content = re.sub(r'import \{ useRouter, useSearchParams \} from ["\']next/navigation["\'];?', 'import { useNavigate, useSearchParams } from "react-router-dom";', content)
    content = re.sub(r'import \{ useParams, useRouter \} from ["\']next/navigation["\'];?', 'import { useParams, useNavigate } from "react-router-dom";', content)
    content = re.sub(r'import Image from ["\']next/image["\'];?\n', '', content)
    
    # Hooks
    content = content.replace('const router = useRouter();', 'const navigate = useNavigate();')
    content = content.replace('router.push(', 'navigate(')
    content = content.replace('router.back(', 'navigate(-1')

    # Images
    # <Image src={...} alt={...} fill className="..." /> -> <img src={...} alt={...} className="..." />
    # We will just replace <Image with <img and remove width, height, fill attributes in a generic way, but it's risky with regex.
    # A simple regex for <Image to <img and closing tags:
    content = content.replace('<Image', '<img')
    content = content.replace('</Image>', '</img>')
    # Remove fill attribute
    content = re.sub(r'\bfill\s*=?\s*(\{true\}|"true")?', '', content)

    # Next page specific "use client"
    content = content.replace('"use client";\n', '')
    content = content.replace("'use client';\n", '')

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
