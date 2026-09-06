const fs = require('fs');
const engPath = 'packages/lib/src/dictionaries/en-GB.json';
const ruPath = 'packages/lib/src/dictionaries/ru.json';

const engDict = JSON.parse(fs.readFileSync(engPath, 'utf8'));
const ruDict = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

engDict.faq.valuation.title = 'Bots';
ruDict.faq.valuation.title = 'Боты';

fs.writeFileSync(engPath, JSON.stringify(engDict, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ruDict, null, 2));
