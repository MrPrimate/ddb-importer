# Next Up

- Way of the Street parsing updates @oregonpinkrose
- Illrigger parsing improvements.
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
- Fix some scaling issues, and some pugilist fixes.
- Area spells no longer roll their ongoing save again for creatures already inside when the area is created. The 2014 "enters for the first time on a turn" spells (Cloudkill, Moonbeam, Blade Barrier, Cloud of Daggers, Evard's Black Tentacles, Sleet Storm, Web) roll nothing on cast and only trigger when a creature moves in or starts its turn there.
- Region triggers have a new "Counts as Entering" option (Automatic / Creature movement only / Creature movement or the area moving onto it / Any enter).
- Cordon of Arrows no longer targets its caster.

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
