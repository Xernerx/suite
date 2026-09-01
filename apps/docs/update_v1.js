const fs = require('fs');

const path = 'd:/Xernerx Studios/suite/apps/docs/src/app/api/[version]/V1Endpoints.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('import { useDictionary }')) {
	content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { useDictionary } from '@xernerx/providers';");
}

// Add hook
if (!content.includes('const { t } = useDictionary();')) {
	content = content.replace('export function V1Endpoints() {\n    return (', 'export function V1Endpoints() {\n    const { t } = useDictionary();\n    return (');
}

// Replace titles and descriptions
const replacements = [
	["title: 'Fetch Bot Profile'", "title: t('docs.api.v1.endpoints.fetchBotProfile.title')"],
	["description: 'Retrieve public or private profile metadata for a specific Discord bot.'", "description: t('docs.api.v1.endpoints.fetchBotProfile.description')"],
	['<Lock size={16} /> Privacy & Ownership Scope', "<Lock size={16} /> {t('docs.api.v1.endpoints.fetchBotProfile.privacyScope')}"],
	[
		"If the requested bot profile is set to <code>private</code>, this endpoint will return a 403 Forbidden error unless the authenticated token belongs to\n\t\t\t\t\t\t\t\t\t\t\t\tan owner of the bot. If the token is owned by the bot developer, the response will additionally include sensitive properties such as configured{' '}\n\t\t\t\t\t\t\t\t\t\t\t\t<code>hooks</code> and full arrays of user votes.",
		"If the requested bot profile is set to <code>private</code>, this endpoint will return a 403 Forbidden error unless the authenticated token belongs to an owner of the bot. If the token is owned by the bot developer, the response will additionally include sensitive properties such as configured{' '}<code>hooks</code> and full arrays of user votes.",
	],
	// Wait, the new line format in the JSX string above might be tricky to replace directly. Let's use regex.
];

// Let's do simple string replacements for the easy ones
content = content.replace("title: 'Fetch Bot Profile'", "title: t('docs.api.v1.endpoints.fetchBotProfile.title')");
content = content.replace("description: 'Retrieve public or private profile metadata for a specific Discord bot.'", "description: t('docs.api.v1.endpoints.fetchBotProfile.description')");
content = content.replace('Privacy & Ownership Scope', "{t('docs.api.v1.endpoints.fetchBotProfile.privacyScope')}");

// We can replace the paragraphs with dangerouslySetInnerHTML or just split the tags out.
// Actually, since I put the HTML tags in the translation like `<code>hooks</code>`, I'll use dangerouslySetInnerHTML for the paragraphs with HTML, OR I can just map the inner text. Wait, the prompt said "(You don't need to translate the code blocks or `code` tags, just the UI text)".
// Let's replace the whole <p> content.
content = content.replace(
	/<p className="text-sm text-\(--text-muted\)">\s*If the requested bot profile is set to <code>private<\/code>[\s\S]*?<\/p>/m,
	`<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.fetchBotProfile.privacyDesc') }}></p>`
);

content = content.replace("title: 'Update Bot Profile'", "title: t('docs.api.v1.endpoints.updateBotProfile.title')");
content = content.replace('description: "Update specific fields of your bot\'s profile programmatically."', "description: t('docs.api.v1.endpoints.updateBotProfile.description')");
content = content.replace('A short summary of what the bot does (usually used in cards).', "{t('docs.api.v1.endpoints.updateBotProfile.descField')}");
content = content.replace("A detailed markdown description for the bot's full profile page.", "{t('docs.api.v1.endpoints.updateBotProfile.infoField')}");
content = content.replace(
	/<td className="py-3 text-\(--text-muted\)">\s*Visibility scope\. Allowed values: <code>public<\/code>, <code>private<\/code>, <code>limited<\/code>\.\s*<\/td>/m,
	`<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.updateBotProfile.privacyField') }}></td>`
);
content = content.replace('An array of string categories that apply to the bot.', "{t('docs.api.v1.endpoints.updateBotProfile.tagsField')}");
content = content.replace(
	/<td className="py-3 text-\(--text-muted\)">\s*An object containing URLs like <code>invite<\/code>, <code>support<\/code>, or <code>website<\/code>\.\s*<\/td>/m,
	`<td className="py-3 text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.updateBotProfile.linksField') }}></td>`
);

content = content.replace("title: 'Delete Bot Profile'", "title: t('docs.api.v1.endpoints.deleteBotProfile.title')");
content = content.replace('description: "Permanently delete your bot\'s profile from the platform ecosystem."', "description: t('docs.api.v1.endpoints.deleteBotProfile.description')");

content = content.replace("title: 'Fetch Bot Stats'", "title: t('docs.api.v1.endpoints.fetchBotStats.title')");
content = content.replace("description: 'Retrieve the statistical history of a specific Discord bot.'", "description: t('docs.api.v1.endpoints.fetchBotStats.description')");

content = content.replace("title: 'Post Bot Stats'", "title: t('docs.api.v1.endpoints.postBotStats.title')");
content = content.replace("description: 'Log a new statistical snapshot for a Discord bot.'", "description: t('docs.api.v1.endpoints.postBotStats.description')");
content = content.replace('Node.js Package Available', "{t('docs.api.v1.endpoints.postBotStats.nodePackage')}");
content = content.replace(
	/<p className="text-sm text-\(--text-muted\)">\s*If you are using Node\.js, you can easily automate your statistics posting using the official <code>@xernerx\/stats<\/code> package without needing to\s*write manual fetch requests\.\s*<\/p>/m,
	`<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.postBotStats.nodePackageDesc') }}></p>`
);

content = content.replace("title: 'Update Bot Stats'", "title: t('docs.api.v1.endpoints.updateBotStats.title')");
content = content.replace("description: 'Update a previously logged statistical snapshot.'", "description: t('docs.api.v1.endpoints.updateBotStats.description')");

content = content.replace("title: 'Delete Bot Stats'", "title: t('docs.api.v1.endpoints.deleteBotStats.title')");
content = content.replace("description: 'Delete all statistical snapshots for a Discord bot.'", "description: t('docs.api.v1.endpoints.deleteBotStats.description')");

content = content.replace("title: 'Fetch Bot Commands'", "title: t('docs.api.v1.endpoints.fetchBotCommands.title')");
content = content.replace("description: 'Retrieve your synced Discord application slash commands.'", "description: t('docs.api.v1.endpoints.fetchBotCommands.description')");

content = content.replace("title: 'Sync Bot Commands'", "title: t('docs.api.v1.endpoints.syncBotCommands.title')");
content = content.replace("description: 'Bulk synchronize your Discord application slash commands.'", "description: t('docs.api.v1.endpoints.syncBotCommands.description')");
content = content.replace('Bulk Synchronization', "{t('docs.api.v1.endpoints.syncBotCommands.bulkSync')}");
content = content.replace(
	/<p className="text-sm text-\(--text-muted\)">\s*The <code>PUT<\/code> endpoint expects a full array of your Discord application commands\. It performs a complete sync by wiping your previously stored\s*commands and bulk-inserting the new array\. This is best called during your bot's startup sequence\.\s*<\/p>/m,
	`<p className="text-sm text-(--text-muted)" dangerouslySetInnerHTML={{ __html: t('docs.api.v1.endpoints.syncBotCommands.bulkSyncDesc') }}></p>`
);

content = content.replace("title: 'Delete Bot Commands'", "title: t('docs.api.v1.endpoints.deleteBotCommands.title')");
content = content.replace("description: 'Wipe all synchronized commands for a Discord bot.'", "description: t('docs.api.v1.endpoints.deleteBotCommands.description')");

content = content.replaceAll('Fetch Examples', "{t('docs.api.v1.common.fetchExamples')}");
content = content.replaceAll('JSON Body Parameters', "{t('docs.api.v1.common.jsonBodyParameters')}");
content = content.replaceAll('>Field<', ">{t('docs.api.v1.common.field')}<");
content = content.replaceAll('>Type<', ">{t('docs.api.v1.common.type')}<");
content = content.replaceAll('>Description<', ">{t('docs.api.v1.common.description')}<");

content = content.replaceAll('The number of servers the bot is in (alias for guildCount).', "{t('docs.api.v1.common.serverCountDesc')}");
content = content.replaceAll('The number of active shards.', "{t('docs.api.v1.common.shardCountDesc')}");
content = content.replaceAll('The estimated total number of users across all guilds.', "{t('docs.api.v1.common.userCountDesc')}");

fs.writeFileSync(path, content);
console.log('V1Endpoints.tsx updated!');
