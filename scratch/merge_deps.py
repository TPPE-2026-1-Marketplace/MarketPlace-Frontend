import json
import os

with open("/home/yzabella/estudos/unb/tppe/DK Fashion (cópia)/package.json", "r") as f:
    dk = json.load(f)

with open("/home/yzabella/estudos/unb/tppe/MarketPlace-Frontend/package.json", "r") as f:
    mp = json.load(f)

if "dependencies" not in mp:
    mp["dependencies"] = {}

for k, v in dk.get("dependencies", {}).items():
    if k not in mp["dependencies"] and k not in ["react", "react-dom"]: # Keep existing react version
        mp["dependencies"][k] = v

with open("/home/yzabella/estudos/unb/tppe/MarketPlace-Frontend/package.json", "w") as f:
    json.dump(mp, f, indent=2)

