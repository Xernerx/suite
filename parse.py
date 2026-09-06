import json
import re
import urllib.parse
with open('C:/Users/Dummi/.gemini/antigravity/brain/89bb96d7-0f76-41c0-b18f-53e15f531286/.system_generated/steps/19955/content.md', 'r', encoding='utf-8') as f:
    text = f.read()
for match in re.finditer(r'\[\\"([^\\"]{50,})\\"\]', text):
    s = match.group(1)
    if 'xernerx' in s.lower() or 'discord' in s.lower() or 'fix' in s.lower():
        if '<svg' not in s and 'http' not in s:
            print(s)
            print('---')
