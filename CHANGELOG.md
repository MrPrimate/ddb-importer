# Next Up

# 7.5.10

## New

- **Artifact properties:** the DMG artifact properties (2024 and 2014) are now built into compendiums when munching items.
- **Feature items:** per-feature advancements now live on their own feature items, as in official content, e.g. Weapon Mastery, Expertise, Fighting Style, Bonus Proficiencies and Keen Senses.
- **Region display:** region behaviours can now choose whether a template is drawn with its true shape.

## Improvements

- **Class features:** Soulknife Psychic Blades is now one feature plus a Psychic Blade weapon. Brutal Strike, Channel Divinity and Monk focus get feature scale values, and third-caster spell scales move to the subclass. Avenging Angel and Dispater's Interdiction fixes.
- **Muncher:** the monster spell version setting is now in the muncher's monster settings.
- **Items munch:** updated items are no longer written twice (this could happen with some configs)

## Adventures

- **Meta-data regions:** regions from meta-data are placed on scene import, with teleport and behaviour links re-pointed across the book and kept stable on re-import. This only impacts adventures in the last couple of months which had regions added, but did not come in on import.
- **Scene fixes:** Perfect Vision darkness drawings become regions, old lighting fields are migrated, missing backgrounds fall back, and caption-less maps are named after their chapter.

# 7.5.9

## New

- **Heroes of Faerun:** epic boons and feats are now automated, e.g. Boon of the Bright Sun, Boon of the Soul Drinker, Harper Teamwork and Purple Dragon Commandant.
- **Ravenloft Dark Gifts:** Dark Gift feats and their flaws are now automated, with flaw saves and rest-triggered flaws.
- **Telepathy:** telepathy from D&D Beyond is now set as the actor's telepathy range.
- **Death save effects:** advantage or disadvantage on death saves (Durable, Tenacious, Deathwalker's Ward) now become effects.
- **Species save advantage:** around 40 species traits (Fey Ancestry, Brave, Dwarven Resilience and others) now give AC5e advantage on saves against the conditions they name.
- **No Reactions:** features and spells that stop reactions (Arms of Hadar, Slow, Confusion, Shocking Grasp and more) now add a "No Reactions" effect for Midi and AC5e.
- **Monster temp HP:** monsters that roll temporary hit points now get a temp HP activity.
- **Monster speed penalties:** "Speed decreases by 10 feet", "halved" and "reduced to 0" now become movement effects.
- **Parry:** monster Parry now adds an AC bonus reaction effect.
- **Summon items:** Hat of Vermin, Horn of Valhalla, Ring of Djinni Summoning and the 2024 Dancing swords now summon.
- **Many new item implementations:** Eye and Hand of Vecna, Necklace of Fireballs, Wings of Flying, Talismans of Pure Good and Ultimate Evil, Candle of Invocation, Nine Lives Stealer and more.
- **New feats and features:** Parasite's Physical Specimen, Nakudama's Electric Bloodline, Healer's Tend Creature, Boon of Communication, Steel Defender's Revive Defender and others.
- **Horrors Within:** monster features from Project Lamordia are now implemented, e.g. Viktra Mordenheim's Syringe and Malfunction.
- **Sources:** Project Lamordia and Legends of Greyhawk: Heralds of the Old One are now recognised as sources.

## Improvements

- **Usage limits:** uses and recharges are read from more wordings when D&D Beyond doesn't supply them. This covers features, items ("can hold up to 3 charges", "regain all expended charges at dawn") and monsters ("3/Day, or 4/Day in Lair").
- **Activation types:** "As a Magic action", "take a Reaction" and other 2024 wording now set the right activation. Features used on a rest now use the short rest or long rest activation, so they show on the rest card.
- **Feat spell grants:** spells from feats are granted more reliably, including level-gated spells, school choices and slot-only spells.
- **Spellcasting ability:** spells from feats, species and backgrounds now keep the ability chosen on D&D Beyond.
- **Ability picks:** feats that depend on your chosen ability score now use that pick. In the muncher you get one activity per ability.
- **Skill and tool choices:** more advancement wording is understood, and background tool picks are now a choice instead of granting every tool.
- **Tool proficiencies:** re-importing a character now refreshes tool proficiencies, so old ones don't linger.
- **2024 items:** spells cast by 2024 items now use the 2024 version of the spell.
- **Gear:** items like Acid, Alchemist's Fire and Holy Water are now potions. Antitoxin and Torch are Bonus Actions. Candles, chalk and ink are destroyed when used up.
- **Item charges:** item uses now carry over the charges already spent on D&D Beyond.
- **Monster damage:** alternative damage ("or X damage if...") becomes a separate attack, and critical-only damage becomes the critical bonus.
- **Monster conditions:** conditions, curses, exhaustion and paired riders are detected more accurately, and saves beside an attack now apply the condition instead of the hit.
- **Monster spellcasting:** more spell casts inside monster features are detected.
- **Monster areas:** area templates and emanations are read more accurately.
- **Monster re-munch:** re-munching a monster now replaces stale effects but keeps ones you added yourself.
- **Smites:** smite damage can now crit and is never halved on a save. Banishing, Blinding, Wrathful and Bone-Chilling Smite were reworked.
- **Class features:** many fixes and improvements, e.g. Avenging Angel, Elemental Cleaver, Fast Hands, Runes, Survivor, Parry, Riposte and Cutting Words.
- **Spells:** improvements to Divine Word, Storm of Vengeance, Scrying, Glyph of Warding, Imprisonment, Earthquake and others.
- **Dice AC bonuses:** features like Form of the Beast Tail and Bait and Switch now roll the die and offer a matching AC effect.
- **Midi:** effects with several options now ask you to choose one. Reactions are offered only when they apply. Damage reduction reactions (Deflect Missiles, Interception, Parry) now reduce damage correctly.
- **Midi during imports:** Midi's dead and unconscious handling is paused during character imports, so it can't remove effects mid-import. This works with players and several GMs.
- **Adventures:** internal journal links now go to the right page and section. "View Player Version" links now point to the imported scene.
- **Dynamic Sync:** backpack and container sync is more reliable. Updates are sent one at a time so D&D Beyond doesn't drop them.
- **Muncher:** class, feat, background and species lists refresh after 10 minutes, so new purchases show up sooner.
- **Light mode:** fixes for the adventure and map screens.

## Bug Fixes

- 2024 magic weapons like Zeal could give their bonus to all attacks instead of just the weapon.
- 2024 Devil's Sight didn't give Darkvision.
- Spells with an explicit activation inherited the spell's casting time instead.
- Psionic Strike and Holy Nimbus damage formulas were broken.
- Fey Touched and similar feats could cast with the wrong ability.
- Trip Attack could knock targets prone without a save.
- Monsters could gain conditions their text didn't mention.
- Ongoing monster damage could also roll on the first failed save.
- Some single-use items recharged with unrelated dice from their text.
- Items whose spells weren't found lost their uses.
- Character imports now retry if another client deletes items at the same time, and roll back cleanly if they fail.
- Adventure maps that were a figure's only image were removed.
- Broken asset filenames in some adventures were fixed.
- The debug report failed when the proxy had no user data endpoint.

# 7.5.8

## New

- **The Magus class** (Mage Hand Press) is now supported, including Mystic Mark, Aegis and Enspell, and prepared spell limits.
- **DDBI Utilities Extension:** DDB Importer can take your Cobalt cookie from the D&D Beyond login in your browser, with a new Ask / Always / Never setting.
- **Monster lore:** munched monsters can pull their full lore text from D&D Beyond books you own (e.g. the 2024 Monster Manual), on by default.
- **Compendium setting checker:** if two DDB Importer compendium settings point at the same compendium, a fixer lets you remap them or create the missing compendiums.
- **Source picker presets** let you quickly select first-party, partner or 2024 rules books.
- **New setting "Natural 20 item damage as critical damage?":** turn it off to get a separate damage activity for "roll a 20" riders such as Titan's Tooth.
- **New setting** to open the icon browser with a plain click instead of shift-click.
- **Region Display** gains edge glow and pulse options.
- **Trick weapons** (Galvanized Claw, Hoopak, Meat Hookshot and others) can transform between their forms.
- **Muncher warnings:** the muncher now lists the classes, feats, backgrounds and species it skipped because your account doesn't have access to them.

## Improvements

- **Monster feature improvements:** better lair actions (per-option saves, damage, spell casts, unlabelled lists, regional effects), villain actions and MCDM villain party actions, legendary actions, escape checks, rider and multi-option conditions, self heals, thrown weapons, ongoing damage, summons and more natural weapons.
- **Class features:** fixes for Armorer, Arcane Ward, Warding Bond, Bardic Inspiration, Favored Foe and Quick Healing scales, Brutal Strike, Elemental Wild Shape and Divine Smite (AC5e); form features such as Rage of the Gods and Umbral Form now apply as enchantments.
- **Choice features:** choice building was reworked, giving cleaner descriptions and fewer empty choice items, and fixing background/species skill picks, fighting style cantrips and unchosen background feats.
- **Spells:** prepared status and prepared-spell maximums now come from D&D Beyond, with better spell list parsing, cast-at-level fixes, fewer duplicate cantrips, and healing bonuses that apply to all healing spells.
- **Feats, species and spells:** more automation, including AC5e support, and many fixes.
- **Items:** better weapon properties and mastery, hoard and fabled items, conditional extra weapon damage and spell scroll cast levels, plus fixes for Blackrazor, Coldsnap and others.
- **Third-party content:** better parsing for Grim Hollow, Humblewood, Griffon's Saddlebag, Critical Role, Avantris, Loot Tavern, Free League, 1985 Games, Precipit and other partner books.
- **Companions and summons:** better images, hit dice and proficiency bonds, plus familiar and battle familiar fixes.
- **Native Adventure Muncher:** monster swapping and other import improvements.
- **Dynamic Sync:** improvements and bug fixes, plus a Party Sync fix.
- **Icons:** many new suggestions from @crimsonedge

## Bug Fixes

- Free activities could be charged uses after a character import.
- Adventure imports could delete existing actors.
- Status condition effects lost their icons, and some activity effects lingered after they should have ended.
- Features could gain conditions they shouldn't have.
- Critical damage riders could generate extra activities.
- Spells granted by advancements and backgrounds didn't always link correctly.
- Fixed region expiry and region boundary issues.
- The source pop-up now respects light mode.


# 7.5.7

- Native Adventure Muncher did not always match all the scene adjustments in adventures. e.g. CoS @talen_gm - reimport the adventure to fix existing scenes.
- Native Adventure Muncher could throw a warning message about not being able to import some items. This was not true.
- Arcana Unleashed: Vestige Companion actors get their chosen Divine Power (Healing Touch, Fiendish Swap, Cursed Invocation), Vestige's Strike melee and ranged attacks, and Pact Bond adds your Proficiency Bonus to their checks and saves. Semblance of Life summons Celestial, Fiendish or Undead Spirits scaled to your warlock level.
- Arcana Unleashed familiar feats (Familiar Friend, Elemental Familiar, Otherworldly Familiar, Warlike Familiar) now summon their own familiars with Fortified Familiar's extra HP and the chosen resistance, plus Energy Pulse and Intercept Attack.
- Arcana Unleashed wizard subclasses: Necromancer gets Skeleton and Zombie familiars, Undead Vitality, Undead Thralls (applied to Animate Dead) and Grave Resilience. Transmuter improvements.
- Arcana Unleashed feats, spells and items: general feature improvement pass.
- Wretched Bloodline: Vengeful Summons summons your Blood Ties servants (fetched from D&D Beyond), and Share the Burden casts Bestow Curse for 3 Sorcery Points.
- Uses and consumption fixes for many class features and feats.
- Grasping Shot's Escape Check no longer spends an Arcane Shot use.
- Spells cast with Focus Points by some third-party monk subclasses (Warrior of the Leaden Crown, Warrior of Cosmic Balance, Way of the Aether, Warrior of the Celestial, Way of the Prophet) now spend the right number of points.
- Items that cast spells with a fixed charge cost (e.g. Lesser Restoration on a Staff of Healing) spent the wrong number of charges, and could scale when they shouldn't.
- Items with per-spell charges no longer keep a duplicate activity that spent charges the item doesn't have.
- Torches can be swung as an improvised weapon for 1 fire damage.
- Blood Hunter Hybrid Transformation attacks added proficiency twice.
- Sentinel's Halted effect could last past the end of the turn.
- Munching classes could miss subclass choices if D&D Beyond sent them before the subclass data.

# 7.5.6

- Way of the Street parsing updates @oregonpinkrose
- Illrigger parsing improvements: 13th and 18th level interdiction boons stay hidden until you reach that level, Soul's Doom, Incontrovertible and Acheron's Chain's escape check are automated, Master of Hell's Darkness only blinds enemies in the storm, Inferno has its Burning save, Blood Price rolls your largest Hit Die, Infernal Majesty uses only your chosen Terrorizing Force, and Bedevil and Veil of Lies end correctly with DAE.
- [New Feature] New region behaviour - Region Display - this allows you to customise the region/template placed by activities and effects. There are a number of new patterns with lots of dials, you can use status and damage icons, or even images. This is not intended to replace modules like Automated Animations or be used with things like JB2A assets. It is to help make templates that have ongoing effects or saves more distinctive on the scene. It has a negligible performance footprint with 40 regions using a variety of textures it adds about 0.2ms per frame in the worst case.
- [New Feature] Icon browser. You can shift click and use an icon browser to try and find a match for features/effects/activities with missing icons. It uses a curated list of icon hits to try and find good matches for you.
- Auras such as Spirit Guardians, Lightning Ring, Draconic Presence, Event Horizon, Spell Blind, Dread Lord, Vascular Corruption Aura and Bond of Shelter would trigger their saves/damage on the caster and allies as well as enemies. Twilight Sanctuary's Temp HP could also reach enemies.
- Aura of Conquest dealt damage equal to the aura size instead of half your paladin level.
- Advantage or disadvantage on concentration saves (e.g. War Caster) now combine correctly with other sources of advantage and disadvantage.
- Storm Aura (Tundra) temp HP now uses the correct Storm Herald scale.
- Phoenix Rocket Sword and Requiem save DCs were 1 too high.
- 2024 magic items that recharge on a "Short or Long Rest" were resetting only on a long rest.
- Monsters fetched by ID from the cache could fail to import when the socket connection was unavailable.
- Adventure imports could hang forever if a single document failed to load. The failed document is now skipped and logged.
- A dropped connection while munching spells or monsters could cache an empty result for a week. Failed fetches are no longer cached.
- Muncher lists (classes, species, subclasses etc.) could show the previous account's or campaign's results after changing your Cobalt token or campaign.
- 2014 and 2024 versions of the same spell or feature (e.g. Pass without Trace) could overwrite each other's effects in the effects compendium. Re-import affected spells and features to fix existing links.
- Cloudkill, Create Bonfire, Grease, Web and other spells imported with older versions of DDB Importer (with midi pre-v6) threw errors when used. They now show a warning asking you to re-import them.
- Region automation: aura saves/damage firing at the same time could target the wrong tokens or leave the GM's targets changed, and the expired template cleanup prompt could fail to appear.
- Using the follow-up activity of a concentration spell (e.g. Hex Damage, Heat Metal's Bonus Action Damage, Web's Ongoing Save, Call Lightning's damage, Major Image's Study Check, and over 100 other spells) no longer ends and restarts your concentration.
- Rod of Lordly Might is now a +3 mace weapon, with its own daily uses for Drain Life, Paralyze and Terrify, fixed button weapon damage and bonuses, and a Strength save for Paralyze in 2014.
- Staff of Thunder and Lightning: each property now has its own daily use, the on-hit properties trigger on a hit, and Stunned ends at the end of your next turn.
- Bag of Beans: Count Beans now sets the number of beans correctly, and dumping the bag deals 5d4 regardless of how many beans are dumped (2014 empties the bag).
- Eventide's Splendor, Twilight Shroud and Investiture of Ice effects now expire on the correct creature's turn.
- Armor Model, Telepathic Speech and Fey Step (Summer) used a maximum of 1 instead of a minimum of 1.
- Fey Step (Summer) from Monsters of the Multiverse now uses your proficiency bonus.
- Power Word Pain now caps all speeds at 10 ft, and Dream and Magic Jar reduce all speeds to 0.
- Several monster attacks that reduce Speed now affect all speeds in 2024.
- Speed effects now use the dnd5e 6 speed fields.
- Re-importing a character with "Retain Active Effects?" ticked broke the links between activities and their effects, so spells like Shield showed no Applied Effects in the chat card. Retained effects now keep the links, and custom effects on items are still kept.
- For 2024 content, a general "Speed" bonus (e.g. Fast Movement, Roving) now applies to all your speeds rather than just walking speed.
- Scaling fixes: 2014 Divine Strike scales with cleric level and uses each domain's damage type (War uses the weapon's), Pugilist One-Two Punch and Stick and Move use the Fisticuffs die and Moxie no longer overwrites Unarmed Strike damage, Tentacle of the Deeps deals its flat cold damage, Marrow Transplant's attack now upcasts, and class dice scales on multiclass characters use the feature's own class.
- Area spells no longer roll their ongoing save again for creatures already inside when the area is created. The 2014 "enters for the first time on a turn" spells (Cloudkill, Moonbeam, Blade Barrier, Cloud of Daggers, Evard's Black Tentacles, Sleet Storm, Web) roll nothing on cast and only trigger when a creature moves in or starts its turn there.
- Region triggers have a new "Counts as Entering" option (Automatic / Creature movement only / Creature movement or the area moving onto it / Any enter).
- Cordon of Arrows no longer targets its caster.
- Munched 2024 Elf, Gnome and Tiefling lineages (e.g. High Elf, Forest Gnome, Tiefling (Infernal)) all had the same advancements: the chosen lineage trait was never granted, every Tiefling got Poison resistance, and some choice advancements had an empty option. Class choice advancements (e.g. Fighting Styles) could also miss their munched options. Re-munch species to fix.
- Species munched into an empty compendium had no trait advancements (e.g. Fey Ancestry, Trance) until they were munched a second time.
- 2024 species Languages advancements did not grant Common automatically, so players were asked to pick three languages instead of two. Re-munch species to fix.
- 2024 species lineages and legacies (Elf, Gnome, Tiefling) granted their lineage spells twice, or every lineage's cantrips at once, and Tiefling (Chthonic) and Forest Gnome lost some of theirs. Each lineage now grants its own cantrip plus its level 3 and 5 spells, always prepared with one free cast per Long Rest, and Forest Gnome's Speak with Animals uses your Proficiency Bonus. Re-munch species to fix. @featherjackal
- Munching species with nothing selected in the species picker imported both the 2014 and 2024 versions. It now only munches the rules version selected on the species tab, the same species the picker lists.
- Spells granted by species traits, feats and class features were often lost or mis-levelled when the description listed more than one spell or described the limit in a later sentence (for example Githyanki Psionics lost Jump and Misty Step, Firbolg Magic lost Detect Magic, Duergar and Fire Genasi got their spells at level 1). These now import with the right levels and uses, and some feats and class features that grant free casts (Fey Touched, Shadow Touched, Pyromaniac, Misty Wanderer, Steps of the Fey) now get their spells. Re-munch to fix.
- Fey Touched, Shadow Touched (2014 and 2024), Adept of the White, Red and Black Robes and Artificer Initiate now include their chosen spell as an advancement when munched, restricted to the right spell level and school or spell list, and 2024 Shadow-Touched now grants Invisibility. Both the granted and the chosen spell are always prepared with one free cast per Long Rest. Re-munch feats to fix.
- Region automation no longer changes the GM's targets at all, so regions firing at once can't swap targets and a midi workflow waiting on player saves no longer holds up other regions. Macro activities fired by a region get the region's tokens.
- Owner-turn region prompts only go to a player viewing that scene (otherwise the GM), and Skip keeps a one-shot region for the next turn. Region durations counted in turns, months and years now expire correctly.
- Upcast spells that place a region now roll their attacks and damage at the level they were cast at.
- Around 80 auras and areas (spells, class features, items and monster auras such as Stench) no longer trigger when the aura moves onto a creature where the text says "enters", and monster turn-start auras no longer roll for everyone in range when switched on. Festival King now follows the king, and Transmute Rock has separate Rock to Mud and Mud to Rock options.
- Macro activities and the region Execute Macro handler can use macros from a compendium (by uuid or pasted link), and warn if the macro can't be found.
- Spell fixes: Power Word Pain and Frost Squall no longer grant speeds a creature doesn't have. Follow-up effects of Web, Chains of Beleth, Living Shadows, Festival King, Eyebite, Shadow Puppets and Tasha's Otherworldly Guise last as long as the spell. Scrying, Polymorph, True Polymorph, Animal Shapes and Shapechange no longer restart concentration. Maelstrom, Cordon of Arrows and Dust Devil place fixed areas, and 2014 Cordon of Arrows deals 1d6. Bestow Curse, Holy Aura, Heat Metal and Dispel Evil and Good fixes, and the 2014 Inspiring Leader feat gets an Inspiring Speech temp HP activity.
- Class feature fixes: Aura of Alacrity (2024 matches your Aura of Protection, 2014 reaches 5/10 ft), Aura of Protection's AC5e radius uses paladin level, Redoubled Efforts adds its extra die correctly, Favored Foe scales with ranger level when multiclassed, Form of the Beast's Bite and Claw use the better of Strength or Charisma, and Wrath of the Wild / Take Ghastly Form's Unnerving Aura is a single Wisdom save.
- Around 45 more magic weapons and items now have their special properties automated (e.g. Moonblade, Sunforger, Hazirawn, Lash of Shadows, Headbanger Lute, Dragon's Wrath Weapons, Weapon of Wounding, Axe of the Galloping Headsman, Grass Whistle Blade), along with fixes for Requiem Bliss/Clay, Keyhole's Dagger, the Ominous Staff of Skulls and Staff of Thunder and Lightning (2014). Rod of Lordly Might's buttons are hidden until attuned.
- Item saves are detected more reliably: a weapon's on-hit save is its own activity dealing only the damage its text names (Dagger of Venom and Giant Slayer no longer add the weapon die), DCs written as a sum ("DC 10 plus your Proficiency Bonus", "16 + the axe's bonus") are parsed, curses the wielder saves against are no longer treated as attacks, and items with several saves get the right area and damage for each.
- Monster saves with several parts now get the right area, target and damage for each save.
- Monster features that grant themselves or others resistance, change resistance by form (e.g. Shadow Form Only), or apply a vulnerability aura are now automated, including rage-like self buffs (extra damage, size, flying) and self-teleports. Laeral Silverhand's Spellfire, the Flesh Meld's Consume Creature and the Servok Builder's Lay the Foundation are also automated.
- Monster features sharing a name with an unrelated feature (Tendril, Whirlwind, Charming, Thunderbolt and others) no longer pick up the wrong condition, the 2014 Ice Devil's Ice Spear no longer gets the 2024 speed penalty, aura creature-type exemptions only apply where the text says so, and re-importing a monster no longer duplicates its size-choice or True Form effects.
- Monster summons prefer the summoner's own rules version of the creature, including when "(Legacy)" names are used, and importing a summon without a Patreon key no longer fails if the enriched images can't be fetched.
- Infusions and other enchantments applied on character import keep the same ids across re-imports (so favourites survive) and no longer stack an extra copy on each re-import with "Retain Active Effects?" ticked.
- Streaming imports fall back to normal fetching for a single failed request rather than switching streaming off, and incomplete results are no longer cached. A spell missing from the compendium on an item now warns instead of stopping the character import, and monster token art lookups are more reliable.
- Skill choice advancements no longer treat tool choices as skill choices, and "choose from the following list" skill choices (e.g. Nightwatcher) are detected. Class feature matching no longer depends on what was imported earlier in the session.
- Subclass lists in the muncher include the mule character's campaign homebrew.
- Copying a scene keeps its linked tokens and places copied documents on the matching scene levels.
- Spell Reflection's macro works with dnd5e 6.
- New icons for a number of spells and feats.

# 7.5.5

- Fix Mule Muncher species selections importing a different species when species and subraces share an ID. Saved species selections are reset, please reselect before munching. @couchcomfy
- It was possible for a character on DDB to have consumed more slots than it has, and when these characters were imported, would set a negative consumption value for spell slots.
- Some items such as Periapt of Health would gain double healing activities. (~15 items).
- Some spells on items would not exclude/remove concentration when cast.
- Native Adventure Muncher would not remove the map sidebar from journals that is present in some DDB adventures.
- CSS Updates for AUD.
- Some infusions/enchantments would not auto link up on character import.
- Some effect duration parsing improvements.
- A multitude of summon fixes and enhancements.
- Mule Munching a Warlock will now add Mystic Arcanum Spells to their spell list, and allow selection on advancement. @motomoto0295
- About 40 items had gained transfer effects when they should be attached to activities. These have been fixed.
- Use new Transform features in 6.0.x
- If the experimental behavioural auras/templates is enabled, more chat cards are grouped for things like aura/region placement saves
- Many monsters now parse summon activities when their activity allows a monster summon.
- Improve Gunslinger support if the Mage Hand core classes module is installed.

# 7.5.4

- Item parsing improvements.
- A small number of icon improvements.
- Some rider effect parsing improvements for monsters.
- Monster Leg. Res. now generates a usage action.
- Cleanup of activity description generation, as some DDB tags were not converted properly.
- Hive Druid parsing fixes.
- Minimum 5e version 6.0.2
- Adjustments to some effect conditions that were broken by 6.0.2.

# 7.5.3

- Great Weapon Master fixes for 2024.
- A few hundred further improvements to a variety of parsed spells, items, features.
- Monster feature parser improvements, targeting parsing features like the Goblin Warrior where 2 activities should have been generated, but only one was, and more general utility activities. Teleport activities are also now parsed out.
- Second pass at Arcana Unleashed parsing.

# 7.5.2

- Some class builds could end up granting spells twice during import to spell lists.
- Characters with a dice-only "hit points" bonus mod (for example the Flower Circle druid's extra healing die) imported with 0 hit points because the rider was summed into the hit point total as NaN. Those mods are now ignored when computing the total.
- Spells on magic items are always cast activities linked to the spells compendium; the `spells-on-items-as-activities` setting and the "spells as spells" fallback are gone. When the compendium lacks a spell the character's items cast, a GM import munches it in on the spot, and a player import stops with the list of spells and source books the GM needs to munch.
- Background equipment improvements for some 2014 backgrounds.
- Fix Divine Spark's level 7/13/18 dice increases, and Defile Ground's level-10 radius increase.
- Preserve weapon masteries with ammunition annotations, grant starting Pugilists improvised-weapon proficiency.
- More effect additions to support the new system filters.

# 7.5.1

- A good number of effects generated turn or round based durations which do not work well with the new expiry system. The importer will now emit time based durations only.
- A number of improvements to detecting the scalevalue in text descriptions.

# 7.5.0

This version works ONLY on D&D 5e v6.0x and Foundry v14.

- [MAJOR UPDATE]: a full reimport/munch is recommended to gain the improvements provided by the new v6.0.x D&D System. Over 400 new parser improvements.
- A massive number of changes and improvements to support the new regions, effect expiry conditions, teleporting activities, and many other improvements.
- [REMOVAL]: Active Auras support is removed. Aura Effects is the drop in alternative. DDB Importer now has a native Experimental setting to add low automation to many template/region based activities (See Experimental entry below), although this is disabled by default. Several of the auras that were previosuly handled by AA or AE are now system native. If Aura Effects is installed then the system will use this over template/region attached effects in a lot of cases.
- [EXPERIMENTAL]: DDB Region Behaviours - will use the movement triggers for regions to put appropriate saves into chat to be rolled (rolling isn't automated). You probably don't want this active if using tools like midi-qol or CPR. E.g. Spike Growth. Can be disabled in Enhancement Settings.
- [EXPERIMENTAL]: DDB Region Cleanup - a tool to help cleanup expired region effect - will offer a prompt to remove a region when it thinks it has expired. You probably don't want this active if using tools like midi-qol or CPR. Can be enabled in Enhancement Settings (disabled by default).
- Custom DDB Region Trigger that allows activities to be posted to chat, or macros to be called.
- Effects that generate a global damage bonus will add the types (previously just dice string). E.g. 2014 Paladin Improved Divine Smite
- Characters imported with the Healer feat will get the appropriate rolls modified with appropriate dice modifiers
- The `Add D&D Beyond tool proficiencies?` setting now also controls whether free-text and exotic tool proficiencies are added to the character, not just whether they are registered with the system.
- Some adventure journals would fail to derive a title and not import.

# 7.4.4

- Some 2024 Companions would incorrectly type Damage immunities as custom conditions. (Reanimator companion). @redarchongaming
- Scene Snip Processor Improvements

# Previous Changes

See the [CHANGELOG-historic.md](./CHANGELOG-historic.md)
