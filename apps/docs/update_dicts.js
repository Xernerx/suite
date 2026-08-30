const fs = require('fs');

const enGBPath = 'd:/Xernerx Studios/suite/packages/lib/src/dictionaries/en-GB.json';
const ruPath = 'd:/Xernerx Studios/suite/packages/lib/src/dictionaries/ru.json';

const enGB = JSON.parse(fs.readFileSync(enGBPath, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

if (!enGB.docs) enGB.docs = {};
if (!enGB.docs.api) enGB.docs.api = {};
if (!ru.docs) ru.docs = {};
if (!ru.docs.api) ru.docs.api = {};

// V1
const v1En = {
	endpoints: {
		fetchBotProfile: {
			title: 'Fetch Bot Profile',
			description: 'Retrieve public or private profile metadata for a specific Discord bot.',
			privacyScope: 'Privacy & Ownership Scope',
			privacyDesc:
				"If the requested bot profile is set to <code>private</code>, this endpoint will return a 403 Forbidden error unless the authenticated token belongs to an owner of the bot. If the token is owned by the bot developer, the response will additionally include sensitive properties such as configured{' '}<code>hooks</code> and full arrays of user votes.",
		},
		updateBotProfile: {
			title: 'Update Bot Profile',
			description: "Update specific fields of your bot's profile programmatically.",
			descField: 'A short summary of what the bot does (usually used in cards).',
			infoField: "A detailed markdown description for the bot's full profile page.",
			privacyField: 'Visibility scope. Allowed values: <code>public</code>, <code>private</code>, <code>limited</code>.',
			tagsField: 'An array of string categories that apply to the bot.',
			linksField: 'An object containing URLs like <code>invite</code>, <code>support</code>, or <code>website</code>.',
		},
		deleteBotProfile: {
			title: 'Delete Bot Profile',
			description: "Permanently delete your bot's profile from the platform ecosystem.",
		},
		fetchBotStats: {
			title: 'Fetch Bot Stats',
			description: 'Retrieve the statistical history of a specific Discord bot.',
		},
		postBotStats: {
			title: 'Post Bot Stats',
			description: 'Log a new statistical snapshot for a Discord bot.',
			nodePackage: 'Node.js Package Available',
			nodePackageDesc:
				'If you are using Node.js, you can easily automate your statistics posting using the official <code>@xernerx/stats</code> package without needing to write manual fetch requests.',
		},
		updateBotStats: {
			title: 'Update Bot Stats',
			description: 'Update a previously logged statistical snapshot.',
		},
		deleteBotStats: {
			title: 'Delete Bot Stats',
			description: 'Delete all statistical snapshots for a Discord bot.',
		},
		fetchBotCommands: {
			title: 'Fetch Bot Commands',
			description: 'Retrieve your synced Discord application slash commands.',
		},
		syncBotCommands: {
			title: 'Sync Bot Commands',
			description: 'Bulk synchronize your Discord application slash commands.',
			bulkSync: 'Bulk Synchronization',
			bulkSyncDesc:
				"The <code>PUT</code> endpoint expects a full array of your Discord application commands. It performs a complete sync by wiping your previously stored commands and bulk-inserting the new array. This is best called during your bot's startup sequence.",
		},
		deleteBotCommands: {
			title: 'Delete Bot Commands',
			description: 'Wipe all synchronized commands for a Discord bot.',
		},
	},
	common: {
		fetchExamples: 'Fetch Examples',
		jsonBodyParameters: 'JSON Body Parameters',
		field: 'Field',
		type: 'Type',
		description: 'Description',
		serverCountDesc: 'The number of servers the bot is in (alias for guildCount).',
		shardCountDesc: 'The number of active shards.',
		userCountDesc: 'The estimated total number of users across all guilds.',
	},
};

const v1Ru = {
	endpoints: {
		fetchBotProfile: {
			title: 'Получить профиль бота',
			description: 'Получите публичные или приватные метаданные профиля для определенного бота Discord.',
			privacyScope: 'Область конфиденциальности и владения',
			privacyDesc:
				"Если запрошенный профиль бота установлен как <code>private</code>, эта конечная точка вернет ошибку 403 Forbidden, если аутентифицированный токен не принадлежит владельцу бота. Если токен принадлежит разработчику бота, ответ будет дополнительно включать конфиденциальные свойства, такие как настроенные{' '}<code>hooks</code> и полные массивы голосов пользователей.",
		},
		updateBotProfile: {
			title: 'Обновить профиль бота',
			description: 'Программно обновите определенные поля профиля вашего бота.',
			descField: 'Краткое описание того, что делает бот (обычно используется в карточках).',
			infoField: 'Подробное описание в формате markdown для полной страницы профиля бота.',
			privacyField: 'Область видимости. Допустимые значения: <code>public</code>, <code>private</code>, <code>limited</code>.',
			tagsField: 'Массив строковых категорий, которые применяются к боту.',
			linksField: 'Объект, содержащий URL-адреса, такие как <code>invite</code>, <code>support</code> или <code>website</code>.',
		},
		deleteBotProfile: {
			title: 'Удалить профиль бота',
			description: 'Навсегда удалите профиль вашего бота из экосистемы платформы.',
		},
		fetchBotStats: {
			title: 'Получить статистику бота',
			description: 'Получить статистическую историю определенного бота Discord.',
		},
		postBotStats: {
			title: 'Отправить статистику бота',
			description: 'Зарегистрировать новый статистический снимок для бота Discord.',
			nodePackage: 'Доступен пакет Node.js',
			nodePackageDesc:
				'Если вы используете Node.js, вы можете легко автоматизировать отправку статистики, используя официальный пакет <code>@xernerx/stats</code>, без необходимости писать ручные запросы.',
		},
		updateBotStats: {
			title: 'Обновить статистику бота',
			description: 'Обновить ранее зарегистрированный статистический снимок.',
		},
		deleteBotStats: {
			title: 'Удалить статистику бота',
			description: 'Удалить все статистические снимки для бота Discord.',
		},
		fetchBotCommands: {
			title: 'Получить команды бота',
			description: 'Получите синхронизированные команды приложения Discord (slash-команды).',
		},
		syncBotCommands: {
			title: 'Синхронизировать команды бота',
			description: 'Массовая синхронизация команд приложения Discord (slash-команд).',
			bulkSync: 'Массовая синхронизация',
			bulkSyncDesc:
				'Конечная точка <code>PUT</code> ожидает полный массив ваших команд приложения Discord. Она выполняет полную синхронизацию, удаляя ваши ранее сохраненные команды и массово вставляя новый массив. Это лучше всего вызывать во время последовательности запуска вашего бота.',
		},
		deleteBotCommands: {
			title: 'Удалить команды бота',
			description: 'Удалить все синхронизированные команды для бота Discord.',
		},
	},
	common: {
		fetchExamples: 'Примеры Fetch',
		jsonBodyParameters: 'Параметры тела JSON',
		field: 'Поле',
		type: 'Тип',
		description: 'Описание',
		serverCountDesc: 'Количество серверов, на которых находится бот (псевдоним для guildCount).',
		shardCountDesc: 'Количество активных шардов.',
		userCountDesc: 'Оценочное общее количество пользователей на всех серверах.',
	},
};

// Core
const coreEn = {
	fetchDiscordProfile: { title: 'Fetch Discord Profile', description: "Fetch a user's Discord profile metadata directly from the Xernerx core caching layer." },
	fetchDiscordGuilds: { title: 'Fetch Discord Guilds', description: 'Retrieve a list of Discord guilds that a user is currently a member of.' },
	fetchDiscordGuild: { title: 'Fetch Discord Guild', description: "Fetch a specific Discord guild's metadata directly from the Xernerx core caching layer." },
	fetchDiscordRoles: { title: 'Fetch Discord Roles', description: 'Retrieve all available Discord roles within a specific guild.' },
};
const coreRu = {
	fetchDiscordProfile: { title: 'Получить профиль Discord', description: 'Получите метаданные профиля пользователя Discord напрямую из базового уровня кэширования Xernerx.' },
	fetchDiscordGuilds: { title: 'Получить гильдии Discord', description: 'Получить список гильдий Discord, в которых в данный момент состоит пользователь.' },
	fetchDiscordGuild: { title: 'Получить гильдию Discord', description: 'Получите метаданные определенной гильдии Discord напрямую из базового уровня кэширования Xernerx.' },
	fetchDiscordRoles: { title: 'Получить роли Discord', description: 'Получить все доступные роли Discord в определенной гильдии.' },
};

// Secure
const secureEn = {
	manageUsers: { title: 'Manage Users', description: 'Manage users on the platform.' },
	manageTokens: { title: 'Manage Tokens', description: 'List, create, update, or delete API tokens.' },
	manageRoles: { title: 'Manage Roles', description: 'Create, edit, and delete system roles and permissions.' },
	manageInvites: { title: 'Manage Invites', description: 'Configure public Discord bot invite URLs.' },
	manageAnnouncements: { title: 'Manage Announcements', description: 'Create, edit, and publish platform announcements.' },
	manageTranslations: { title: 'Manage Translations', description: 'Add and modify system-wide translations.' },
	manageApplications: { title: 'Manage Applications', description: 'Create, edit, and review user applications.' },
	systemSettings: { title: 'System Settings', description: 'Manage global system configurations and core settings.' },
};
const secureRu = {
	manageUsers: { title: 'Управление пользователями', description: 'Управление пользователями на платформе.' },
	manageTokens: { title: 'Управление токенами', description: 'Список, создание, обновление или удаление токенов API.' },
	manageRoles: { title: 'Управление ролями', description: 'Создание, редактирование и удаление системных ролей и разрешений.' },
	manageInvites: { title: 'Управление приглашениями', description: 'Настройка публичных URL-адресов для приглашения ботов Discord.' },
	manageAnnouncements: { title: 'Управление объявлениями', description: 'Создание, редактирование и публикация объявлений платформы.' },
	manageTranslations: { title: 'Управление переводами', description: 'Добавление и изменение системных переводов.' },
	manageApplications: { title: 'Управление приложениями', description: 'Создание, редактирование и проверка пользовательских заявок.' },
	systemSettings: { title: 'Системные настройки', description: 'Управление глобальными конфигурациями системы и основными настройками.' },
};

enGB.docs.api.v1 = v1En;
enGB.docs.api.core = coreEn;
enGB.docs.api.secure = secureEn;

ru.docs.api.v1 = v1Ru;
ru.docs.api.core = coreRu;
ru.docs.api.secure = secureRu;

fs.writeFileSync(enGBPath, JSON.stringify(enGB, null, 2));
fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2));
console.log('Dictionaries updated!');
