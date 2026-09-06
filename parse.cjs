const fs = require('fs');
const html = fs.readFileSync('C:/Users/Dummi/.gemini/antigravity/brain/89bb96d7-0f76-41c0-b18f-53e15f531286/.system_generated/steps/19955/content.md', 'utf-8');

// strip all html tags
let text = html.replace(/<[^>]+>/g, ' ');
// decode html entities
text = text
	.replace(/&quot;/g, '"')
	.replace(/&amp;/g, '&')
	.replace(/&#39;/g, "'")
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>');

console.log(text.substring(0, 5000));
