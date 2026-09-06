const fs = require('fs');

const engPath = 'packages/lib/src/dictionaries/en-GB.json';
const ruPath = 'packages/lib/src/dictionaries/ru.json';

const engDict = JSON.parse(fs.readFileSync(engPath, 'utf8'));
const ruDict = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

const valuationKeys = {
	title: 'Bot Valuation',
	card: {
		title: 'How is the Estimated Value calculated?',
		description1:
			'The <strong>Estimated Value</strong> metric displayed on bot profiles is a purely statistical estimation of a bot\'s "Audience & Reach Value". It is explicitly designed to gamify audience reach and measure the scale of a bot\'s attention economy.',
		disclaimer: "⚠️ Disclaimer: This valuation does NOT track, represent, or account for any actual financial income, subscription revenue, or server hosting expenses on the developer's end.",
		description2: 'The formula combines a static baseline and a dynamic growth velocity multiplier:',
		baseline: '<strong>Baseline:</strong> Calculated by assigning a flat baseline weight to current active servers and users.',
		multiplier:
			"<strong>Momentum Multiplier:</strong> We compare current baseline metrics against the bot's baseline 30 days prior. Rapidly growing bots receive a premium multiplier (up to 3.0x), while bots actively bleeding users receive a penalty discount.",
	},
};

if (!engDict.faq) engDict.faq = {};
engDict.faq.valuation = valuationKeys;
ruDict.faq.valuation = {
	title: 'Оценка Бота',
	card: {
		title: 'Как рассчитывается Оценочная Стоимость?',
		description1:
			'Метрика <strong>Оценочная Стоимость</strong>, отображаемая в профилях ботов, является чисто статистической оценкой «Ценности Аудитории и Охвата» бота. Она разработана для геймификации охвата аудитории и измерения масштаба экономики внимания бота.',
		disclaimer:
			'⚠️ Отказ от ответственности: Эта оценка НЕ отслеживает, не представляет и не учитывает какой-либо реальный финансовый доход, выручку от подписок или расходы на хостинг серверов со стороны разработчика.',
		description2: 'Формула сочетает в себе статическую базу и динамический множитель скорости роста:',
		baseline: '<strong>База:</strong> Рассчитывается путем присвоения фиксированного базового веса текущим активным серверам и пользователям.',
		multiplier:
			'<strong>Множитель Импульса:</strong> Мы сравниваем текущие базовые метрики с базой бота 30 дней назад. Быстрорастущие боты получают премиальный множитель (до 3.0x), в то время как боты, активно теряющие пользователей, получают штрафную скидку.',
	},
};

fs.writeFileSync(engPath, JSON.stringify(engDict, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ruDict, null, 2));
