/** @format */

import { database } from '@xernerx/lib/server';

const pack = (id: string, name: string, description: string, skuId: string, creditAmount: number, badge: string, isFeatured: boolean, features: string[], order: number) => ({
	id,
	name,
	description,
	categoryId: 'credits',
	skuId,
	itemType: 'credit_pack',
	creditCost: 0,
	creditAmount,
	perkType: 'none',
	perkValue: null,
	durationDays: 0,
	isFeatured,
	badge,
	discountPercent: 0,
	features,
	order,
	enabled: true,
});

const perk = (
	id: string,
	name: string,
	description: string,
	creditCost: number,
	perkType: string,
	perkValue: string | number | null,
	durationDays: number,
	badge: string,
	isFeatured: boolean,
	features: string[],
	order: number
) => ({
	id,
	name,
	description,
	categoryId: 'credits',
	skuId: '',
	itemType: 'credit_perk',
	creditCost,
	creditAmount: 0,
	perkType,
	perkValue,
	durationDays,
	isFeatured,
	badge,
	discountPercent: 0,
	features,
	order,
	enabled: true,
});

const CREDIT_STORE_ITEMS = [
	// Stripe Credit Top-Up Packs
	pack(
		'credits-500',
		'500 Credits Pack',
		'Base pack of 500 ecosystem credits (€5.00 standard tier).',
		'prod_VVSmsiI2diTKyl',
		500,
		'Starter Pack',
		false,
		['500 Instant Ecosystem Credits', 'Redeemable for CDN slots, showcases, trials & badges'],
		0
	),
	pack(
		'credits-1200',
		'1,200 Credits Pack',
		'1,000 base credits + 200 bonus credits (€10.00 value tier).',
		'prod_credits_1200',
		1200,
		'+20% Bonus',
		false,
		['1,200 Instant Ecosystem Credits', 'Includes 200 free bonus credits'],
		1
	),
	pack(
		'credits-3250',
		'3,250 Credits Vault',
		'2,500 base credits + 750 bonus credits (€25.00 popular bundle).',
		'prod_credits_3250',
		3250,
		'+30% Bonus',
		true,
		['3,250 Instant Ecosystem Credits', 'Includes 750 free bonus credits', 'Enough for +3 CDN Slots or a 3-Slot Showcase Pack'],
		2
	),
	pack(
		'credits-7000',
		'7,000 Credits Treasury',
		'5,000 base credits + 2,000 bonus credits (€50.00 maximum value chest).',
		'prod_credits_7000',
		7000,
		'+40% Best Value',
		false,
		['7,000 Instant Ecosystem Credits', 'Includes 2,000 free bonus credits', 'Ideal for High-Spender badges & bulk slot upgrades'],
		3
	),

	// CDN Upload Slots
	perk(
		'perk-cdn-1',
		'+1 CDN Media Slot',
		'Permanently expand your Media Library upload limit by 1 slot.',
		1000,
		'cdn_slots',
		1,
		0,
		'CDN Storage',
		false,
		['+1 Permanent CDN Upload Slot', 'Stacks infinitely on top of your base 10 free slots'],
		10
	),
	perk(
		'perk-cdn-3',
		'+3 CDN Media Slots',
		'Bundle of 3 permanent CDN upload slots at a 500-credit discount.',
		2500,
		'cdn_slots',
		3,
		0,
		'Save 500 Credits',
		true,
		['+3 Permanent CDN Upload Slots', '17% cheaper than buying single slots', 'Stacks with existing storage capacity'],
		11
	),
	perk(
		'perk-cdn-10',
		'+10 CDN Media Slots',
		'Creator pack of 10 permanent CDN upload slots at a 2,500-credit discount.',
		7500,
		'cdn_slots',
		10,
		0,
		'Save 2,500 Credits',
		false,
		['+10 Permanent CDN Upload Slots', '25% bundle discount over individual slots', 'Doubles your base free media quota'],
		12
	),

	// Profile Showcase Slots
	perk(
		'perk-showcase-1',
		'+1 Profile Showcase Slot',
		'Unlock an extra pinned showcase card on your public Xernerx profile.',
		1500,
		'showcase_slots',
		1,
		0,
		'Profile Customization',
		false,
		['+1 Permanent Profile Showcase Slot', 'Feature custom links, projects, or CDN artwork on your profile'],
		20
	),
	perk(
		'perk-showcase-3',
		'+3 Profile Showcase Slots',
		'Unlock 3 additional showcase cards for your public profile at a 1,000-credit discount.',
		3500,
		'showcase_slots',
		3,
		0,
		'Save 1,000 Credits',
		true,
		['+3 Permanent Profile Showcase Slots', '22% bundle discount', 'Curate a full portfolio showcase on app.xernerx.com'],
		21
	),

	// Custom Vanity URLs
	perk(
		'perk-vanity-1',
		'+1 Custom Vanity URL Slot',
		'Unlock a permanent custom vanity URL slug for your User Profile, Bot, Server, or Organization.',
		2000,
		'vanity_url',
		1,
		0,
		'Vanity URL',
		false,
		['+1 Permanent Custom Vanity URL Slot', 'Redeemable on any Profile, Bot, Server, or Organization you own', 'Change your custom slug anytime once unlocked'],
		25
	),
	perk(
		'perk-vanity-3',
		'+3 Custom Vanity URL Slots',
		'Bundle of 3 permanent Custom Vanity URL slots for your profiles, bots, and servers at a 1,000-credit discount.',
		5000,
		'vanity_url',
		3,
		0,
		'Save 1,000 Credits',
		true,
		['+3 Permanent Custom Vanity URL Slots', 'Save 1,000 Credits compared to single slots', 'Use across your User Profile, Bots, Servers & Organizations'],
		26
	),

	// Developer Bot & API Token Slots
	perk(
		'perk-bot-slot-1',
		'+1 Bot & API Token Slot',
		'Permanently expand your Developer API token & bot linking quota by 1 slot on top of your base 1 free bot slot.',
		2500,
		'bot_slots',
		1,
		0,
		'Developer Perk',
		false,
		['+1 Permanent Bot & API Token Slot', 'Stacks infinitely on top of your 1 free bot slot', 'Link an additional Discord bot to the Developer Portal & REST API'],
		27
	),
	perk(
		'perk-bot-slot-3',
		'+3 Bot & API Token Slots',
		'Developer bundle of 3 permanent Bot & API Token slots at a 1,500-credit discount.',
		6000,
		'bot_slots',
		3,
		0,
		'Save 1,500 Credits',
		true,
		['+3 Permanent Bot & API Token Slots', '20% bundle discount over single slots', 'Ideal for multi-bot developers & organizations'],
		28
	),

	// Trial Passes
	perk(
		'perk-trial-virtue-3d',
		'3-Day Virtue Trial Pass',
		'Unlock full Virtue Pass premium features for 72 hours using credits.',
		900,
		'trial_pass',
		'bot-virtue',
		3,
		'72h Trial',
		false,
		['72 hours of full Virtue Pass access', 'No recurring charge — expires automatically'],
		30
	),
	perk(
		'perk-trial-zodiac-3d',
		'3-Day Zodiac Trial Pass',
		'Unlock full Zodiac Pass premium features for 72 hours using credits.',
		900,
		'trial_pass',
		'bot-zodiac',
		3,
		'72h Trial',
		false,
		['72 hours of full Zodiac Pass access', 'No recurring charge — expires automatically'],
		31
	),
	perk(
		'perk-trial-ultra-3d',
		'3-Day Ultra Ecosystem Trial',
		'Experience the complete Ultra Ecosystem bundle and 1,000 CDN slots for 3 days.',
		2000,
		'trial_pass',
		'ultra',
		3,
		'All-Access Trial',
		true,
		['72 hours of Ultra Ecosystem access', 'Includes all consumer bots & 1,000 CDN upload quota during trial'],
		32
	),
	perk(
		'perk-trial-ultra-7d',
		'7-Day Ultra Ecosystem Trial',
		'Unlock a full week of Ultra Ecosystem access with your credits.',
		4000,
		'trial_pass',
		'ultra',
		7,
		'7-Day Pass',
		false,
		['7 full days of Ultra Ecosystem access', 'Extendable anytime with additional credits'],
		33
	),

	// Streak Protection & Gamification Perks
	perk(
		'perk-streak-shield',
		'Daily Streak Shield',
		'Protect your daily credit streak from resetting if you ever miss the 48-hour claim grace window. Stackable up to 3 shields.',
		500,
		'streak_shield',
		1,
		0,
		'Max 3 Active',
		false,
		['Automatically saves your streak if you miss a daily claim window', 'Stackable up to 3 active Streak Shields in your wallet'],
		35
	),

	// High-Spender & Patron Vanity Badges
	perk(
		'perk-badge-dotmatrix',
		'Interactive Dot-Matrix Profile Header & Badge',
		'Unlock the live reactive antigravity dot-matrix banner studio with 13 customizable formations, 5 morphable render forms, and the exclusive Dot-Matrix Architect badge across your profile and sidebar card.',
		3500,
		'vanity_badge',
		'dot_matrix_banner',
		0,
		'Interactive Banner',
		true,
		[
			'13 selectable live formations (including Supernova, 4D Tesseract, Synth Horizon, Cyber Lotus & Chronos)',
			'Interactive cursor repulsion & click shockwave physics on your profile & sidebar card',
			'Exclusive "Dot-Matrix Architect" badge + live formation switcher on your public header',
		],
		39
	),

	// Morphable Background Stage Styles & Formations
	perk(
		'perk-stage-constellation',
		'Astral Nebula & Constellation Linework Stage',
		'Construct the XERNERX loading animation out of starlight filaments, then dissolve all dots into a continuous deep-space nebula, astral linework, and shooting stars.',
		2500,
		'stage_style',
		'stage_constellation',
		0,
		'Non-Dot Stage',
		true,
		[
			'Loading screen draws XERNERX with connected starlight laser filaments',
			'Dissolves into a zero-dot continuous astral nebula, orbital rings & shooting stars after load',
			'Unlocks "Supernova Burst" & "Chronos Dial" formations',
		],
		43
	),
	perk(
		'perk-stage-hexgrid',
		'3D Isometric Honeycomb & Wireframe Terrain Stage',
		'Assemble the loading screen from crystal hex facets, then dissolve all dots into a continuous full-viewport 3D wireframe terrain and reactive honeycomb floor.',
		2500,
		'stage_style',
		'stage_hexgrid',
		0,
		'Non-Dot Stage',
		false,
		[
			'Loading screen assembles XERNERX from interlocking isometric crystal cells',
			'Dissolves into a continuous 3D perspective wireframe terrain & reactive hex lattice (zero dots)',
			'Unlocks "4D Tesseract" rotating hypercube formation',
		],
		44
	),
	perk(
		'perk-stage-aurora',
		'Liquid Aurora Silk & Plasma Ribbon Stage',
		'Reveal the loading screen as a liquid plasma stroke, then melt all particles into continuous full-screen Northern Lights silk curtains and flowing synth waves.',
		2500,
		'stage_style',
		'stage_aurora',
		0,
		'Non-Dot Stage',
		true,
		[
			'Loading screen reveals XERNERX with flowing liquid aurora ribbons',
			'Melts into 100% continuous multi-layered Northern Lights silk curtains (zero dots)',
			'Unlocks "Synth Horizon" wide perspective formation',
		],
		45
	),
	perk(
		'perk-stage-glyphs',
		'Sacred Geometry & Architectural Circuit Stage',
		'Construct the loading wordmark with CAD vector linework, then fuse into continuous concentric astrolabe dials, rotating wireframe polyhedra, and live PCB circuit traces.',
		2500,
		'stage_style',
		'stage_glyphs',
		0,
		'Non-Dot Stage',
		false,
		[
			'Loading screen traces XERNERX with architectural CAD laser linework',
			'Fuses into continuous astrolabe rings, rotating 3D wireframes & pulsing circuit traces (zero dots)',
			'Unlocks "Cyber Lotus" sacred geometric mandala formation',
		],
		46
	),
	perk(
		'perk-ambient-scenes',
		'Standalone Full-Screen Ambient Scenes Bundle (All 5 Shaders)',
		'Save 20% and unlock all 5 standalone full-bleed background shaders—Liquid Mesh Lava, 3D Synthwave Horizon, Topographic Contours, Deep Nebula Cosmos, and Crystal Caustics.',
		3000,
		'ambient_scene',
		'ambient_scenes_pack',
		0,
		'Save 20% Bundle',
		true,
		[
			'Unlocks all 5 Ambient Shaders ("Liquid Mesh Lava", "3D Synthwave Grid", "Topographic Contours", "Deep Nebula", and "Prism Caustics")',
			'Standalone full-viewport ambient canvas in Appearance Settings (independent of dot-matrix)',
			'Adapts dynamically to your chosen Accent Color in both Light and Dark themes',
		],
		46.1
	),
	perk(
		'perk-ambient-mesh-lava',
		'Liquid Mesh & Lava Ambient Shader',
		'Silky multi-layered organic fluid gradients that drift smoothly across the full viewport behind your workspace.',
		750,
		'ambient_scene',
		'ambient_mesh_lava',
		0,
		'Ambient Shader',
		false,
		['Unlocks "Liquid Mesh & Lava" full-screen ambient scene', 'Adapts to your Accent Color in Light and Dark mode'],
		46.11
	),
	perk(
		'perk-ambient-cyber-grid',
		'3D Synthwave Horizon Grid Shader',
		'Perspective 3D wireframe floor, atmospheric horizon bloom, and retro-futuristic zenith sun disc.',
		750,
		'ambient_scene',
		'ambient_cyber_grid',
		0,
		'Ambient Shader',
		false,
		['Unlocks "Synth Horizon Grid" full-screen ambient scene', 'Interactive pointer parallax & horizon perspective'],
		46.12
	),
	perk(
		'perk-ambient-topography',
		'Isobaric Topography Contour Shader',
		'Flowing cartographic elevation rings and architectural contour waves across your background stage.',
		750,
		'ambient_scene',
		'ambient_topography',
		0,
		'Ambient Shader',
		false,
		['Unlocks "Isobaric Topography" full-screen ambient scene', 'Precision vector contour lines reactive to cursor movement'],
		46.13
	),
	perk(
		'perk-ambient-nebula-cosmos',
		'Deep-Space Nebula & Starfield Shader',
		'Volumetric cosmic dust clouds, multi-depth parallax starfields, and occasional shooting meteors.',
		750,
		'ambient_scene',
		'ambient_nebula_cosmos',
		0,
		'Ambient Shader',
		false,
		['Unlocks "Deep-Space Nebula" full-screen ambient scene', 'Volumetric nebula clouds + shooting star streaks'],
		46.14
	),
	perk(
		'perk-ambient-prism-caustics',
		'Prism Light Caustics Shader',
		'Crystalline light refraction beams and shimmering aquatic caustic ripples across the viewport.',
		750,
		'ambient_scene',
		'ambient_prism_caustics',
		0,
		'Ambient Shader',
		false,
		['Unlocks "Prism Light Caustics" full-screen ambient scene', 'Refractive diagonal light rays & caustic interference'],
		46.15
	),

	// Card & Glass Surface Architecture (Bundle + Individual)
	perk(
		'perk-surface-styles',
		'Card & Glass Surface Architecture Bundle (All 4 Finishes)',
		'Save 17% and transform every card, modal, sidebar, and panel across the suite with Frosted Crystal, Holographic Iridescent Foil, Cyber Neon Wireframe, and Smoked Obsidian.',
		2500,
		'surface_style',
		'surface_styles_pack',
		0,
		'Save 17% Bundle',
		true,
		[
			'Unlocks all 4 Surface Finishes ("Prismatic Crystal", "Holographic Foil", "Cyber Neon", and "Smoked Obsidian")',
			'Applies suite-wide across all Xernerx web & desktop applications',
			'Live preview and instant toggle in Account Appearance settings',
		],
		46.3
	),
	perk(
		'perk-surface-crystal',
		'Prismatic Crystal Card Surface',
		'High-clarity optical glass refraction with crisp top-edge specular highlights across all cards and panels.',
		750,
		'surface_style',
		'surface_crystal',
		0,
		'Surface Finish',
		false,
		['Unlocks "Prismatic Crystal" suite-wide card & glass finish', 'Crisp specular top bevel and deep saturating blur'],
		46.31
	),
	perk(
		'perk-surface-holographic',
		'Holographic Iridescent Foil Surface',
		'Iridescent multi-tone border sheen and subtle diagonal prism wash across every card in the suite.',
		750,
		'surface_style',
		'surface_holographic',
		0,
		'Surface Finish',
		false,
		['Unlocks "Holographic Foil" suite-wide card & glass finish', 'Multi-angle prismatic sheen & accent glow'],
		46.32
	),
	perk(
		'perk-surface-neon',
		'Cyber Neon Wireframe Surface',
		'Luminous accent-charged borders with outer and inset neon bloom across cards, sidebars, and modals.',
		750,
		'surface_style',
		'surface_neon',
		0,
		'Surface Finish',
		false,
		['Unlocks "Cyber Neon" suite-wide card & glass finish', 'Electrified accent borders with outer + inset bloom'],
		46.33
	),
	perk(
		'perk-surface-obsidian',
		'Smoked Obsidian Matte Surface',
		'Ultra-deep matte smoked glass with razor-sharp contrast framing and recessed shadow depth.',
		750,
		'surface_style',
		'surface_obsidian',
		0,
		'Surface Finish',
		false,
		['Unlocks "Smoked Obsidian" suite-wide card & glass finish', 'High-contrast stealth matte elevation'],
		46.34
	),

	// Interactive Cursor Trail & Click Shockwave FX (Bundle + Individual)
	perk(
		'perk-cursor-fx-bundle',
		'Cursor Trail & Click Shockwave FX Bundle (All 5 FX)',
		'Save 27% and unlock all 5 interactive pointer trail and click shockwave effects—Starlight Sparkle Trail, Plasma Click Sparks, Cyber HUD Reticle, Sonic Ripple Rings, and Aurora Silk Ribbon.',
		2200,
		'cursor_fx',
		'cursor_fx_bundle',
		0,
		'Save 27% Bundle',
		true,
		[
			'Unlocks all 5 Interactive Cursor Trail & Click Shockwave FX across Web and Desktop',
			'Dynamic 60fps canvas trails and click burst shockwaves tinted to your chosen --accent color',
			'Instant live switch in Account Appearance settings',
		],
		46.5
	),
	perk(
		'perk-cursor-starlight',
		'Starlight Sparkle Trail & Burst Cursor FX',
		'4-point celestial starlight sparkles trailing your pointer with a radiant star burst on every click.',
		600,
		'cursor_fx',
		'cursor_starlight_trail',
		0,
		'Cursor FX',
		false,
		['Unlocks "Starlight Sparkle Trail" pointer FX', '4-point star sparkles & click burst tinted to your accent color'],
		46.51
	),
	perk(
		'perk-cursor-plasma',
		'Plasma Click Sparks & Comet Cursor FX',
		'High-velocity electric plasma sparks and glowing comet trail with an energetic spark shower on click.',
		600,
		'cursor_fx',
		'cursor_plasma_sparks',
		0,
		'Cursor FX',
		false,
		['Unlocks "Plasma Click Sparks" pointer FX', 'High-velocity comet trail & 18-particle click spark burst'],
		46.52
	),
	perk(
		'perk-cursor-reticle',
		'Cyber HUD Tactical Reticle Cursor FX',
		'Rotating sci-fi targeting reticle with corner lock brackets that follows your pointer and pulses on click.',
		600,
		'cursor_fx',
		'cursor_cyber_reticle',
		0,
		'Cursor FX',
		false,
		['Unlocks "Cyber HUD Tactical Reticle" pointer FX', 'Rotating telemetry crosshair & tactical lock-on click shockwave'],
		46.53
	),
	perk(
		'perk-cursor-sonic',
		'Sonic Pulse Rings & Shockwave Cursor FX',
		'Concentric acoustic motion wake rings along your pointer path with dual expanding sonic booms on click.',
		600,
		'cursor_fx',
		'cursor_sonic_rings',
		0,
		'Cursor FX',
		false,
		['Unlocks "Sonic Pulse Rings" pointer FX', 'Clean concentric ripple wake & dual click shockwave rings'],
		46.54
	),
	perk(
		'perk-cursor-aurora',
		'Aurora Silk Ribbon & Shimmer Cursor FX',
		'Fluid multi-layered silk light ribbon that glides behind your cursor with soft prismatic click ripples.',
		600,
		'cursor_fx',
		'cursor_aurora_ribbon',
		0,
		'Cursor FX',
		false,
		['Unlocks "Aurora Silk Ribbon" pointer FX', 'Smooth Bezier silk light ribbon & soft click bloom'],
		46.55
	),

	// Custom Toast, Modal & Command Palette (Ctrl+K) Skins (Bundle + Individual)
	perk(
		'perk-overlay-skins-bundle',
		'Modal, Toast & Command Palette (Ctrl+K) Skin Bundle (All 4 Skins)',
		'Save 15% and unlock all 4 custom skins for Modals, Toasts, and the Ctrl+K Command Palette—HUD Tactical, Frosted Prism, Neon Arcade, and Minimal Floating Pill.',
		2200,
		'overlay_skin',
		'overlay_skins_bundle',
		0,
		'Save 15% Bundle',
		true,
		[
			'Unlocks "HUD Tactical", "Frosted Prism", "Neon Arcade", and "Minimal Floating Pill" overlay skins',
			'Transforms all Modals, Toast notifications, and the global Ctrl+K Command Palette',
			'Instant live switch in Account Appearance settings',
		],
		46.7
	),
	perk(
		'perk-skin-hud-tactical',
		'HUD Tactical Modal, Toast & Ctrl+K Skin',
		'Angled tactical corner brackets, telemetry scanline header bar, and high-precision HUD framing on Modals, Toasts, and Ctrl+K.',
		650,
		'overlay_skin',
		'skin_hud_tactical',
		0,
		'Overlay Skin',
		false,
		['Unlocks "HUD Tactical" skin for Modals, Toasts & Command Palette', 'Corner reticle accents & scanline top bar'],
		46.71
	),
	perk(
		'perk-skin-frosted-prism',
		'Frosted Prism Modal, Toast & Ctrl+K Skin',
		'Ultra-refractive rainbow dispersion edge and crystal specular highlights on Modals, Toasts, and Ctrl+K.',
		650,
		'overlay_skin',
		'skin_frosted_prism',
		0,
		'Overlay Skin',
		false,
		['Unlocks "Frosted Prism" skin for Modals, Toasts & Command Palette', 'Chromatic dispersion border & deep optical blur'],
		46.72
	),
	perk(
		'perk-skin-neon-arcade',
		'Neon Arcade Modal, Toast & Ctrl+K Skin',
		'Dual-line glowing neon tube border and electric synth bloom on Modals, Toasts, and Ctrl+K.',
		650,
		'overlay_skin',
		'skin_neon_arcade',
		0,
		'Overlay Skin',
		false,
		['Unlocks "Neon Arcade" skin for Modals, Toasts & Command Palette', 'High-voltage neon tube frame & ambient glow'],
		46.73
	),
	perk(
		'perk-skin-minimal-pill',
		'Minimal Floating Pill Modal, Toast & Ctrl+K Skin',
		'Ultra-rounded floating capsule geometry with borderless deep elevation shadow on Modals, Toasts, and Ctrl+K.',
		650,
		'overlay_skin',
		'skin_minimal_pill',
		0,
		'Overlay Skin',
		false,
		['Unlocks "Minimal Floating Pill" skin for Modals, Toasts & Command Palette', 'Extra-pill geometry & clean borderless elevation'],
		46.74
	),

	// Profile Identity Cosmetics (Bundles + Individual)
	perk(
		'perk-profile-frames',
		'Animated Avatar Frame Shaders Bundle (All 4 Frames)',
		'Save 20% and unlock all 4 animated shader rings around your avatar—Plasma Ring, Prismatic Holo-Halo, Cyber Hex Shield, and Solar Corona.',
		2250,
		'profile_cosmetic',
		'profile_frames_pack',
		0,
		'Save 20% Bundle',
		true,
		[
			'Unlocks all 4 Avatar Frames ("Plasma Ring", "Prismatic Holo-Halo", "Cyber Hex Shield", and "Solar Corona")',
			'Displayed on your Public Profile Header, Account Profile Card, and Sidebar User Card',
			'Customizable anytime in Account Profile Cosmetics Studio',
		],
		46.85
	),
	perk(
		'perk-frame-plasma-ring',
		'Plasma Orbit Ring Avatar Frame',
		'Spinning dual-tone plasma energy ring with soft accent bloom around your profile and sidebar avatar.',
		700,
		'profile_cosmetic',
		'frame_plasma_ring',
		0,
		'Avatar Frame',
		false,
		['Unlocks "Plasma Orbit Ring" animated avatar frame', 'Visible on Public Profile, Account Profile & Sidebar'],
		46.86
	),
	perk(
		'perk-frame-holo-crown',
		'Holographic Prism Halo Avatar Frame',
		'Iridescent full-spectrum spinning prism halo around your profile and sidebar avatar.',
		700,
		'profile_cosmetic',
		'frame_holo_crown',
		0,
		'Avatar Frame',
		false,
		['Unlocks "Holographic Prism Halo" animated avatar frame', 'Visible on Public Profile, Account Profile & Sidebar'],
		46.87
	),
	perk(
		'perk-frame-cyber-hex',
		'Cyber Hex Shield Avatar Frame',
		'Octagonal geometric forcefield frame with pulsing neon telemetry glow.',
		700,
		'profile_cosmetic',
		'frame_cyber_hex',
		0,
		'Avatar Frame',
		false,
		['Unlocks "Cyber Hex Shield" animated avatar frame', 'Visible on Public Profile, Account Profile & Sidebar'],
		46.88
	),
	perk(
		'perk-frame-solar-flare',
		'Solar Corona Flare Avatar Frame',
		'Radiant golden-crimson solar corona ring with breathing flare illumination.',
		700,
		'profile_cosmetic',
		'frame_solar_flare',
		0,
		'Avatar Frame',
		false,
		['Unlocks "Solar Corona Flare" animated avatar frame', 'Visible on Public Profile, Account Profile & Sidebar'],
		46.89
	),
	perk(
		'perk-profile-nameplates',
		'Animated Nameplates & Profile Card Themes Bundle (All 8 Cosmetics)',
		'Save 15% and unlock all 4 animated profile nameplates and all 4 luxury Profile Card Themes.',
		2750,
		'profile_cosmetic',
		'profile_nameplates_pack',
		0,
		'Save 15% Bundle',
		true,
		[
			'Unlocks all 4 animated Nameplates ("Aurora Ribbon", "Synthwave Horizon", "Nebula Starlight", "Cyber Pulse")',
			'Unlocks all 4 luxury Profile Card Themes ("Holographic Foil", "Celestial Starlight", "Cyber Neon", "Obsidian Gold")',
			'Renders live on your Sidebar User Pill, Popup Card, and Public Profile',
		],
		46.92
	),
	perk(
		'perk-nameplate-aurora',
		'Aurora Ribbon Nameplate + Holographic Profile Card',
		'Unlock the flowing Aurora Ribbon animated nameplate and matching Holographic Foil profile card theme.',
		800,
		'profile_cosmetic',
		'nameplate_aurora_wave',
		0,
		'Nameplate & Card',
		false,
		['Unlocks "Aurora Ribbon" animated nameplate', 'Unlocks "Holographic Foil" profile card theme'],
		46.93
	),
	perk(
		'perk-nameplate-synth',
		'Synthwave Horizon Nameplate + Celestial Profile Card',
		'Unlock the Synthwave Horizon animated nameplate and matching Celestial Starlight profile card theme.',
		800,
		'profile_cosmetic',
		'nameplate_synth_horizon',
		0,
		'Nameplate & Card',
		false,
		['Unlocks "Synthwave Horizon" animated nameplate', 'Unlocks "Celestial Starlight" profile card theme'],
		46.94
	),
	perk(
		'perk-nameplate-nebula',
		'Nebula Starlight Nameplate + Cyber Neon Profile Card',
		'Unlock the Nebula Starlight animated nameplate and matching Cyber Neon Grid profile card theme.',
		800,
		'profile_cosmetic',
		'nameplate_nebula_shimmer',
		0,
		'Nameplate & Card',
		false,
		['Unlocks "Nebula Starlight" animated nameplate', 'Unlocks "Cyber Neon Grid" profile card theme'],
		46.95
	),
	perk(
		'perk-nameplate-cyber',
		'Cyber Pulse Nameplate + Obsidian Gold Profile Card',
		'Unlock the Cyber Pulse animated nameplate and matching Obsidian & Gold profile card theme.',
		800,
		'profile_cosmetic',
		'nameplate_cyber_circuit',
		0,
		'Nameplate & Card',
		false,
		['Unlocks "Cyber Pulse Tag" animated nameplate', 'Unlocks "Obsidian & Gold" profile card theme'],
		46.96
	),

	// Desktop Crest Packs, UI Icon Stroke Packs & Header Styles
	perk(
		'perk-icons-monochrome',
		'Monochrome & Obsidian Desktop Crest Pack',
		'Unlock the high-contrast Monochrome White and stealth Obsidian Black taskbar, window titlebar, and system tray icons for Xernerx Desktop.',
		1500,
		'icon_pack',
		'icon_pack_monochrome',
		0,
		'Desktop Icons',
		false,
		[
			'Unlocks "Monochrome White" & "Obsidian Black" Desktop App Icons',
			'Auto-prompts to match when selecting Monochrome White or Obsidian Black accent colors',
			'Applies to Windows & Linux taskbar, window icon, and system tray crest',
		],
		47
	),
	perk(
		'perk-icons-neon',
		'Neon Cyber Desktop Crest Pack',
		'Unlock the electric Arctic Cyan and Vibrant Pink taskbar, window titlebar, and system tray icons for Xernerx Desktop.',
		1500,
		'icon_pack',
		'icon_pack_neon',
		0,
		'Desktop Icons',
		false,
		[
			'Unlocks "Arctic Cyan" & "Vibrant Pink" Desktop App Icons',
			'Auto-prompts to match when selecting Cyan or Pink accent colors',
			'Applies to Windows & Linux taskbar, window icon, and system tray crest',
		],
		48
	),
	perk(
		'perk-icons-royal',
		'Royal Gold & Crimson Desktop Crest Pack',
		'Unlock the prestige Amber Gold and Crimson Red taskbar, window titlebar, and system tray icons for Xernerx Desktop.',
		1500,
		'icon_pack',
		'icon_pack_royal',
		0,
		'Desktop Icons',
		true,
		[
			'Unlocks "Amber Gold" & "Crimson Red" prestige Desktop App Icons',
			'Auto-prompts to match when selecting Gold or Red accent colors',
			'Applies to Windows & Linux taskbar, window icon, and system tray crest',
		],
		49
	),
	perk(
		'perk-ui-icon-packs',
		'Suite UI Icon Pack Bundle (Duotone, Bold & Precision)',
		'Customize every interface icon across the Sidebar, Header, and all Xernerx web & desktop apps with Duotone Accent Glow, Bold Pop, or Thin Precision vector strokes.',
		2000,
		'icon_pack',
		'ui_icon_packs',
		0,
		'UI Icon Styles',
		true,
		[
			'Unlocks "Duotone Accent Glow" (translucent accent fill + ambient drop glow)',
			'Unlocks "Bold Pop" (2.6px chunky tactile vector strokes) & "Thin Precision" (1.35px technical strokes)',
			'Syncs across Browser and Desktop via Account Preferences',
		],
		50
	),
	perk(
		'perk-window-styles',
		'Glass Capsule, Squircle & Stealth Header Pack',
		'Unlock 3 custom Header & Window Control styles—Unified Glass Island, Modern Squircles, and Stealth Accent Dots—working across both Browser and Desktop.',
		2000,
		'window_style',
		'window_styles_pack',
		0,
		'Header & Controls',
		true,
		[
			'Unlocks "Unified Glass Island" (capsule bar), "Modern Squircles", and "Stealth Accent Dots"',
			'Styles both Browser header buttons (Search, Subdomains, App Drawer, Bell) and Desktop window controls',
			'Persists across all Xernerx subdomains and Desktop sessions',
		],
		51
	),
	perk(
		'perk-badge-patron',
		'Credit Patron Badge',
		'Show off your support with the exclusive Credit Patron vanity badge.',
		2500,
		'vanity_badge',
		'credit_patron',
		0,
		'Vanity Badge',
		false,
		['Permanent "Credit Patron" profile & sidebar badge', 'Toggleable anytime in Account Profile settings'],
		40
	),
	perk(
		'perk-badge-highroller',
		'High Roller Vanity Badge',
		'Prestige vanity badge crafted for dedicated credit collectors and high spenders.',
		10000,
		'vanity_badge',
		'high_roller',
		0,
		'High Spender',
		true,
		['Permanent "High Roller" prestige badge', 'Displayed on your public profile & sidebar user card'],
		41
	),
	perk(
		'perk-badge-sovereign',
		'Vault Sovereign Badge',
		'The ultimate flex badge in the Xernerx ecosystem for top-tier patrons.',
		25000,
		'vanity_badge',
		'vault_sovereign',
		0,
		'Ultimate Flex',
		false,
		['The rarest Credit Store vanity badge in the suite', 'Permanent unlock across all Xernerx applications'],
		42
	),
];

export async function ensureStoreSeed() {
	const { models } = await database('xernerx');
	const Category = models.store.Category as any;
	const Item = models.store.Item as any;

	const count = await Category.countDocuments();
	if (count === 0) {
		await Category.create([
			{ id: 'consumers', name: 'Bots, Servers & Ultra', description: 'Individual bot passes and the all-in-one Ultra bundle.', icon: 'Bot', order: 0, enabled: true },
			{ id: 'developers', name: 'Developer API', description: 'Developer API access, higher rate limits, and custom domains.', icon: 'Code', order: 1, enabled: true },
			{ id: 'servers', name: 'Servers', description: 'Dedicated guild & server infrastructure passes.', icon: 'Server', order: 2, enabled: true },
		]);

		await Item.create([
			{
				id: 'ultra',
				name: 'Ultra Ecosystem',
				description: 'Includes all user and server subscriptions of our bots in a single master pass.',
				categoryId: 'consumers',
				skuId: 'prod_V0pD5uXoTQkrYS',
				itemType: 'subscription',
				isFeatured: true,
				badge: 'Ultimate Ecosystem',
				discountPercent: 0,
				features: [
					'Access to all consumer bots (Zodiac, Virtue, To-Do, Metamorphosis)',
					'200% Credit Multiplier on all earned credits',
					'All server-level utility subscriptions',
					'Priority support channel access',
					'1,000 Media Uploads (CDN)',
				],
				order: 0,
				enabled: true,
			},
			...[
				{ id: 'bot-zodiac', name: 'Zodiac Pass', skuId: 'prod_V0pSuzpbmBFsRv', feat: 'Direct developer support', order: 1 },
				{ id: 'bot-virtue', name: 'Virtue Pass', skuId: 'prod_V0pRf7S9w9Pjb9', feat: 'Advanced moderation suite', order: 2 },
				{ id: 'bot-todo', name: 'To-Do Pass', skuId: 'prod_V0pREm72CzuoVc', feat: 'Unlimited task boards', order: 3 },
				{ id: 'bot-metamorphosis', name: 'Metamorphosis Pass', skuId: 'prod_V0pQ0EDH0iEDIm', feat: 'Dynamic logging channels', order: 4 },
			].map((b) => ({
				id: b.id,
				name: b.name,
				description: 'Individual bot license pass with premium feature access.',
				categoryId: 'consumers',
				skuId: b.skuId,
				itemType: 'subscription',
				isFeatured: false,
				discountPercent: 0,
				features: [`Premium ${b.name.replace(' Pass', '')} access`, '125% Credit Multiplier on earned credits', b.feat],
				order: b.order,
				enabled: true,
			})),
			{
				id: 'dev-pro',
				name: 'Developer Pro',
				description: 'Advanced API rate limits and custom domains.',
				categoryId: 'developers',
				skuId: 'prod_V0oBbO5pVQMxcC',
				itemType: 'subscription',
				isFeatured: false,
				badge: 'Developer Pro',
				discountPercent: 0,
				features: ['Advanced API access', 'Extended rate limits', 'Unlimited Projects'],
				order: 0,
				enabled: true,
			},
		]);
	}

	const creditsCat = await Category.findOne({ id: 'credits' }).lean();
	if (!creditsCat) {
		await Category.create({
			id: 'credits',
			name: 'Credits & Perks',
			description: 'Top up ecosystem credits or redeem your balance for CDN slots, profile showcases, trial passes, and vanity badges.',
			icon: 'Coins',
			order: 3,
			enabled: true,
		});
	}

	await Item.deleteMany({
		id: {
			$in: ['perk-font-packs-bundle', 'perk-font-cyber-geometric', 'perk-font-editorial-serif', 'perk-font-retro-arcade', 'perk-font-technical-mono', 'perk-font-rounded-pop'],
		},
	});

	for (const creditItem of CREDIT_STORE_ITEMS) {
		await Item.updateOne({ id: creditItem.id }, { $setOnInsert: creditItem }, { upsert: true });
	}
	for (const refreshId of [
		'perk-badge-dotmatrix',
		'perk-stage-constellation',
		'perk-stage-hexgrid',
		'perk-stage-aurora',
		'perk-stage-glyphs',
		'perk-ambient-scenes',
		'perk-surface-styles',
		'perk-profile-frames',
		'perk-profile-nameplates',
	]) {
		const seedItem = CREDIT_STORE_ITEMS.find((i) => i.id === refreshId);
		if (seedItem) {
			await Item.updateOne({ id: refreshId }, { $set: { name: seedItem.name, description: seedItem.description, badge: seedItem.badge, features: seedItem.features, order: seedItem.order } });
		}
	}
}
