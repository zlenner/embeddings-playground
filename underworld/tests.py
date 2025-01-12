
import json
from functionality import MODELS, get_comparison

TEST_ITEMS = [
    {
        "id": "Golang",
        "color": "",
        "text": "Golang",
    },
    {
        "id": "Python",
        "color": "",
        "text": "Python",
    },
    {
        "id": "Node.js",
        "color": "",
        "text": "Node.js",
    },
    {
        "id": "Go",
        "color": "",
        "text": "Go",
    },
]

def truncate(text: str):
    return ("\n".join(text.split("\n")[:10])) + "\n..."

for model in MODELS:
    print(f"--{model}\n")
    print(
        truncate(json.dumps(get_comparison(model, items=TEST_ITEMS), indent=4))
    )
    print("\n\n")