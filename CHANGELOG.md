# Next Up

- Fix for weapons such as Frost Band weapons not  generating extra elemental damage.

# 6.0.8

- Some spell icon adjustments
- Arcane Vigor, Divine Smite, Fount of Moonlight, Sorcerous Burst and True Strike (2024) spell fixes. True Strike and Shillelagh require https://github.com/foundryvtt/dnd5e/pull/4388 to apply the ability change correctly.
- Spell effect for Faerie fire (requires ATL).
- High level bards would bring in duplicate Bardic Inspiration Actions. (2024)
- Wonderous item bags would not import as containers.
- Some improvements to bard feature processing.

# 6.0.7

- Eldritch blast would come in import with incorrect range.
- Items with healing would generate 1 too many activities.
- A large number of icon enhancements for 2024 class features.
- 2024 Wild Magic Sorcerer first pass feature refinement.
- Some work towards allowing spells to be added as activities to items rather than as spells that consume the items uses.

# 6.0.6

- Add blind beyond this radius to special field of appropriate monsters.
- Fix an issue where item importer would crash if using SRD icons.

# 6.0.5

- If you had a Light Perception already set in your default detection modes when using vision 5e some monsters would fail to parse if they had restricted vision.
- Paladin Auras would get their range scale set as uses.
- Light spell now has a macro to place lights via a template, or apply a light adjustment (or effect if using ATL) to a token.

# 6.0.4

- Adds the custom Activity to call DDB Macro functions and World Macros.
- Darkness spell, Arcane Recovery, Font of Magic, and Lay on Hands effect using said activity.
- Spell Enchantment and Summoning Effects. (Arcane Eye, Arcane Hand, Arcane Sword, Dancing Lights, Mage Hand, Shillelagh)
- Flame Tounge Weapons Damage Fix.
- Fixed a bug causing some item effects to not apply or parse correctly.

# 6.0.3

- Artificers would fail to import
- Some characters would fail to import with `null (reading load)` error message
- Some characters would fail to import with a ` RangeError: Maximum call stack size exceeded ` message.

# 6.0.2

- Cunning Strike, Devious Strikes implemented for 2024 Rogue.
- Psychic Blades for 2024 Rogue Soulbade.
- Some icon improvements.
- Some backgrounds would break the character import.
- Remove level number prefix from feature name in some classes.
- Fix for Eldritch Blast breaking import if some invocations selected.
- Spells: a huge number of effects added back in.

# 6.0.1

- Spell: Magic Weapon Enchantment, Elemental Weapon Enchantment.
- Fix for some parsing failing breaking if Token Magic was installed.

# 6.0.0

MAJOR BREAKING CHANGES!

The 4.0.x fundementally changes the structure of how documents are constructed in Foundry (allowing multiple "activities" per spell). You're existing imported content will migrate (mostly successfully); however, future imports from D&D Beyond will not match the current imports 1:1.

- Support for v4.0.0 of the D&D system.
- Many features and actions, such as Metamagic action/feature, are no longer duplicated.
- Features such as Metamagic will now import a feature called Metamagic with a full list of choices as a hidden text.
- Parsing with damage hints has been removed.
- Adds DDB Source to Source Book Registry.
- Source parsing will now useshort names rather than long names.
- Changes to default description processing for features on character import.
- Shadar Kai now gain resistance to magical sleep.
- Monster Muncher/Importer now batches monsters to reduce long UI pauses.
- The AC Min field is supported in effect generation.
- Massive improvements to wonderous/trinket item parsing.
- Fixes to the DDB button on monster and item sheets that could break the formatting of the sheet.

WARNING! Consider this a beta-level release - i.e. it broadly works, but there are known issues, and several features won't be working in 4.0.x for a few weeks (notably class, feat, background importing, and updating back to DDB).

There will be a period of frequent updates in the next couple of weeks as a bunch of basic missing effects are added and bug reports come in for misconfigured spells/items/features.

Many of the 2024 spells and features still need to be checked so may import incorrectly.

I shall be tracking the changes in the following github issue: https://github.com/MrPrimate/ddb-importer/issues/505 (and you can see some of the known issues there already).

If you find something that needs to be fixed, please comment in the discord #bugs channel or on the github issue as a comment.


# 5.2.36

- Item munch would not parse if source restrictions were selected.

# 5.2.35

- Some fixes for CPR application for Unarmed Strike when using Tavern Brawler.

# 5.2.34

- Fix dual class support for changes in data in 2024 DDB deployment.

# 5.2.33

- Some more updates to prevent 2024 classes and races coming through when using the muncher tool.

# 5.2.32

- Warding Bond macro fixes by @motomoto0295
- Prevents content from 2024 Basic Rules or PHB Handbook being imported through the muncher. If these items are placed on a character for import, the importer will attempt to process them, although probably incorrectly.

# 5.2.31

- Tweak to pateron check when generating summoned actors that was causing character imports to fail.
- Goggles of night equipped to characters would double bonus.

# 5.2.30

- Improve sense parsing in various failure states @sisimshow
- Fix for Witchbolt macro in v12 midiqol
- Tweaks to Druid Circle of Moon CR scaling.

# 5.2.29

- Small fix for Druid import warning/error for CR scale. @sayshal
- Small tweak to damage tag parsing

# 5.2.28

- Icons for features, items and spells will now always be downloaded to prevent failures with effect transference in v12.
- Lock DDB Importer to 3.x branch of the D&D System. The upcoming v4.x of the D&D system contains a complete rework of how features/spells/items work. DDB Importer won't work with the 4.x version of the 5e system till a supporting release is made. It will contain a large number of breaking changes. There will be limited releases of DDB Importer until the D&D 5e System 4.x to allow focus on refactoring.

# 5.2.27

- Fix potion of healing damage text parse.
- A spell from Book of Ebon Tides broke table parsing, parsing improved.

# 5.2.26

- Some tweaks for D&D system v3.3.0
- A bunch of icon corrections for effects in v12. @callbritton
- Add character class to spells when importing from a character from DDB.
- Conjure Spells will now use the CR conjuring system.
- Find Familiar uses summoning system.
- Arcane Eye, Arcane Hand, Arcane Sword, and Mage Hand have summons and basic JB2A tokens. More summons options if using the JB2A module.

# 5.2.25

- Foe Slayer effect from @motomoto0295
- Option to preserve XP on character import @pwim

# 5.2.24

- Darkness Spell: in v12 will now use darkness lightsource. A Simple Macro will be added to the description to toggle placement/removal of the darkness light if not using midi-qol.
- Speed up parsing summon spells/features.

# 5.2.23

- Dark Ones Own Luck Effect.
- Character update to DDB would un attune items in D&D 3.2.
- Spell Effect Updates from Elwin: Hail of Thorns and Ensnaring Strike.

# 5.2.22

- Grim Hollow: Player Pack, basic support and improvement of resource parsing and linking.

# 5.2.21

- Dancing lights now uses the D&D Summons system to summon dancing light actors. Image kindly provided by the wonderful folks at JB2A. If you have one of the JB2A modules installed it will add a variety of lights to choose from.

# 5.2.20

- Fix for CPR failing in latest version for some items.

# 5.2.19

- Divine Smite improvements for midi users when targeting undead and fiends.
- Fixes for using CPR Medi-Kit when dynamic sync is on.
- Guardian Armor: Defensive Field healing value correction.
- Improve Aside handling in books such as Where Evil Lies.

# 5.2.18

- Fix compendium load fail.

# 5.2.17

- Sacred Weapon is now an enchantment, and if not using Active Token Effects, a Simple Macro is provided to toggle on/off the light emission.
- Add wealth dice to classes.

# 5.2.16

- Simple Macros: Spell Refueling Ring infusion, and Font of Magic macro.
- Some more fixes for self hosted proxy and summon importing.

# 5.2.15

- Background parsing was broken since 5.2.13
- In v12, folders created in adventure import would not nestle.
- Small and Tiny monsters will now keep scale 1. @dm.dk

# 5.2.14

- Artificier parsing could fail for characters with non-ddb items on them.

# 5.2.13

- Summons would fail to import if using custom proxy.
- New "Simple Macro" feature added that exposes some DDB Macros to users via the Chat Description. This is primarily targeted at users who do not exist within the Automation/Midi-Verse. The first of the macros provided here are for Lay On Hands and Arcane Recovery.
- Monks speed bonus was no longer correctly applying when DAE was not installed. @ rupertthegrell
- Auto generated active effects will now have the item/feature description/chat summary applied.
- Spell Effect: Tidal Wave
- Magic Weapon, Elemental Weapon and Shillelagh spells now use the Enchantment system to provide the effects/modifications.

# 5.2.12

- Heroe's Feast duration fix.
- Senses not been set correctly on imported characters with senes granted through race features.
- Race parsing will now add darkvision to a races senses.

# 5.2.11

- Flee Mortals! Villain monsters now parse Villain actions as separate actions. @supersallad I, er haven't checked all 300 odd monsters, so please let me know if any are not quite right.

# 5.2.10

- Could not select directory path if aws bucket config was not enabled.

# 3.2.9

- Fix Extra/Companion importing.

# 5.2.8

- Improve linking of spells to items if not using Magic Items module.
- Fix S3 bucket selection in v12.

# 5.2.7

- Some characters with item spells would fail to import.
- Some effects would fail to apply to spells, preventing character import.
- Improve some magic item uses.

# 5.2.6

- Reduce some false positive summons parsing errors.
- Spiritual Weapon forumla no longer worked in v12.
- Eldritch Blast did not parse a valid damage value if you didn't take Agonising Blast (crazy).

# 5.2.5

- Some rogue subclasses would fail to import.

# 5.2.4

- Some monster parsing would fail.

# 5.2.2

- Fix spell parsing.

# 5.2.1

- Some characters with duplicate spells would fail to import.
- Some characters with duplicate infusions would fail to import.
- Armour infusions would not add the AC bonus correctly.
- Some midiqol damage on save effects were not set correctly where the save damage was in the other field.

# 5.2.0

- Only supports D&D System v3.2 and higher
- Item proficiencies will now be set to automatic on import.
- New 5e Attunement system used for item attunement.
- Removal of Convenient Effects as a requirement for automation.
- Use the magicalBonus field on ammunition, armour and weapons.
- Correct weight generation for v3.2.
- Use new ritual only spell preparation mode.
- Adds some pre-requisites to start supplying enchantment effects for future updates.
- Fix dueling style applying effect and damage adjustment to weapons if not using midi.
- Rod of the pact keeper did not add spell save bonus correctly.
- Tattoos are created as Tattoo type is Tasha's Cauldron of Everything Module is active.
- A huge number of effect tweaks if not using MidiQoL.
- General improvements to item parsing quality.
- Monster like the assassin will now parse their sae damage into the other field, rather than as versatile.
- MidiQoL Automation effects: monsters with multi attack will now have the midi qol multiattack effect applied.
- Artificer Infusions are now created using the Enchantment system. This will create the infusions and granted features into the DDB Class Features compendium. (this will require appropriate permissions).
- Summons actors are now added to a compendium on import (DDB Summons).
- If you have access to appropriate monster art on DDB, this will now be added to the Summons (previously defaulted to mystery man).

# 5.1.28

- Fix Where Evil Lies Item imports.

# 5.1.27

- Monster features could be matched as a weapon attack, but they should be a feature, as they have a recharge. e.g. Giant Spider Web.
- If DDB Override item not found when mentioned on character, don't fail on import, but fallback to DDB item.
- Features sent to chat would be empty.

# 5.1.26

- Fix for Beholder Zombie Eye Ray macro
- Improve formatting for stat blocks in features such as the Steel Defender.
- The Lucky racial trait could be lost on import if you had the Lucky feat as well. Frankly this is a sickening combo.
- Some monster features which were saves would not calculate the correct damage in the rollable enriched field in the description. e.g. Mind Flayer Prophet, Mind Whip.

# 5.1.25

- Monster Effects: Beholder Legendary Eye Ray action will now roll Eye Rays macro.
- Thunder Gauntlets and Lightning Launcher change on DDB meant they are no longer importing as weapons on newer characters.
- Slight tweak for ability bonus effects (such as belt of dwarfenkind) if not using DAE.
- Global setting to append the Chris Premades description to the end of updated features etc. @arbordrake @sayshal
- Support for Chris Premades like Aberrant Dragonmark which are broken into multiple choices by DDB Importer will be consolidated into a single chris feature.
- Sacred Weapon Macro fix.

# 5.1.24

- Chris Premades now copies over scaling value for spells.
- Fix an issue with Weapon Attacks for monsters not pulling in effects from Chris' Premades.
- Spell Effect: Command (Based on work by @MotoMoto)

# 5.1.23

- Fix Soul of Artifice Bonuses.
- Artificer Max Attunement Slots now taken into account for effect generation.
- Darkness MidiQoL effect should work for player again.

# 5.1.22

- Some character would generate a "pool error" when importing. @neepsterix
- Infusions weapons would not import.

# 5.1.21

- Fix for Canaith Mandolin breaking item import if magic items was not installed.

# 5.1.20

- Chris Premades Monster Feature integration now allows pulling features from MISC and Gambits premades. @arbordrake
- Override Item Config error in some niche circumstances @sayshal
- Summon Monster parsing was failing for some versions of Draconic Spirit. @aura6931
- Beholder ray effect fixes following v5.1.19 @callbritton requires remunch of beholder.
- Canaith Mandolin Magic Item charge fix.
- Thrown weapons importing with incorrect ability set. @nikolai.sw

# 5.1.19

- Use damage roll enrichers in monster features.
- Creatures like the Helmed Horror would not add magical to the bypasses of their Damage Resistance.
- Some Legendary Actions were not created where there were duplicates @arbordrake

# 5.1.18

- Emergency correction for @lookup for hidden monster features.

# 5.1.17

- Resolve some character update bugs introduced with v5.1.15.
- Make monster and item names use @lookup in when hiding text from players.

# 5.1.16

- Creature Midi QoL auto effect generation broken by changes in v5.1.15

# 5.1.15

- Fix updating characters back to DDB for some actions such as Artificer Magical Tinkering and Rune Knight Runic Shield @deepfriedgnome @ohmygodwhat @dm.dk
- Some improvements to Eye Ray macro for Beholders etc, that includes better description parsing for Ray attacks, handles multiple targets, rolls damage to Disintegration.
- Monster feature descriptions will now attempt to parse out tags for rules references
- Reference parser will now and save enrichers where it can in descriptions.

# 5.1.14

- Fix missing read aloud boxes/asides in some imported adventures.
- Some monster features, such as a dragons breath weapon, would not always have the resource consumption correctly set on import. @usernym

# 5.1.13

- Improvements to Guidance cantrip effect.
- Draconic Resilience did not include bonus hp in effect due to recent ac effect fixes.

# 5.1.12

- More fixes for Chris Premades @sarelle

# 5.1.11

- Fix Confusion for Spectator/Beholder macro.

# 5.1.10

- Thunder Gauntlets and Lighting Launcher now parse as weapons rather than features.
- Fix typo in Spectator/Beholder macro.

# 5.1.9

- Missed broken manual cookie link
- Spell parsing would create duplicate tables
- More icons from @kaelad
- Some more Chris Premade fixes

# 5.1.8

- On character import update name choice was not respected on prototype token.
- Fix for somme touch spells not setting target correctly to 1 creature, e.g. Gift of Alacrity.

# 5.1.7

- Ensnaring Strike fixes from the wonderful @elwin1410
- More Chris Premades fixes, some monster actions such as bite or claw would pick up the wrong feature. @steve8887

# 5.1.6

- Some effects, noteably Magic Weapon, would not remove the magic property from the weapon when the effect ended.
- Fox for simple distance calculations (thanks @elwin1410 )
- Chris Premades monster parsing was not applying effects for all monster features.

# 5.1.5

- Bleak Cabal Void Soother fixes (thanks @motomoto0295 )
- Chris Premades fix for certain class builds @dead_sith @chrisleong @deadfacekh4no

# 5.1.4

- Handle some odd formating or Humblewood Monsters.
- Some Fey Ancestry traits don't grant sleep immunity, but it was applied by the importer. @babywashbear
- Some effects would not be auto generated for features when they should be.


# 5.1.3

- Aspect of the Beast: Bear effect. (Thanks to @motomoto0295 )
- When using Magic Items module, some items would not parse reset condition correcly, e.g.g Staff of Defence. @sarelle
- Some ChrisP additional items would not add. @sarelle @chrisk123999

# 5.1.2

- Default prototype token settings not picked up on actor/monster creation.
- Chris's premades application will now use Chris' Compendium priority list.

# 5.1.1

- From 5.1.0 monsters would parse damage with an erroneous `+ false` in their damage fields.
- Warcaster uses new concentration for effect.
- Two hidden settings for @motomoto0295, that will become more widely available later:
  - `game.settings.set("ddb-importer", "munching-policy-hide-description-choice", "XXXX")`, which can be NAME, TYPE, MONSTER, or NPC. This will set the value used in descriptions for the monster name when hiding the description for players.
  - `game.settings.set("ddb-importer", "munching-policy-hide-item-name", true)` which will hide wether the features name is included in the description.

# 5.1.0

- Only for D&D SYstem version 3.1 and higher.
- Advancement fixes for new version.
- Summoning Spells (Tasha's only right now) use new summoning mode.
- Many small tweaks for new version. Many macros changed around the new attack bonus changes.

# 5.0.1

- First pass code tweaks for v12 support.
- Long standing bug with compendiums appearing outside of D&D Beyond Folder on first load after creation. (Thanks kaelad02!)
- Some more error handling if comependiums contain custom items.
- For spells granted through feats that allow you to cast it using your spell slots, these will now be marked as prepared.
- Effects such as Green Flame blade would not work if Midi-QoL auto attack was disabled.

# 5.0.0

- Weightless Containers were not recognised.
- Some macro corrections for when using DDB Importer functions.
- Support for Adventure Muncher 2.0.0 and greater.
- You can disable greedy rule matching in the settings now. (This is where the importer tries to match rule names with the references in the SRD/System).
- A number of macro corrections for effects that did not add macros correctly, e.g. Witch Bolt.
- Character with an AC which had an override value in DDB would fail to import.

# 4.0.16

- Some spells such as Sword Burst or Word of Radiance would not come in with the correct target.
- In cases where using midi's activation conditions, these have now been moved to the midi flag.
- Sneak Attack effect for midi users.
- Homebrew creatures imported as companions would fail if a type was not set.

# 4.0.15

- Importing characters when replacing conditions with Convenient Effects replacing core effects caused issues.
- More corrections to the Aid spell effect.
- Incorrect armour advancements for multi-class classes (advancement on class, not proficiency on sheet).
- Actually working better Support for AC effects from things like Autognomes and Unarmored Defence.

# 4.0.14

- Armour of Agathys level scaling fix for core 3.0 bug.
- Better Support for AC effects from things like Autognomes and Unarmored Defence.
- Monster Munching will now generate condition effects for application manually if Midi-Qol is not installed. e.g. Wolf attack will get an effect that applies the Prone condition.
- Waterskins would fail to import.

# 4.0.13

- Attempt to resolve the Cannot convert undefined or null to object error.

# 4.0.12

- Some advancements should allow replacements, e.g. skills on backgrounds.
- Fighter Armor advancement was not parsed correctly.
- Fallback for class icons like Blood Hunter.
- Some effects generated incorrect macro calls if removing embedded macros.
- Spell-Refueling Ring infusions came in as bonus actions, not actions.

# 4.0.11

- Some items such as "Beads of ...", "Elemental Gem ..." and "Dust of ..." will now be munched as consumable items.
- By default "generic items", e.g. Belt of Giant Strength will not be imported (it's sub types such as  Belt of Giants Strength) will. There is a secret setting to enable these generics, run a macro with `game.settings.set("ddb-importer", "munching-policy-use-generic-items", true)`. @acaciagalagr @motomoto0295
- DDB Importer will add missing languages it knows about on D&D Beyond to a new section in the languages config for D&D System. You can disable this in module settings.
- If midi-qol and CE were installed, status effects would still be generated for effects using statuses rather than CE macros.

# 4.0.10

- AC Formula Effects which Override will now do a max against `@attributes.ac.armor` to make sure the best value is selected.
- MidiQoL Overtime effects on monsters could be duplicated in some instances.
- Experimental: Remove embedded macros for Midi-QoL effects (module setting). Will call functions within DDB Importer rather than item macros. Big size reductions for automation heavy characters. Probably bugs.
- Background munching: Background munching will now attempt to add advancements by parsing the HTML description. Variable success.
- Heavy Armor Master generated bad effects that could break characters.

# 4.0.9

- Psychic Blades now parse as weapons rather than features.
- Some template string parsing changes.
- Some reference look up elements were added for elements that did not have refences, e.g. radius.

# 4.0.8

- Accept better parsing of DDB Character URLS.
- Phantasmal Killer rolled damage on cast as well as turn end.
- Weapons will not have the "Uses prompt" disabled by default.
- Hound of Ill Omen did not consume Sorcery Points.
- Fix for log download generation @filroden

# 4.0.7

- New Adventure Import Option: Import Journals and Tables to Compendiums. A new option will import Journals and Tables into Compendiums for you on import. Useful if you say, want the PHB accessible, but not in your world.

Before you rush to import all your books, I would urge you to wait a week or two as enhancements to Adventure Muncher are forthcoming to improve integration and references with the new 5e rules references.

# 4.0.6

- A fix for the merge of Kgar's tidy sheets in to "Official" Tidy sheets.
- Character sheet favourites are preserved.
- Some customer magic items would not import if rest type was set to dawn rest.

# 4.0.5

- Refactor reference linker to prevent things like the `Cone` linking happening before spell linking breaking things like Cone of Cold.
- Some races like Loxodon added Trunk as a weapon, the generation of this feature failed in the v3.0.x system resulting in bad character imports.

# 4.0.4

- Conditions are applied correctly when importing and updating a character.
- Changes to Item Macro caused importer crash.
- Wrath of the Storm fixes.
- Spell names in items will (mostly) be replace with links to any spells munched into the DDB Compendiums.
- First pass at improved rule matcher, will now attempt to use the hover references rather than linking to SRD when importing.

# 4.0.3

- Some actions would not pick up the correct ability score.
- Compendium folder creation is enforced for Class, Class Features, Race, and Racial Traits.
- Effect overhaul to remove most DAE requirements from basic effects.
- Trinkets and clothing such as bracers of defence did not generate AC bonus effects.
- Global Effect bonuses for spell attacks improved.
- Removed signed bonuses on effect generation.
- Features should be more consistently added to the relevant sections in the character sheet.

# 4.0.2

- Resoruce handling dialogue now has a Remove option, there is a setting to choose if you want to show/hide this by default on new characters. This is now set to hide as default.
- Improvements to Magic Item uses and recharge parsing, for both characters and compendiums.
- Equipment that is not armour, would import as armour.
- Weapon properties did not always process.

# 4.0.0/4.0.1

- Great Weapon Master and Sharpshooter no longer rely on CE.
- Effect: Heroism updated to MidiQoL Overtime effect
- DDB Importer v4.0.0 no longer supports Foundry 10, or 5e versions earlier than v3.0.0.
- Item Containers/Collections module is no longer supported in favour of native Foundry containers.
- Race and Racial Traits now import into compendium folders.
- Many more effects will now be created, especially for spells, where midi is not enabled.

Note: There are still a number of improvements to come over the coming week(s) to the new rule referencing techniques in descriptions and journals.

Conditions/statuses won't get added on character import right now.

There are likely to be a number of other smaller things, please raise as issues. But this should be enough to get folks going again!

# 3.7.17

- Tool to add prices to items as per Xanathar's Guide on the Tools tab.
- First pass at adding sub types to class features for imported characters.
- Removed some dead code from template string parsing that is not needed in newer 5e system.
- Caught an edge case in template strings where it wanted a max value between two modifiers, e.g. for Psychic Blades.
- Psychic Blades attacks now import as Melee Weapon Attacks rather than ranged, as they are thrown weapons. Fix for midi-qol applying disadvantage when used in Melee.
- Tweaks to class feature parsing when importing characters.
- Javelin of Lightning effect fixes
- Monster effect: Ray effects for Beholder, Zombie Beholder and Spectator. @tminz
- Monster effect: Spell Reflection.
- Language changes around Active Effect generation.

# 3.7.16

- Fury of the Small, remove redundant macro.
- Battle Master and Rune Knight did not get full dice advancements.
- Some size effects for Giant Barbarian.
- Some improvements to template string parsing for fixed values.

# 3.7.15

- Better handling of class identifiers for scaling values if they have non-alpha characters.
- Prevent error when updating character as a player without filesystem browse permissions.
- Divine Favor effect left in default damage.
- Stones Endurance effect used a d10, instead of a d12.
- Monster: Fathomer spell parsing.
- Monster: Clay Golem Haste feature was parsed incorrectly as a bonus action.
- Monster: Ankheg Acid Spray did not import as a 30ft line.
- Kgar Tidy 5e Sheet: add spells to class spellbook.

# 3.7.14

- If generating effects the MidiQoL Confirm Targets and Remove Chat card button settings will be set to "Midi Settings".
- Small compatibility fix for use with Note Licker to prevent note number appending in some scenarios when DDB Importer and Note Licker are both active.
- Giants Might effect tweaks.
- When munching Class Features on v11 it will now create compendium folders for class and subclass features.
- When munching classes and subclasses, subclasses will be placed into compendium folders (v11 only).
- Support for new Kgar Tidy5e sheet.

# 3.7.13

- Featues which should be weapon attacks such as the Soul Knifes blades were coming in as Other features rather than weapons.
- Tweaks to spell slot generation.
- If using Item Containers, support import of currency in containers into item (otherwise will be added to character in Foundry..)
- Support sync of currency for containers back to DDB if using Item Containers.
- Fix for some Tasha's optional character features causing import failure. @alpacacin0

# 3.7.12

- Enable Maneuver effect generation for Martial Adept features.
- Move most effects to use `MidiQOL.displayDSNForRoll` when rolling dice for effects.

# 3.7.11

- If not using Vision 5e, token settings were not always retained.

# 3.7.10

- Feat Trait advancement for Custom Lineage when importing a character. @gandamir
- Optional Class Features would import without level restrictions since class feature refactor. (v3.7.0) @gandamir

# 3.7.9

- Some limited use features, such as Eyes of the Grave stopped parsing. @gandamir

# 3.7.8

- Tweak for handling cases where the classes compendium contains classes not imported from DDB.
- Radiant Soul effect generation failed.
- Some subclass features could not be matched for Template String replacements in descriptions, e.g. Draconic Resilience
- Infusion effect generation did not apply ac effect to shields/armor infused with Enhanced Defense.

# 3.7.7

- Character Import: Some feature options that were nested choices such as Genie's Vessel: Genie's Wrath would not import since class feature refactor. (v3.7.0) @blackbeltblakey
- Some variants of Wild Shape companion generation would fail. @ryn987
- Some use values were not calculated, if max uses was say `@prof` rather than a fixed int.
- Item and Resource 5e will now link if the Override compendium replaces a resource.
- Feature Effect: Fury of the Small (both versions) based on effects by @motomoto0295
- Feature Effect: Intimidating Presence by @motomoto0295
- Spell Effect: Confusion: update of macro by @gambit07
- Feature Effects: Many, many effects for the Path of the Storm Herald by @motomoto0295

# 3.7.6

- Some modifiers were not always parsed when granted by a chosen class feature such as the Genie Kind resistance.
- Simple or Martial Weapon proficiency would be added as a custom proficiency and a chosen one.
- Auto effect generation that created advantage based saving throws would not create advantage saving throw changes.

# 3.7.5

- Fixes for Campaign mapping causing issues opening core settings screen.
- Eyebite macro fixes
- Reach weapon property is set incorrectly on a lot of monster parsed features and actions (for Mr Ponsney)
- Small macro tweaks
- Retain more token data on characters when importing, if not relevant to import, such as Vision Angle. @rudecanine
- Some template string improvements.

# 3.7.4

- Some v10 compatibility improvements.

# 3.7.3

- Some small improvements to the campaign fallback UI to ensure that its obvious a campaign is still selected if the campaign list fails.
- Witch Bolt will now prompt the user who cast the spell rather than the GM if they wish to sustain the spell. (requires socketlib)
- Green flame blade will once again prompt user who cast the spell for secondary target rather than GM.
- Some custom backgrounds would not parse.
- Enhanced Ability macro fix.

# 3.7.2

- If the DDB Feats compendium was empty, classes, races or backgrounds which granted feats would cause the import to crash.

# 3.7.1

- Fix for races failing to parse when using Feature Munching.

# 3.7.0

WARNING, significant widesweeping changes to Character parsing!


- Internal effect helper remaster to improve maintainability and use going forward.
- Base class features were duplicated by subclasses during class/class feature generation.
- Massive rework of class parsing in the muncher. This helps support 2.4 and also improved class/feature parsing in the future.
- Character Import: Support for Save Trait Advancements on Classes in 5e 2.4.
- Character Import: Support for Language Advancements on Classes in 5e 2.4.
- Character Import: Support for Skill Trait Advancements on Classes in 5e 2.4.
- Character Import: Support for Ability Score Advancements on Classes in 5e 2.4.
- Character Import: Support for Expertise Advancements on Classes in 5e 2.4.
- Character Import: Support for Tool Advancements on Classes in 5e 2.4.
- Character Import: Support for Armor Advancements on Classes in 5e 2.4.
- Character Import: Support for Weapon Advancements on Classes in 5e 2.4.
- Character Import: Support for Damage Resistance/Vulnerability/Immunity/Conditions Advancements on Classes in 5e 2.4.
- Character Import: Support for Skill, Tool and Language Advancements on Backgrounds in 5e 2.4.
- Character Import: Support for Skill, Tool, Feat and Language Advancements on Races in 5e 2.4.
- Fixes for AC bonus field changing to string when using the system without DAE.
- Active Aura Effects were not applied to Paladin Auras.
- Correction to Grease style AA macros.
- Monsters display legendary resources on bar2? (Like the SRD Monsters) did not set the setting due to typo. Can't believe none of you spotted this till now!
- Improved table linking to compendium to use UUID over name where possible.
- Aura of Hate Effect.
- Lifedrinker Warlock pact feature would apply `@mod` instead of charisma damage as a bonus, which was wrong if your str/dex is higher than your cha.
- Character Import: if a custom action had the same name as a feature, it could cause parsing issues.
- Ice knife macro fix for v10.
- Improvements to template string parsing, these are the dynamic blocks in descriptions, e.g. the dice value for sneak attack is evaluated.
- Improve Frightful Presence (thanks @MotoMoto)
- Condition immunities on characters did not always parse correctly.
- Fix tool proficiency and tool expertise on characters.
- In 2.4 you can now use the new chat description functionality to add the snippet there.
- Effect: Blindness/Deafness Macro fix.
- Magical Staves now have `+ @mod` added to their damage calculation.
- Character import conditions: Immunity to Disease was not always detected.
- Parsing TemplateStrings for Elemental Cleaver is fixed.

2.4 Note:
Class/Race/Background Advancements are not yet generated through direct Feature import, but the work here is a big step to enabling that. There are outstanding advancement improvements to come: Equipment and Feature Choices such as Fighting Style, Granted Spells for some races.

# 3.6.0

- Basic support for 5e 2.4 Races (creates a race and sets creature type), ability and size advancement stubs.
- Support for some loot type subtypes in 5e 2.4
- Planar Warrior effect tweak to ensure extra damage after macro refactor.
- Giants Might Effect: now does crit damage.
- Some macro corrections for switching to DAE macro flag (mainly booming/green flame blade)

# 3.5.9

- Sleep Spell Effect improvements for elfs and half-elfs
- Stone of Good Luck no longer needs a initiative boosting effect separately to checks.
- Mask of the Wild effect: PC's and NPC's will now roll stealth if this ability is clicked. (Thanks @MotoMoto)
- Rahadin Deathly Choir effect exclusions (Thanks MotoMoto)
- Item parsing failed if using DAE but not midi.
- Effect: Ice Knife Collision Detection updates.
- Switch to using DAE flag macros rather than itemacro if using newer versions of DAE.
- Effect: Strahd Zombie Loathsome Limbs
- Effect stub: Partially Amphibious.
- Shifter effect correction.
- Vedalken Dispassion effect.

# 3.5.8

- Autumn Eladrin now have correct level spells for Cure Wounds.
- Custom actions with no descriptions would cause import failure.
- Link Adept Marksman resources for Gunslinger subclass.

# 3.5.7

- AC corrections if not using any effect modules.
- Loxodon Trunk feature can now be used as an unarmed attack, as nature intended.
- Hold breath stub effect.
- Missing dragonborn feature icons.
- Some improvements to dynamic value template parsing in DDB descriptions.
- Dragon Born Breath Weapoin corrections for Fizbans.
- Hold Breath effect: toggle effect.
- Potion of Speed: Effect.

# 3.5.6

- Some features with choices, such as Kobold Legacy feature would get feature name twice in feature name.
- Improve handling of Spell Scrolls when syncing back to DDB.
- Feature corrections: Song of Rest.

# 3.5.5

- Haste spell effect duration was set to 10 turns not rounds.
- Keep Campaign ID when Campaign Loader fails when opening core settings.
- Crown of Thorns Macro would not use the correct ability mod for attack.
- Fix for Shields and Armor gaining effects for their magical bonuses since 3.5.3. Whoops.

# 3.5.4

- Allow Avatar and Token swapping to both be enabled.
- Chris Premades Support: Sneak Attack would not match on Monsters.
- Chris Premades/Monster Item import: When monsters are moved from the DDB Compendium to the world, DDB Importer will attempt to fix the origins of effects it has generated, if possible.
- Items with prices in silver pieces would be 10x more expensive than they were supposed to. Blame inflation.
- Refactor to bonus damage effects, due to changes with ddb modifiers effecting the Dueling fighting style and similar.
- Effect: Mind Link

# 3.5.3

- Character effects: Empty custom tool proficiency effects could be generated for some features.
- Character and item effects: removal of some legacy AC effect generation, and some code clean up in this area. AC effects are always generated now, as they are supported "out the box", and generally expected in core. This will be expanded to more effects that don't require DAE in the future.

# 3.5.2

- D&D 5e minimum bumped to v2.2.1
- Updates to handle tool proficiencies changes in newer 5e versions.
- Prevent Active Aura effects like Web asking for useage/consume resource dialogue when spell has uses/resource link. @turin8565
- Fix HP total when using rolled HP on DDB.
- If using rolled HP DDB Importer will use the average hp on the class levels, except the first level which will get the remainder as well. You can disable this functionality and force the HP to be placed into the Max HP Override instead by using the hidden setting `game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp")`. @dineshm72 @darkinsanities

# 3.5.1

- Monster feature effects: improve parsing of invisibility to handle situations for things like the Poltergeist which are always invisible, and the Pixie which has Superior Invisibility.
- Active Aura Effect fixes: Changes in DAE caused Active Aura effects to stop working correctly.
- Monster feature effects: Reckless. @dineshm72
- Adventures imported to compendiums would not have actors placed on scenes.

# 3.5.0

- Fix for adventure importing in newer Foundry v11 where ActorDelta could end up null and no synthetic actors would be created.

# 3.4.78

- HP will no longer set max, will generate effects for hp bonuses like Toughness and Draconic Resilience when using effects.
- Some features with double ''s in them would not get an icon.
- More improvements to feature parsing in monsters.
- Fixes for Planar Warrior Macro
- World Macros not created, which were needed for some spells.
- World Macro permissions set correctly.

# 3.4.77

- Small monster parsing fix for custom monsters with slight variations in formating. @sami1737

# 3.4.76

- Monster parsing: a few more charge detection tweaks.
- Move custom name alteration to later in the parsing process for items, to prevent parsing issues for some items where a custom name has been applied, e.g. Waterskin. Issue #401.
- If using Vision 5e monsters which are "blind beyond radius x" will have limited vision applied to their prototype token. @dineshm72
- Ensure removed custom AC effects no longer get added
- Typo caused all monster actions to have charges set.
- Overtime effect generation was adding a duration to all monster actions incorrectly.
- Lots of new monster feature icons from T-Whiz

# 3.4.75

- Size fix for Harengon
- Improve AC calculation for Dragon Hide feet.
- Tweak to action sync to D&D Beyond to handle some edge cases.
- Fix some misses when removing recharge uses from monster feature names.
- Monster parsing: improve feature name detection where there where `;` in the names inbetween parenthesis.
- Monster parsing: fix Priest of Osybus (Deathly), Circle of Death spell parsing (it parses as an action).
- Monster parsing: improved recharge detection (e.g. web on  Drow Arachnomancer)
- Monster parsing: creatures like the Oni with Magical Weapons will have their weapons marked as magical.
- Character importer: features like the Hobgoblin "Fey Gift: Hospitality" will now attempt to use @prof instead of a hardcoded proficiency value.
- Waterskin moved back to food consumable, and set to 4 charges.

# 3.4.74

- CORS proxy changes.

# 3.4.73

- Some creatues such as the Shadow Mastiff with odd damage resistances would fail to parse if Midi was active.

# 3.4.72

- Emergency patch: class muncher only wanted to import clerics. All Cleric Party?

# 3.4.71

- Improvements to Fire Shield effect to automate damage based on macro by @thatlonelybugbear
- Spike Growth Macro improvements.
- Macro effect generation code refactor, possibly breaking change (as in bugs introduced).
- Little Giant now applies Powerful build
- Some races with variable sizes, like the Hadozee, would not import the small size.
- Hadozee Dodge effect.
- Dancing Lights effect tweak (thanks @tminz)
- Support Tavern Brawler special trait
- Fixes to a handful of monsters with weird spell descriptions which no longer parsed. E.g. Faerie Dragon and  Sephek Kaltro.
- Ensure transfer effects are transfered to actors when using Chris' Premades with the Monster Muncher.
- Flesh to Stone effect fix.
- Improve monster effect generation for features such as the Myconid Adult's Pacifying Spores. It will now set a round and seconds duration, and on the item/feature will adjust the duration if it had been parsed as an instantaneous effect.
- Character Updater to DDB: improve updates where items have been dragged from other characters, or container definitions are bad.

# 3.4.70

- For some Third Party Adventure enhancements, tokens would not link correctly.

# 3.4.69

- Encounter Muncher would not run.

# 3.4.68

- Effect: Frightful Presence (Dragons) improvements.
- Giff will now get Powerful Build special trait.
- Effect: Deft Strike effect.
- Vision 5e improvements to setting Vision for monsters when Vision 5e is installed.
- Some macro call changes for upcoming feature.

# 3.4.67

- Will embed spells in magic items if using magic-items-2 module. (Character imports only).
- Refactoring some code for future improvements.
- Reverted tweaks to import process, based on timings and oddities from some users.

# 3.4.66

- Venom troll, venom spray correction.
- Some more background macro changes for upcoming enhancements.
- Black Tentacles, spell corrections
- If Vision5e was enabled, characters would get senseAll rather than blindsight, if they have blindsight.
- Effect: Mantle of Spell Effect was utterly barmy. No idea what I was doing when I wrote that... 3 years ago!

# 3.4.65

- Corrections for accidental creation of many JB2a actor folders in 3.4.64 if using JB2a.

# 3.4.64

- Fix a potential slow down issue which left lots of unnecessary hooks around after munching.
- Some tweaks to the import process that will hopefully improve the speed when updating.
- Improvements to importing adventures in v11.
- Arcane Recovery will now detect if you have an Arcane Grimoire attuned and grant a bonus.
- Remove hard dependency on Item Macro for effects in v11 (DAE now provides an editor).
- Some preliminary work for upcoming macro enhancements.
- Some bonuses, such as the chronurgy wizard initiative bonus, would add proficiency incorrectly.

# 3.4.63

- Legendary resistance effect was no longer working properly.
- Small tweak to detecting primary spellcasting ability, that now defaults to the value set by the subclass rather than class. This is used by some custom subclasses that might change the default value. @sayshal
- Booming Blade/Green Flame Blade no proficiency on attack roll work around.
- If applying effect using the API or Chris' premades, effects will only be stripped from documents if ddb importer of Chris' module apply/generate effects for that document.
- Fix the use of some spell effect macros, such as Eyebite, where the NPC is using spellcaster scaling, as opposed to a fixed dc.
- Absorb Elements effect is now closer to MidiQoL default and includes bonus damage and resistance.
- A number of small macro tweaks.
- Effect: Dancing Lights (kindly based of a great macro by @tminz), this is the first effect DDBImporter implements that requires Warpgate. It will only be placed onto the item if Warpgate and a JB2A module is found.

# 3.4.62

- If applying effects via api, chris' effects would not apply to items or spells
- Primal Savagery, correct targets and range.
- Daunting Roar effect.

# 3.4.61

- Green Flame blade macro threw an error when using automated animations, due to changes with animation config.
- Items ignored by import would be ignored, but also duplicated.

# 3.4.60

- Spell Munch was broken.

# 3.4.59

- BREAKING CHANGE: Most items which were previously loot, are now consumables. Please let me know if you think anything should change type.
- Fix for dex save penalty for slow spell effect.
- Order of the Profane Soul will set Pact Spell level correctly if munching with effects on.
- Frostbite effect: some combinations would not allow effect to remain for the correct duration.

# 3.4.58

- Misty step effect not applied if using Automated Animations as it has better built in support.
- Quasit effects for Claws.
- Invisibility feature effect (not spell), for monsters.
- Ensure proficiency bonus to initiative is added to effects (Harengon).
- Improve checks for language modifiers that are not set, or shouldn't be present on DDB.
- Fix a bug that duplicated race granted cantrips, and could result in re-import failing.
- Improvements to spells granted by feats that add to spell list as well as a use per rest.

# 3.4.57

- Back fix for ddb effect addition in v10.
- Fox when applying ddb effects to Sneak Attack.

# 3.4.56

- Fixes for adding ddb effects to non-ddb actors

# 3.4.55

- Corrections for when calling some aura macros when not embedding ddb macros (will require reimport/munch) for spells to pick up these changes. Only needed if experiencing problems, e.g. with Web spell.

# 3.4.54

- Default door sound added to DDB Maps.
- Some code refactoring
- Fix a journal page find collision when using THird Party Adventure Munch
- Allow users to sync character back to DDB using their own patreon key, this can be set in the Advanced tab of the character.

# 3.4.53

- Correct "Chain Shirt" icon for monster items. e.g. on the Goblin Boss.
- Effect: ZephyrStrike now handles crit dice correctly.
- Update to DDB: Add option to ignore items, update items created via effects to be ignored by DDB Importer. @Galag'r

# 3.4.52

- Correct class name on flag data for class features for @kaelad

# 3.4.51

- Tweaks to create bonfire and active aura template spells.

# 3.4.50

- Monster sense parsing. If Vision/Detection modes 5e is installed, then don't add detection modes to monsters.
- Adamantine Armor and similar now will add midi-qol effect.

# 3.4.49

- When using Chris' Premades if more than one document had the same effect it could cause issues.

# 3.4.48

- Chris's Premades would not always capture all feature types when applying via the medkit pack.

# 3.4.47

- When applying Vision/Detection Modes 5e effects spell targets will be set to self.
- A fix for third party munch where the importer could choke on actors taht are not from DDB. @Amphibicat

# 3.4.46

- Chris Premade effects would not apply to characters if the option was not selected in the muncher.

# 3.4.45

- If using Chris' Premades with Items With Spells, som items would fail if effects were applied to the spells loaded by items with spells.
- Vision 5e stub effects would not apply to items or spells munched into compendiums.

# 3.4.44

- Some Artificer Infusions still causing problems with flag depths in v11. @ItsScottish
- If 3d canvas, mapmaking pack, and  3d token compendium are installed then the importer will do a search on monsters when they are imported to add a default monster model. It will only do this if one does not already exist on the monster in the compendium.

# 3.4.43

- When using Items with Spells some items, notably Staves, would not get the charges for spells linked to the item charges.
- Artificer spells now force the M/material property for components.

# 3.4.42

- When importing inventory/weapon items from compendiums, typically the override compendium, they will now retain the compendiums `uses`, `consume` and `ability`.

# 3.4.41

- Effects: Fix Darkness macros for v11.
- Character: School of Enchantment: Hypnotic Gaze incorrectly set limited uses.
- Monster effects: MidiQoL `actionSave` effects. The parser will try and add overtime effects for saves where characters can use their action to shake off an effect such as the Deathlock Mastermind Grave Bolt.
- Monster ffects: Skeletal Juggernaut (Thanks @MotoMoto)

# 3.4.40

- Fix "You can not import a Promise Document" bug.
- Bump to support removal of Compendium Folders requirements for Chris' Premades.

# 3.4.39

- BREAKING: A change here forces Wonderous Items that are containers to always be backpack type. Previously they were equipment/trinkets. This will cause full replacements when the items are munched into compendiums.

# 3.4.38

- Fix for when using Compendium folders and Item Collections on v11.
- Effect: Prevent Prone removed on Hideous Laughter Save
- Effect: Initiative bonus for Guidance spell.


# 3.4.37

- Some abilities with a flat save would parse the save number in the field rather than "flat". Potent Poisoner is the only ability that I have discovered with this trait so I think the impact is small. @sage9001
- Fix a bug where items with a linked resource when using Chris's Premades and Link Item and Resource 5e module would not link.
- Copy levels for classes if pulling from compendium.

# 3.4.36

- When monsters are pulled in via an adventure or encounter the skills would not parse expertise correctly.

# 3.4.35

- The check to copy the flag over to the new item to see if it should ignore a Chris's Premades was happening after Chris's Premades have been applied.
- If Vision/Detection Modes 5e module is installed, DDB Importer will add stub effects to feats and spells it knows about for the module to use.
- Status effect tweaks in v11.

# 3.4.34

- Monsters: Fix parsing of monster features which can be used two handed and do a secondary damage such as the Astral Elf Warrior.
- Fix up creation of folder to match changes in v11.302 of Foundry.
- S3 uploads should now be as efficient in v11 as they were in v10 due to fixes in Foundry v11.302, this version of DDB Importer will not work with S3 uploads a v11.301.
- Monsters using the generic DDB tokens will now download only a single token, rather than one for each monster, where it can determine that images match (still a few edge cases).

# 3.4.33

- Nasty hack for S3 bucket bugs in v11.
- Update Journal Anchor Links/Slug selection to use a drop down.
- Thorn Whip is now a melee spell attack.

# 3.4.32

- Fix for compendium folders and moving Wands and Rods to consumable items rather than trinkets to support D&D system 2.2.1 changes.

# 3.4.31

- Effect: monsters with Uncanny Dodge will get the Uncanny Dodge effect on the actor item.
- Monster effect: Bard Taunt. (thanks @Moto Moto#0295)
- Wands and Rods are now consumable items rather than trinkets to support D&D system 2.2.1 changes.
- Monster effects: Venom Troll (thanks @Moto Moto#0295)
- Support special override properties for some Chris Premades such as Steal Defender Uses.

# 3.4.30

- Effect: Steady aim improvements. (thanks @Moto Moto#0295)
- Error when uploading a character with a buff that increase temporary Max hp #336
- Temp Max HP is no longer added to Max HP when imported via the muncher, but just added to temp max hp field.
- Effect: Greenflame blade tweaks
- Monster actions: Regain healing actions without a dice roll such as the Champion's Second Wind now parse the correct value, and set to target self.
- Monster actions: actions which are spell attacks did not parsed as equipped if they are coded as weapons, which confuses some poor, poor automation software. They are now equipped.
- Monster actions: actions where are spell attacks now have midi magical effect and damage tags set.

# 3.4.29

- Monster spells would check item mappings first for icons, rather than spells, resulting in a bad shield icon for monsters such as Mage.
- Monster Midi effect generation will now add an Overtime effect where the ability grants a save at the beginning or end of the turn, such as Carrion Crawler Tentacles Attack.
- Effect: Stone Skin improvements for newer DAE/Midi support. (thanks @Moto Moto#0295)
- Effect: Reckless attack improvements. (thanks @Moto Moto#0295)

# 3.4.28

- Some macro tweaks thanks to @Chris#8375 and @Elwin#1410 for respecting critical damage settings better.
- Spike Growth effect now deals correct damage again. (CHanges in ActiveAuras for v11 caused double damage).
- In v11 Encounter Muncher no longer showed up as a button.

# 3.4.27

- Effect: Deflect Missiles tweaks from @Moto Moto#0295
- Way of the Kensei: missing feature icons (thanks @Moto Moto#0295)
- Effect: Patient Defense

# 3.4.26

- Broken artificer infusions in v11

# 3.4.25

- Duergar Warlord Psychic-Attuned hammer did not parse psychic damage.
- Some monster such as Duergar Warlord have "plate mail" rather than "plate" as the armor type and would not detect that armor item correctly, they now do!
- Some monsters like Warlock of the Fiend did not always parses uses correctly for some features like Fiendish Rebuke.
- Holy Fire icon.
- Improvements to detection of healing only monster actions.


# 3.4.24

- Branding Smite and Thunderous Smite effects did not do crit damage on a crit.
- Monster features such as Warlock of the Fiend Hellfire parsed the second part of a saving throw damage into the versatile field rather than as an additional damage part.
- Fix for macro changes in newest DAE/Midi releases. @dinesh#9364
- Some improvements for Chris Premades name matching.

# 3.4.23

- Effect: Greater Invisibility Corrections.
- Spell: Ice Storm: fix scaling damage.
- Effect: Nilbog Reversal of Fortune.
- Effects: updates for latest ActiveAuras.

# 3.4.22

- Effect: Psychic Scream Spell (Thanks @Moto Moto#0295)
- Nilbog Reversal of Fortune is now a healing action.
- Effect: Sacred Weapon: fixes.
- If using AC Items mode in Monster importer, some npcs with no items would be set to flat rather than natural ac. (Natural AC is prefered here as things like ac bonus will not work on a flat ac npc)

# 3.4.21

- Counterspell, Feather Fall, Slow Fall, Swiftstride Reaction, and War Caster set to manual reaction type for midi-qol.
- V11 Support: Support top level folder for compendiums.- V11 Support: First pass of macros.
- Note: Current aim is to maintain v10 and v11 compatibility within the module, baring any unforeseen changes or difficulties.
- Some changes to the locations of undocumented apis. Unlikely to impact you.
- V11 Support: Native compendium folders.

# 3.4.20

- Witch bolt macro tweak to end effect as GM.
- Update ATL flags.
- Some changes for effect support in upcoming v11.
- Global setting to use Convenient Effect Toggles for conditions rather than links to the SRD rules. @MaxPat#7936
- Tweaks to deflect missiles attack to move to manual reaction if using midi effects.
- Deflect missiles effect removes damage.

# 3.4.19

- Ice Knife effect will now correctly target creatures larger than medium that are in the blast radius.
- Fix breaking change in midi if using the option to not embed macros in items.
- Try adn reduce API calls for folder checking ont The Forge.
- Starry Form actions no longer link to Wild Shape resource consumption. @Whirling-In-Rags#8302

# 3.4.18

- Form of the beast effect
- Tweaks to Thunderclap and Sword Burst spells if using midi effects to better use midi features.
- Healer's Kit will add charges.
- `addDDBIEffectToDocument` failed for some items. Issue #322.

# 3.4.17

- Some adventure muncher scenes with tiles would not import the tile, if the tile config was generated in v10 of Foundry.
- Effect: Hail of Thorns provided by the delightful @Elwin#1410

# 3.4.16

- Some improvements for future adventure muncher changes.
- Some icon updates for spells from @Raccoomph#8480
- Healing light damage type changed to healing.
- Haste effect has duration explicitly defined.
- Items can be configured to not apply Chris's Premade effects to that explicit item.

# 3.4.15

- Better handling of table errors
- Fix Tidy 5e favourites been lost on reimport.
- If an ability grants advantage on a skill, it will no longer double up on passive bonus if using midi. @Chris#8375

# 3.4.14

- Disable resources did not work as intended - blanked resource selection instead of retaining existing values. @Allffo#0001
- Token Image update setting for monster muncher will now correctly retain prototype token settings other than senses and detection modes. @TheEvilSquid#1034
- Sleep Effect no longer needs to force Prone condition.

# 3.4.13

- Suave Defense will now add to monster AC correctly.
- Chris's Premades replacements now supports Chris's Feats.
- Improvements to iconizing effect icons on monster effects.
- Catapult spell should have midi no damage save flag set.
- Small improvements to the DDB Template String parser for text descriptions of dynamic values.
- Evasion Effect

# 3.4.12

- Invisibility spell with expire with with a spell or attack.
- When calling the Chris Premades actor update function, it would fail (typo).

# 3.4.11

* Slight tweaks to scene update tools (no functional change).

# 3.4.10

* A race condition could cause character imports to fail.
* When munching monsters with Chris Effects, effects could be pulled in for the wrong monster.

# 3.4.9

* Deep Image Paths! Store your monster/item images in deep paths. This will be turned on for new worlds/games, but needs to be manually enabled in the Importer Directory Location settings. This will then store images in folders relating to image type and monster type, e.g. `monster/token/aberration/Elder-Brain-Dragon.jpeg`. @drowbe#2787 @YakFromStateFarm#4001
* Ray of Frost duration effect increased to 2 to allow proper use of midi termination condition. @Tal Maru#0339

# 3.4.8

* Improve Pack Tactics effect.
* Green Flame Blade Effect - Tweak animations for recent versions of Sequencer.
* Darkness spell tweaks for breaking changes in Advanced Macros.
* Fix for campaign selection not always saving campaign value.
* Supported for specific class/subclass/racial feature replacement with Chris's Premades. e.g. different versions of bardic inspiration depending on the subclass chosen.

# 3.4.7

* When placing new notes with anchor links, it was possible to update many notes with the incorrect anchor link.

# 3.4.6

* Improvements to item matching for Chris's Premades.
* Zephyr Strike effect improvements.

# 3.4.5

* Slight code rewrites
* Better handling of Alert and initiative bonuses if not used DAE.
* Passive bonuses now added to skills.
* Observant feat is no longer selected as a special trait, but the bonus applied to the skill.
* Armor of Agathys set to util to avoid scaling issue in core for healing spells.
* Fallback to manual campaign ID entry if campaign api endpoint unavailable.
* Duergar's "Enlarge" and "Invisibility"  unaffected by the importer's strip recharge information from item name feature.

# 3.4.4

* Match renamed items in Chris's Premades.
* Chris's Premade will now add and remove features, e.g. Arcane Armor makes a number of substitutions.
* Rage effect now has the tokenMagic outline.

# 3.4.3

* Tweaks to Flame Tongue weapons to move damage back to damage block rather than as other damage when using midi-qol effects.
* If damage type hints were disabled, damage type was not pulled through for secondary damage sources.
* Overtime effects now all `killAnim=true` @TreeDragon#2125
* Added a function to apply Chris's effects to actors, and all actors in world (@Chris#8375, @TMinz#2168):

```javascript
actor = game.actors.getName("Zinroe");
await game.modules.get("ddb-importer")?.api.chris.adjustActor(actor);
```

If you want to apply to all characters in your world:

```javascript
for (const [key, actor] of game.actors.entries()) {
  console.log('Updating: ' + actor.name);
  await game.modules.get("ddb-importer").api.chris.adjustActor(actor);
}
```

# 3.4.2

* Muncher could render itself not working in some configurations of effect generation.

# 3.4.1

* Copy some additional properties from Chris's Premades when using effects.

# 3.4.0

* Viscous Mockery turn fix for effect expiry.
* Correctly select token scale when importing SRD images for monsters.
* Removal of scalevalue choices for damage and text as these can be evaluated within description text in 5e v2.1.x.
* Now requires D&D 5e system 2.1.x or higher.
* Trim custom item descriptions to 2056 characters to prevent error at DDB when updating.
* Strip compendium links out of custom item descriptions when syncing back to DDB, as DDB won't accept them.
* Fox for Ensnaring Strike Effect following CE changes.
* You can load effects from Chris's Premades module (thanks @Chris
#8375). These will overwrite any effects that DDB Importer generates - there are a couple of overlaps.
* You can now add (most) effects from DDB Importer to actor items or items using the following api call. GUI integration will follow.

Actor:
```javascript
actor = game.actors.getName("Zinroe");
game.modules.get("ddb-importer")?.api.effects.addDDBIEffectsToActorDocuments(actor);
```

Item:
```javascript
item = game.items.getName("Cloak of Displacement");
game.modules.get("ddb-importer")?.api.effects.addDDBIEffectToDocument(item);
```

# 3.3.16

* DDB Icon image selection was not always respected.
* Some monsters would cause the use SRD images copy to fail.
* Tables did not parse and link correctly during background, and some other parsing operations.

# 3.3.15

* Added option to copy monster images from SRD.
* Correct Hideous Laughter effect saveDC not passing through correctly, not running save when damaged.
* Improve parsing on Unknown custom monster types.

# 3.3.14

* Tweaks to Witchbolt effect.
* Fix issue with effect generation with statuses in the latests versions of Convenient Effects.

# 3.3.13

* Tweaks to dynamic macro loading.
* Better handling of targets for spells like darkness so they are no longer set to self when using midi-qol and macros.
* Arcane Recovery Macro based on the wonderful work of @Zhell#9201
* Pearl of Power Item Effect

# 3.3.12

* Some macro formatting updates
* Alert bonus could be added twice to initiative @Galag'r#0001
* Item effect: Javelin of Lightning based on a macro by @Chris#8375
* Effect: Squire of Solamnia: Precise Strike based on a macro by @Wheels#2393

# 3.3.11

* Arcane Ward Effect (self only, does not automate projected ward).
* Vitriolic Sphere Spell Effect and scaling.
* Piercer, Crusher and Slasher feat effects.
* Some new icon matches thanks to @AriHedgehog#0001

# 3.3.10

* Slayer's Prey effect.
* Hypnotic Pattern effect improvements.
* Green Flame Blade spell effect tweaks.
* Ensnaring Strike effect by Elwin#1410. Thanks Elwin!
* Added `.api` extension to `game.modules.get("ddb-importer")` to expose functions exposed through the window previously (old method will still work indefinitely).
* Added homebrew filter for item and spell munching.

# 3.3.9

* More fixes to dynamic feature string parsing, not all dynamic values were correctly placed within `[[` brackets, e.g. Healing Light.
* Support for KftGV
* In some cases, character resource retention would not work. @Whirling-In-Rags#8302
* Consumable items had transfer effects set up incorrectly.
* Improved Chill Touch effect/macro.

# 3.3.8

* Improve HTML Slug note handling to reduce chance of notes been incorrectly updated with bad anchors.
* Some dynamic numbers in descriptions were not parsing correctly. e.g. Unwavering Mark, Mote of Potential, Dark One's Blessing. @WalderGallifrey#3504

# 3.3.7

* Items with custom images, should now retain them.
* Visage of the Astral Self effect.
* P13 Support.
* Battle Master: Commanders Strike effect did not apply to ranged attacks.

# 3.3.6

* Some sorcery Metamagic features consumed the wrong amount.
* Psionic Recovery now consumes Psi Points correctly.
* Correct CSS changes in some adventures for Read Aloud aside blocks. @singitformehal#3216

# 3.3.5

* Global bonuses did not always sum up correctly, e.g. Aura of Protection and Cloak of Protection could add up to 51, not 6.
* Some spell icon improvements from @Raccoomph#8480
* Hand of Healing was not parsing as Heal action. @OmnesPotens#2683
* Companions: should be friendly disposition.
* Companions: did not always parse all restricted options, e.g. Draconic Spirits would not parse Damage Resistances for Gem spirits, only Chromatic and Metallic.
* Feature Effect: Momentary Stasis.

# 3.3.4

* Extra parsing failed for monsters that had skill or prof adjustments.

# 3.3.3

* Primal Companion companions are now parsed. @callbritton#5405
* Legacy monsters would be duplicated rather than updated.

# 3.3.2

* Polymorph and light now have the midi flag "friends automatically fail" set if generating spells with effects.
* A race condition could prevent item spells parsing correctly.
* Darkness effect improvement if using Perfect Vision (thanks @dinesh#9364)

# 3.3.1

* Hunters Mark Macro updated to match midi sample item where it will check if spell is already cast and target is dead when item is rolled again.
* Improve the handling of feature descriptions that use character values to ue new inline calculations rather than fixed values.
* Experimental mode to generate actors from stat blocks in spells and features. This is for features like Primal Companion, Summon Wildfire Spirit, and the new Summon Spells in Tasha's. It requires the Arbron's Summoning (5e) module by @arbron#6515 https://foundryvtt.com/packages/arbron-summoner. It will generate appropriate actors in a world folder, and link in the spell. Unfortunately (for now), there is no avatar/token art, so you will need to source that yourselves.
* Fix an issue syncing back to DDB if using D&D System 1.2.x

# 3.3.0

* Some fixes for upcoming schema changes/enforcement in the newest D&D system version, 2.1.0.
* Tools default ability did not always set.
* Numeric class advancements did not set the type correctly.
* Some ScaleValue names will change during munch to meet new schema requirements.
* Improve Spell Sorting on character imports.
* Major code refactoring for Monster parsing to support upcoming features.
* Cloudkill checked save at wrong point in the turn.
* Fixcritters function removed as no longer needed.
* Experimental bulk import mode has been removed due to duplication of data issues.
* Legendary resources no longer tracked by default on bar2 monsters with legendary actions.
* Monster parsing: New option to strip things like the recharge and action cost from feature names.
* Parsing is now supported for schema changes in D&D System v2.1.x. These necessitated major changes, especially to monster parsing. Risk of breakage high.
* Improved parsing of Monster Feature types into Weapons, Actions and Features.
* Monster Parsing: Dragon Wings now detect reach.
* Monster Parsing: Slightly improved damage detection for some actions.
* Prevent spell duplication for some feat choices.
* Effects: Tweaks to DamageOnlyWorkflow macros to support levels auto cover and midi-qol when cover is enabled. @Chris#8375
* Character Updates: if the death saves were cleared rather than set to 0, update to DDB would fail.
* Extras Import: Would duplicate folder, extra or move extras to root directory.
* If not using effects global spell attack bonuses might not always stack correctly.
* Hunters Mark macro would not work if using dynamically loaded macros.
* In certain circumstances and class combos, some subclass features would not be correctly evaluated and added to a character sheet, depending on the levels of those subclasses.

# 3.2.12

* Monsters with multiple actions with the same name (e.g. Legendary Actions), would have an action removed on a monster upate.
* Improve tag parsing to compendium items.
* Features which added bonuses to initiative such as Dread Ambusher could end up with the character having a stupidly high initiative bonus (like +32000).

# 3.2.11

* Third Party Scene import would fail if there were scenes in the world not in folders. @blair#9056
* Symic Hybrid Carapace will now generate an AC effect. @Kasai#9958
* Characters skill bonuses did not always calculate successfully if not using effects.
* Export unlinked notes in scene config for adventure muncher.
* Ice Knife and Witch Bolt macro tweaks.

# 3.2.10

* Improve note icon handling in scene exporting.
* Some improvements for monster exporting for adventure muncher.
* Encounter Muncher will now create a new foundry combat per encounter.
* Background munching would fail if use SRD compendium items was ticked.
* Custom skill parsing would fail if custom skill had no ability checked.
* Fix a bug where if monsters were not imported into a compendium before munching an adventure, they would not be linked properly in journals.
* New functionality to support item-machine-monsters like the Boilerdrake from SotDQ.
* Support to allow items to be added to actors for Adventure Muncher. (Please reach out to me for details).

# 3.2.9

* Monster Munch: If using update existing images, it would not update existing images if the image file existed on disk for the default image. @Baxstar#3335
* Healer's Kit now imports as a consumable item.
* When updating DDB Importer will check to make sure you have permissions to update the character.
* When using dynamic character updates the charges of an item could be erroneously updated.
* Adventure Muncher: You can now import a selection of scenes instead of all of them.

# 3.2.8

* Small tweaks to Encounter button for @Mouse0270#0270
* More Character Parsing refactor for upcoming features.
* If importing encounters without creating or updating scenes the importer would hang.
* Tweaks to spell parsing to reduce duplicate spell imports for races such as Faerie.
* Monster import now defaults to adding AC items (shields, armor etc) and rather than creating a flat AC. If the use AC items option is unticked it will now no longer add items and set AC to flat, but set the AC to Natural so that AC bonuses from spells/effects can take place.

# 3.2.7

* Started on some refactor work for improved parsing/tech debt.
* Blowguns would not import with damage leading to failure when they were used with a weapon infusion.

# 3.2.6

* If an item effect is generated item will force the use of the item effect rather than the CE effect.
* Update back to DDB could fail for some items, it would add the item, but not always update the Foundry data about that item, causing a potential duplication.

# 3.2.5

* Spell Effect: Green Flame blade now works correctly with targets larger than medium size.
* Class Feature Effect: Warlock Radiant Soul (Thanks to @Balsa
#6808)
* Spell Effect: Armor of Agathys (Thanks to @Balsa
#6808)

# 3.2.4

* Corrections for Adventure Muncher Scene Exporting in v10.

# 3.2.3

* Spell Effect: Improvements to Chromatic Orb (Thanks to @Elwin#1410)
* Spell Effect: Color Spray
* Spell Effect: Zephyr Strike (does not handle Advantage to roll, but will prompt for damage).

# 3.2.2

* Dragonlance config.

# 3.2.1

* Scene background shift would not be captured in v10 scene exports for Adventure Muncher.

# 3.2.0

* Corrections for Adventure Muncher Scene Exporting in v10.
* Some changes to support future Third Party Adventures.

# 3.1.27

* Class munch will now copy over SRD advancements. @Arteroc#1899
* You can disable condition management with CE in the module settings. @G.O.D.#0001

# 3.1.26

* Better checking for invalid generated effects.
* You can now enable and change the custom proxy address in the DDB Importer Settings menu.
* If updating to DDB with Artificer infusions, the `[Infusion]` name tag would by appended to the DDB Item with every sync.
* Harness Divine Power was adding bad scaling damage.

# 3.1.25

* Sleep spell macro did not display the token images in chat.
* Try and reduce errors when SRD Compendium is not present.
* Lanterns and Lamps now import as Trinkets.
* Characters: Fix for Custom AC bonuses no longer appearing.
* Spell DC bonuses did not add up correctly in non-effect mode.

# 3.1.24

* Account for having Detection Modes set in their default token settings on monster importing.
* ThirdParty Adventures broken by Adventure Compendium additions.

# 3.1.23

* Suppress notifications from Items With Spells when updating a character.
* Some active aura spells would not work, e.g. Cloudkill due to recursion bug with new midi arguments.
* Some Spelljammer spell icon suggestions from @MaxPat#7936
* You can now choose to import adventures into an Adventure Compendium rather than the world.

# 3.1.22

* Small tweaks to Aura of Protection scaling.
* Monster: Nosferatu parsing tweaks to break bite damage out into versatile.
* Monster: Dullahan had parsing problems around legendary/mythic actions and battle axe damage.
* Monster Effect: Pack Tactics effect if using midi-qol.
* Rage could target another creature.
* Some fixes to character import where if effects from things like active auras were present could prevent character re-imports working.
* Some mild cleanup of effect transfer and character import code - mild chance some odd edge cases might have b0rked.

# 3.1.21

* If not using effects, items which added bonuses to spell DC did not always apply. e.g. Moon Sickle.
* Effect: Cloak of Displacement improvements if using midiqol.
* Effect: Moon Sickle bonus healing if using midi.
* Effect: Heavy Armor Master (requires midiqol).
* Effect: Booming Blade would target caster not target with damage when moving.

# 3.1.20

* If using the "Items with Spells DnD5e" module, spell data for items will be generated. If "Magic Items" is also installed, the importer will use that first.
* Action Surge would place the number of surges in the damage field.
* Effect: Font of Magic (based off a macro by Zhell/MidiQoL)
* Effect: Hunter's Mark rewritten to use newer syntax.
* Effect: Favored Foe, will also add concentration as required. (Thanks to @illcom94#2733 for most of this).

# 3.1.19

* Update to DDB: Would not always update actions with 0 charges back to DDB.
* Third Party Map integrations now work with journal header links from map notes/pins.
* Characters that consisted of entirely non-ansi names would overwrite each others images.

# 3.1.18

* Allow linking to journal headers from map pins in Adventure Muncher v1.1.0.
* Inject a field into note config to allow linking to journal references. Dragging an anchor link from the journal sidebar will also add the relevant information to a new note/pin.
* Spell Effect Booming Blade: Typo
* Spell Effect: Invisibility did not set the correct effect status in some Convenient Effect modes.
* Update to DDB: if using Item Containers update could fail when moving items into containers.

# 3.1.17

* Spell Effect: Aid - could add more HP than it should in some combinations.
* Spell Effect fixes: Shillelagh, Magic Weapon.
* Feature Effect: Channel Divinity: Sacred Weapon.

# 3.1.16

* HTML in custom item descriptions when updating to DDB would break the update.
* Adventure Muncher: option for importing all actors in an adventure into a world, when using Adventure Muncher v1.0.9.
* Adventure Muncher: option for linking actors in adventure imported journals to world actors rather than compendium actors.
* Characters: Advancement will now copy any SRD Scale Advancements to fix issues where things like when CE relies on these named advancements.

# 3.1.15

* If using 5e - Custom Abilities & Skills (https://foundryvtt.com/packages/dnd5e-custom-skills) version version 1.1.3, DDB Importer will import and add any custom skills on your character sheet.

# 3.1.14

* More effect retention bugs.
* Bug when importing files to S3 would generate bad links.

# 3.1.13

* Relax module requirements for many feature effects such as Rage.
* Fix a bug re-importing actors wth certain effects.

# 3.1.12

* Add DoSI to fallback config.
* Tweaks to compendium folder generation to prevent failure when Forge module is enabled in v10.

# 3.1.11

* Green flame blade extra damage targeted caster.
* If Retain Active Effects was ticked then many effects from non-ddb items could be duplicated.

# 3.1.10

* Spell Effect: Shillelagh did not work in v10
* Effect Macros: massive sweep for macros, still some outstanding issues.

# 3.1.9

* Some more internal refactoring for tech debt (no functional change).
* Encounter muncher would fail to import encounter to an existing scene. @Ellira#5171

# 3.1.8

* More changes to support recent updates on the Forge.
* Some internal refactoring for tech debt (no functional change).
* Things like the prone effect on a Wolfs bite attack would be set so damage would be halfed on save.
* Fix a bug with things like Spell Gem where the recharge formula would generate an error when a long rest was attempted.
* You can programmatically delete the default compendiums and disable auto-creation using the command `DDBImporter.deleteDefaultCompendiums()`;

# 3.1.7

* Character imports: Spell Sniper feat will now double ranges for spells that import as ranged spell attack.
* Unarmed Strikes will be marked as magical for monks at the appropriate level.
* You can now explicitly point items to use other items in the Override compendium. Click the D&D Beyond button on an item in the characters inventory and select the item from the drop down. @alexdm#3414
* On the Forge default folder paths will now be set to your asset library.
* On the Forge changes to how data is loaded meant that icon dictionaries would not load.
* Resetting Token images did not always work.
* Character imports: when importing a character which allows @mod to be added to spells damage, it would add this to the versatile damage field, even if that had no versatile formula. @JacksonBockus#1378 (Sorry it took so long to get to the bottom of this!)

# 3.1.6

* Directory Picker settings would interfere with Tokenizer.
* Some bonuses in effects would not be applied, and instead would be `+ {bonus}`
* Fix a reference to deprecated data.flags in some character import configurations.

# 3.1.5

* For some abilities (e.g. Otherworldly Glamour) the ability check bonus would prevent rolling in v10.
* For some abilities (e.g. Otherworldly Glamour) if using active effects, and effect would not be generated.
* Some changes to file upload check to try and speed up certain file check activities.

# 3.1.4

* Thri-kreen and Autognome player characters now import with the correct AC.
* More icon corrections for v10.

# 3.1.3

* Monster imports would fail if appending legacy to name.

# 3.1.2

* If container items module had been disabled with items still in containers, character updates would fail.
* Ensure that Monsters always use prototype token.

# 3.1.1

* Some scenes had incorrect Perfect Vision meta-data attached, these will now import correctly so Perfect Vision will not cause a scene rendering failure.

# 3.1.0

* Some icon migration paths were incorrect in the 5e system, the data now (hopefully) links to the right paths.
* Support for Adventure Muncher v1.0.0

# 3.0.7

* Actually fix bug when updating existing actors if updating actor images enabled.

# 3.0.6

* Bug when updating existing actors if updating actor images enabled.

# 3.0.5

* Fix Third Party imports (@PinkRose#7896)
* A couple more icon tweaks from 5e system icons.

# 3.0.4

* Spells with a ’ in them could end up with duplicate items in the spell list. e.g. Crusaders Mantle.
* Fix some 5e system icon links that remained, notably on Divine Smite.
* Add an extra condition to Adventure Muncher which could fail in some rare journal configurations.

# 3.0.3

* Remove unnecessary check for scale values when generating certain martial arts actions.
* Savage Attacker feature effect caused parsing failure for characters.
* The 'Create and Show Handout/To Chat' tooltip that appears in the Journals would obscure the 'Display Page Title' checkbox when editing a page.
* Improve linking to SRD rules in v10 5e system.

# 3.0.2

* Update code to remove use of some deprecated functions.
* Update fallback language config.


# 3.0.1

* Some template strings would fail parsing resulting in "TypeError: Cannot read properties of undefined (reading 'Attributes'). "

# 2.9.66

* Some optional class features would not parse in as features.

# 2.10.21

* Support Abron's Summoner module by retaining flags.

# 2.9.65

* Feature effects: Planar Warrior, Ancestral Protectors, Sharpshooter, Crosbow Expert, and Savage Attacker provided by @Elwin#1410

# 2.10.17

* Adjust vision modes for v10 test 5.

# 2.9.64

* Support for Spelljammer Adventures in Space: fixes vehicle and item import.

# 2.10.16

* Lair action now has activation cost of 1.

# 2.9.63

* Spell Effect: Eyebite did not work.
* Unarmed Strikes no longer showed up. The "Show Unarmed Strike" option was removed from the DDB character sheet resulting in a break here.

# 2.9.62

* BREAKING CHANGE: UPDATE TO D&D BEYOND - there is a chance that some custom items may no longer update correctly to D&D Beyond. If an error UI message pops up, ensure that the items on DDB reflect your character in Foundry and reimport. @Ref Lansky#3878
* Some actors could choke during import if using Item Containers/Collections module. @Zarnsy#8323

# 2.9.61

* Feature Effects: Blessed Strikes (Cleric).
* Unarmed Strike attack generation will now respect the Show Unarmed Strike Option on the DDB character sheet.
* Read Alouds can now be sent to a chat, or you can create a player viewable Journal with the content.
* When showing an image in a Journal using the DDB hover over option, you can now choose to create a player journal for this image, instead of just showing it.

# 2.9.60

* Spell Effect: Create Bonfire effect triggered at start and end, and save did not happen for damage on entry.
* Effect Bardic Inspiration: did not work for skill bonuses.
* Shifter race (MoM) effects.
* Spell Effect: Elemental Weapon @ghata (Michael)#3056

# 2.9.59

* Effect: Steady Aim: Some correction to name, and movement reduction effect.
* Character Import: Some different subclass combos could cause an update error on character import as spells conflicted.
* Add missing compendiums to character import when using load from compendiums option.
* Some spells with effects tweaked to use selfTarget from latest DAE to keep native range.
* Vehicle Parsing is now available in BETA for Undying and God tier patrons.

# 2.9.58

* Spells with limited uses based on proficiency now render uses correctly.
* Some spells from races would not parse the duration correctly if different from original spell.
* Feature effect: Rune Carver Giant's Might effect. Rune Carver Runes. Reckless Attack. Vigilant Blessing. Steady Aim.
* Spell effect: Spike Growth. (Requires Active Auras).
* Monster import will now respect items that have exclusion, resource linking or icon change flags on them. This only works in original munching mode, not bulk.
* 'Chat Message Flavor' field was not left empty for weapons when no information was suitable to be placed there.

# 2.9.57

* Feature effect: Rage created a damage field when it shouldn't.
* Subclasses now have their own icons (Many thanks to @MaxPat#7936)
* Race munching now supports legacy exclusion.
* Legacy exclusion and naming options moved to the Settings tab of the muncher.

# 2.9.56

* Witchbolt would not work if triggered by player. There is still an issue where the round prompt will ask the DM rather than player to decide what to do.
* Attempt to catch an issue munching subclasses into an existing compendium.
* Update character debug additions to aid troubleshooting.

# 2.9.55

* Effect: Uncanny Dodge was no longer working.
* Effect: Support Blessed Healer feature.
* Effect: Branding Smite and Thunderous Smite spells.
* Effects: Some instance of effects that add would require a + before the effect value in order to calculate correctly if multiple bonuses are applied.
* Character Import: when a character fails to import, the importer will now try to restore the original actor.

# 2.9.54

* Some fixes and extra debugging for Update to DDB functionality.
* Some updates did not work with certain midi-effects.
* If creating Midi-QOL effects on monsters, will now generate Legendary Resistance effect.
* Character Effect: Indomitable

# 2.9.53

* Typo in Interception Fighting Style.
* New bulk mode monster import mechanism to try and improve speed, optional. (Thanks to @kaelad#1693 for some great ideas).
* Option when monster munching to append "(Legacy)" to legacy monster names.
* Some improvements to aid in debug logging.

# 2.9.52

* Beta: Item Containers Support. Requires Item Containers/Collections module by @tposney#1462. When importing you can select to place items in containers on DDB into containers in Foundry. The update to DDB functionality may not always work as expected if using this mode, I think I have tested all combos though.
* Uncanny Dodge now expires after damage.
* Source filter was not enabled unless you were a patreon (unintended).
* Hidden option to disable update notification is now visible in module settings. (Most requested feature ever?).
* Spell Effects: Aura of Life.
* Feature Effects: Fighting Style: Interception. Defensive Duelist.
* Monk Quickened Healing fixes.
* Some improvements to DDB tag replacement parsing for magic items.
* Character Import: You can now choose to keep current spell slots during import.

# 2.9.51

* Thunder Step and Word of Radiance will no longer damage self if using Midi-QoL.
* Ray of Frost Midi-QoL effect now expires.
* Fixed a potential race condition in Compendium Folders creation.

# 2.9.50

* Combat Superiority Dice parsing was broken when using Scale Values/Advancements in v1.6.* of D&D 5e.

# 2.9.49

* Updating characters on DDB could fail if racial traits had been munched with the old format into a compendium.
* Remove dependency on About Time.
* If using midi-qol and generating item effects, some items will now have restrictions applied to help with damage detection. This is MVP and some weapons still require some additional work. Currently supported: Wounding, Life Stealing.

# 2.9.48

* Fix broke monster importer.

# 2.9.47

* Support for adding class name to "Multiclass Spellbook filter for 5e" module and retaining existing changes.
* Override AC had stopped working in newer 5e system versions.
* Option to reset the tokens and avatars to DDB Defaults in Tools section.
* Small UI tweaks.

# 2.9.46

* Fix broken icon link for Assassin's Infiltration Expertise.
* When importing classes into compendiums with existing items, the import could fail.
* Barbarian Rage damage would apply to self if processing with scale values.
* The Divine Smite generated spell will now have activation conditions set to roll other damage, if using midi qol.

# 2.9.45

* Some actor processing could fail if attempting to generate Midi-QoL effects on monsters.
* Race and racial features parsing improved to support Monsters of the Multiverse.

# 2.9.44

* Slightly improved description detection for some actions and features.
* Add "Kruthik" language back into fallback config.
* Class munch now munches subclasses to separate compendium (new) and adds features as advancements.
* During character munch, if features have been munched to a compendium, it will attempt to fill in the class advancement for you.

# 2.9.43

* Homebrew monsters with no armor description would fail to parse.
* Prevent Skill Extensions 5e module breaking Monster Munch.
* Effects: Bardic Inspiration label was incorrect
* Improve template string parsing.
* Extras/Companions import moved and refactored slightly for future enhancements.
* Tweaks, improvements and reversions to template strings/scaling values in class features.

# 2.9.42

* Munching items with effects would break.

# 2.9.41

* Auto Tokenize is now an option during monster munch. This respects the existing update image settings.
* Some code cleanup to use more modern Foundry style for module active checks.
* Support rollable spellattacks in descriptions, e.g. for the Steel Defender.
* Improve some template string replacement improvements.
* Fix draconic resistence effect - if generating hp for effects, now takes class factors into account. @Vintro#9554
* Try and reduce custom homebrew language parse fail @MagRoader#2161


# 2.9.40

* Global bonuses could be ints not strings, breaking effects. (Thanks @JacksonBockus#1378)
* When using "experimental attempt to use items instead of setting flat AC" Rings of Protection were not added properly where Natural Armor was used (e.g. Amble)
* Update monster munch notification.
* If you had legacy monsters munched, but the update existing was not checked, the new monsters from Multiverse would not be imported.

# 2.9.39

* Item munch did not always add max dex to armors due to data change.
* When using "experimental attempt to use items instead of setting flat AC" Rings of Protection were not detected. Hide armor is now also detected.
* Option to exclude monsters marked as "Legacy" on DDB.
* Greenflame Blade and Booming Blade macros would fail on NPCs when run from token sheet rather than actor sheet.

# 2.9.38

* Show Players Image had broken - now uses foundry ImagePopout function. Additional option to send to chat also added.
* Generated Scale Values on Classes could not be edited.
* A Scale Value rollable link are now inserted into descriptions in features where previously a fixed string for the current feature would be used. This can be changed back to the previous behaviour on the Advanced Settings tab.
* Improvements to replacement values in text - these are now mostly rollable.
* If importing DDB Actions as Features, and you had renamed features with a custom name, a conflict could occur with multiple identical named features.
* If importing Actions as Weapons hidden actions on DDB will now import as features.
* Some missing icon additions from @JacksonBockus
* Rewrite some settings backend to allow for a "Reset to defaults" mode.
* Try and improve feature parsing on Homebrew monsters with some errant HTML characters @kuchrk24#3751
* Background tables had stopped adding "Background:" in the name in D&D v1.6.
* Improve handling of "Dueling" fighting style if not using effects.
* First pass at Background parsing to compendiums. (Undying and God Tier until complete). This currently just generates descriptions and tables. Future enhancements will add advancements, split out background features to their own item, and improved table and description management.

# 2.9.37

* Some parsing could fail is not using English language rule set. :flag_fr:

# 2.9.36

* Scale Value generation was broken by previous update.

# 2.9.35

* Some spells like vampiric touch would add a null damage type (where there was a damage and heal type).
* Some changes to dice scaling resulted in some custom spells failing import. Issue #232

# 2.9.34

* Some new icons for missing monster features and spells. (Thanks @JacksonBockus#1378 and @MaxPat#7936)
* Clerics with customised spell names would duplicate the spell, marking one as unprepared.
* Improve some linking to SRD Rules when processing.
* ScaleValue: Scale Values are now generated on classes. Currently class features do not use these, this will be implemented in a later update.

# 2.9.33

* Shifter race feature adds temphp now.
* Improve detection of skill links into compendiums.
* Subclass creation for D&D 5e v1.6.
* Class and subclass add an identifier in D&D 5e v1.6.
* Experimental Class parsing: now basic support for new subclasses. Subclasses are now named "Subclass (Class name)".

# 2.9.32

* Character Importer: Arms of the Astral Self generated extra damage.
* Fallback language added for Ziklight.

# 2.9.31

* Effects: Overtime saves now indicate if Start or End when rolled.
* [Potentially BREAKING]: Actions are now imported as Features not Weapons by default.
* Character: Some changes to support changes to Backgrounds in D&D 5e 1.6.0.
* All imports: improved linking to compendium items for spells and items where the data from DDB is tagged.
* Improve some homebrew feat detection.
* DDB Config load: now uses proxy
* Items: will now add attunement requirements to the bottom of the description block.
* Monsters: Improved detection of save vs damage for creatures using wording like the Quasit.
* [EXPERIMENTAL] Monsters: New option to generate effects on monster features. This tries to generate effects where there might be conditions like "DC 18 Strength saving throw or be knocked prone." In my testing it targets 503 monsters. This should target most basic varieties of these saves, for example Poison on Drow crossbow. It won't do the fancier elements right now, or things whch might require a macro. It will try and create Overtime effects for sustained damage, e.g. Flumph tentacles.

# 2.9.30

* Effects: Bladesong. (Thanks @Shyvor#3596)
* Effects: Spells: Grease, Create Bonfire, Black Tentacles, Incendiary Cloud, Insect Plague (all require Active Auras).
* Effects: Adjusted flame blade so created blade is now equipped.
* Some icon improvements suggested by @Raccoomph#8480
* Macros: some macros would fail if monks active tiles were placed.

# 2.9.29

* Effects: Silence spell uses Active Auras if Available.
* Macros: If using DDB Embedded macros some combinations could be recursive.

# 2.9.28

* If using the option to not embed macros in items, the Cloudkill macro would fail to load. @callbritton#5405
* Monsters: Innate spells with uses did not always parse uses, e.g. Young Crystal Dragon.
* MidiSRD available to copy from again
* Log level settings did not respect level
* Effects: Web spell will now use an Active Auras effect if module is available.
* Characters: Divine fury (and some others) parsed with double damage mods @Tec#2002

# 2.9.27

* Monster spellcasting ability detection. Actually commit changes meant to v2.9.23 (Astyrranthor was failing).
* Spell Effect: Cloudkill, mostly works for testing, although 've had inconsistent results - please feedback difficulties, requires Active Auras.

# 2.9.26

* Attempt additional fallback when DDB can't be reached.
* Effect: Green-Flame Blade, first pass.

# 2.9.24/25

* Subclasses using optional features (e.g. Blessed Strikes for Forge Domain) would import even if level did not allow it.
* Effect: Spiritual Weapon: attack range tweaked so if Midi's range checker is on you can still make attacks.
* Attempt additional fallback when DDB can't be reached.

# 2.9.23

* Improve character id detection in URL.
* Improve embedded macro callbacks for damage macros like Hunters Mark.
* Improve monster spellcasting ability detection. (Astyrranthor was failing).
* Monks bonus action Unarmed Strike would come in with an extra die of damage.

# 2.9.22

* Tweak weapon parsing for better midi support with other damage parsing and weapon damage hints.
* Spell effects: Booming Blade.
* Resource linking: Mercy Monk had missing resource linking to Ki Points.
* Attempt to fallback when DDB can't be reached.

# 2.9.21

* Custom items could be duplicated during import.
* Spell effects: Sleep, Storm Sphere (needs Active Auras), Spirit Shroud (needs active Auras) and Frostbite effects.

# 2.9.20

* Action parsing: previous fix broke features like Circle of Star druid.

# 2.9.19

* Icons: update some missing icons
* Action parsing: some features would no longer parse damage. e.g. Breath Weapon (Acid) from the Metallic Dragonborn

# 2.9.18

* Effects: Precision Attack is now No Damage.
* Effects: Enhance ability now displays dialogue to player who cast not GM.
* Effects: Ice Knife.
* Effects: Acid Arrow.

# 2.9.17

* Character imports by Players could fail if they can't create macros.
* Better handling of non-english SRD.
* Initial work on support for some features hopefully coming in D&D v1.6.0
* Monsters: Monster features/attacks like the Giant Spiders Bite which have a secondary damage vs save effect will now attempt to put this damage into the versatile field, as per SRD style. This also allows for midi-qol to use and automate this save and damage.
* Monsters: some tweaks for Netherdeep monster parsing.

# 2.9.16

* Character Updates: Exhaustion updates could be inconsistent.
* Character Import: When ignoring bio the ideals would still be imported.
* Effects: Toll the Dead Error if using Automated Animations.

# 2.9.15

* Character imports: Psi Warrior : would set all weapons to consume Psionic Energy :grimace:

# 2.9.14

* If using compendium folders reimport of monsters could fail.
* Feature and action descriptions now use `<details>` tag to hide full description.
* Better detection for scalevalue tags for features like Drakewarden.

# 2.9.13

* Temporary work around for @Nikkimouse#4382 - Pact spells can now be marked as prepared during import by opening the browser console(F12) and entering `game.settings.set("ddb-importer", "pact-spells-prepared", true)`.
* Effects: Vicious Mockery tweaked.

# 2.9.12

* Auril's forms did not parse legendary resistance.
* Effects: Maneuvers: Brace and Lunging Attack tweaked. New midiqol full damage flag set for those with a saving throw where damage is also applied regardless.
* Spells: Guidance and Light spell tweaks for targets.

# 2.9.11

* Character Import: Actions which were not attacks imported with character name :screamblob: @MissCuddles#8010 @G.O.D.#0001

# 2.9.10

* Fix fo `fixCritters` function if import screen was not open.
* Try and improve weird errors importing monsters.
* Monsters parsing: some features with recharge (e.g. Giant Spiders web) could come in as weapons, which don't support recharge. @callbritton#5405
* Character: Customised Actions will now carry over attack and damage bonuses. This resulted in a rewrite of the core functionality here so please let me know if anything looks off/broken for items or spells. @Icoshi#2431

# 2.9.9

* Items would duplicate/nest condition links to SRD conditions.
* Fly speed would not parse on Fairy.
* Some items would not generate speed effects, e.g. Broomstick
* If you have actors in DDB Monsters compendium that were not created outside of DDB but you now wish to link, you can use `DDBImporter.fixCritters()` from a macro or within the browser developer console to add the DDB Id to any matching actors (by name). This is necessary as recently the Importer started checking for a name and the DDB id in order to support multiple actors with the same name in the compendium.

# 2.9.8

* Adventure Uploads using S3 bucket failed.
* Keep "GM Notes"(module) on character imports.

# 2.9.7

* Effects: First pass at Battle Master maneuvers. Please note that some of the effects have saves which apply a status, but currently if the check is passed the damage is not applied (but should be). @dinesh#9364
* effects: Guidance and Resistance tweaks for midi changes.
* Extras import: conditional checked for Automated Evocations was missing resulting in harmless error if this module was not installed.
* Make wording on art selection clearer.
- @The Shaman#0001 : used their Wish Spell: language filtering on characters now available.


# 2.9.6

* If an item was on the sheet that was not from D&D Beyond the resource linking could fail.

# 2.9.5

* Characters would loose some token settings and folder details on reimport.

# 2.9.4

* New Characters would import with mystery man as the token, rather than defaulting to avatar.

# 2.9.3

* Resource Linking improvements:
Channel Divinity, Superiority Dice, Sorcery Points, Bardic Inspiration, Wild Shape, Grit Points, Psionic Power (Fighter and Rogue), and Ki Points. Please let me know if any features are not linking, have incorrect values or I have missed a feature that could use this.
* Using artificer extras without artificer levels could cause import of extras to fail.
* A number of icon additions to the icon sets.
* Spells: Crown of Madness effect. Basic  Witch Bolt macro.
* Correct Hideous Laughter effect saveDC not passing through correctly.
* Monster muncher will now use the default token settings as it's base value for token settings.


# 2.9.2

* Remove flags from compendium loaded options which retain resource consumption, ignore the item or icon. These would confuse the muncher if they had been set in on the feature before added to the Override compendium.
* A v8 import bug if DAE was not enabled @BlitheRapier888#1464

# 2.9.1

* Adventure Muncher would sometimes try and convert svgs to webp. It should no longer do this.

# 2.9.0

* [Experimental] New setting in core settings to enable webp mode. This will convert all images when loaded through muncher or characters into webp files. What is webp? It's a image storage format that makes images very small. Note if you turn this on and update monsters/spells/items/etc it won't remove the old images - you'll have to do that manually. Consider changing the upload directories for images both for characters and adventures if you wish to migrate stuff to save space.
* When choosing to hide the display dialogue setting for character resource manager, it would not always update the resources @kid2407 / Tobias#6450
* Support for midi-qol flag changes in 0.9.14.

# 2.8.28

* Expose the icon mapping API (see FAQ for more details). @Oshy#6665
* Image upload will no longer spam you with messages in v9 (Thanks to @KaKaRoTo#1337 for the hint).

# 2.8.27

* Mundane non-magical items will no longer be maked as common rarity.
* Rations are now parsed as a food consumable.
* Monster update tool (compendium to world) did not update the options when toggled.

# 2.8.26

* Monster updates/creation did not work in v8.

# 2.8.25

* More DAE Copy fixes. (Manshoon)

# 2.8.24

* Fix DAE copy bug

# 2.8.23

* Monsters: some rare monsters like Bone Naga which had a spell applied twice would not import.

# 2.8.22

* Increase Adventure Import Timeout - on some slower systems the complete dialogue could pop up before it was complete (it would still run in the background).
* Using DDB Data Grabber would not check cookie successfully.
* Monsters with recharge abilities would not have the usage set properly since v9 updates.

# 2.8.21

* A new tool on the tool tab to allows world monsters to be updated with compendium entries.
* Some ranged actions could be parsed as melee attacks. e.g. the Monks Deflect missiles attack.
* Resource linking did not copy across using Link Item and Resource DnD5e module and the "retain resource consumption linking" item option.
* Some hypothetical groundwork for Monsters of the Multiverse changes.

# 2.8.20

* Artificers sometimes have infusion data left around on DDB which can confuse the importer and prevent import.

# 2.8.19

* Effects: add appropriate midi-qol flag to prevent duplicate CE application.
* Effects: some effects, e.g. Mage Armor did not have correct duration.

# 2.8.18

* Spell Effect: Mage Armor AC fix

# 2.8.17

* Sometimes the class/class feature button would become greyed out when it shouldn't be.
* Tools/Instruments will now import with the correct Base Item and Tool Type in the latest 5e system version.
* Item Compendium folders: will now sort tools, music instruments etc into separate folders @yekrep#0064

# 2.8.16

* Scene exporter for adventure muncher and third party: tokens with light effects will now export light effects in v9.
* If using tidy sheet max spells prepared was not calculated properly for Artificers.

# 2.8.15

* Option to disable the "Show image to players" button on journal images.
* Class munch: class skills munched for all classes now.
* Class munch: class saves munched.
* Spiritual Weapon Macro: created weapon should be bonus action. Weapon is now equipped.
* Item effects: for weapons like flame blade or spider staff, damage effects would be created when not needed.
* Improvements to adventure muncher third party scenes to handle data bumps better.

# 2.8.14

* Spells: Control weather range changed to miles
* Underlying changes to macro creation.
* Option in module settings to load itemacros "on demand" rather than keeping the effect in a macro on the item.
* Spell effects: MeasuredTemplate updates to allow player usage.

# 2.8.13

* Encounters: will fetch encounter list again.
* Spell effect generation would fail in v8.

# 2.8.12

* Importing characters via client failed, or if cobalt cookie was not set.

# 2.8.11

* Spell Effects: Darkness spell fixes for players. Hex added.
* Monsters: Natural Armor with Shield. If a monster had natural armor and a shield, the AC would be calculated incorrectly.
* Improve linking in descriptions to things like conditions in the SRD rules compendium.

# 2.8.10

* Some icon improvements
* Parsing of some rare missing sub-features, e.g. Genie's Vessel: Genie's Wrath (Dao). I don't think this will add any duplicates, but please let me know of any issues.
* For some homebrew the Muncher could fail to parse languages.
* Monster parsing: Try and improve innate/at-will spell selection.
* Monster parsing: You can now retain the existing biography during updates.

# 2.8.9

* Warcaster feature could brake module load.
* Monsters with no language will not add "--" to custom languages any more.

# 2.8.8

* Effects: War Caster.
* Retain SIFToolkit customisation during import/update.
* Macros and Effects updated to support Convenient Effects v2.0.0
* Spell Effect: Blindness/Deafness will now restrict target vision if ATL is active.

# 2.8.7

* Spell Effects: Darkness and darkvision tweaks. If using perfect vision darkness spell will use that.

# 2.8.6

* Spell Effects: Toll the Dead did not load macro, Crown of Stars macro, Chill Touch. Guiding Bolt special expiry and duration corrected. Moonbeam tweaked. Spiritual Weapon tweaked. @dinesh#9364
* Some changes to spell parsing to support custom named spells broke magic item integration.
* Spells granted through feats such as Fey Touched did not get added to known spell lists for regular casting. @DailyLama72#9052

# 2.8.5

* Spell import to compendium was broken.

# 2.8.4

* Character import: ignored items now retain effects.
* Official spells with custom names would not pick up effects, or update status back to DDB.
* Spell Effect: Toll the Dead.

# 2.8.3

* Some badly formatted actions on homebrew actions could break monster import. Import should now continue without bombing out.
* Character import: option to ignore items/spells/features etc added to foundry character sheet during import. Will still remove items removed from D&D Beyond.

# 2.8.2

* Spell effects: tweaks.
* Skill Expert Feat could bomb out character updates if the skill chosen to be expert in had also been gained as a proficiency with Skill Expert.

# 2.8.1

* Effects: A lot of spells will now generate effects, pre-reqs required.
* False Life will now roll correct hp as it scales.
* Spell activation conditions now added to the activation field.
* Try and improve monster parsing speed to reduce compendium lookups.
* Monster has vision setting moved to muncher settings.
* If using your own ddb-proxy, please update to version v0.0.11.
* During adventure munch, tokens without linked actors will be removed from newly imported scenes.

# 2.7.7

* Try and make source book filter more obvious.
* First pass implementing absorption for monsters (needs midi qol).
* Effects: Support Potent Cantrip for midi-qol.
* Effects: If using midi-qol Bardic Inspiration effect is now applied to feature.
* Action parsing: code tidy.

# 2.7.6

* Try and make source book filter more obvious.

# 2.7.5

* Adventure Muncher: Updating Scenes would fail in v9.
* Artificer Infusions: if using a Battle SMith int will now be used instead of str/dex (if appropriate) to infused items.

# 2.7.4

* Linking to conditions in descriptions: if multiple conditions were present in the feature description it would remove text between these conditions. Rare, noticed on 3rd-level College of Spirits feature.

# 2.7.3

* Resource Selector - new dialog will pop up asking about what Resources you wish to use. This is the first part of improving resource management.
* Improved messages about selected sources.
* Monster munch: tiny and small creatures had scale values different to SRD monsters. The grid size and scale now reflects SRD compendium.
* Rewrite of some resources code for future enhancement.
* Added function to fix base64 in scene thumbnails and alert to base64 in scene images. Run `DDBImporter.base64Check()` in the browser console or trigger from the Muncher tools tab.
* Spell: tweak Armor of Agathys scaling.
* If Scene exporter  was enabled for v9 the scene context menu would not work.

# 2.7.2

* Monster munch: armor items will now be added to a monsters equipment.
* Monster munch: In the case of natural armor, this will now be set as such in the ac calculation field.
* Monster munch: experimental feature: attempt to set AC based on armor items. This works for most monsters. There are oddities for monsters with abilities or magic items, or just incorrect AC calcuations (Arkhan looking at you), it _should_ try to set it to a flat value where I have been able to detect this. Please report any _bad monsters_.

# 2.7.1

* Third party scenes button could become "stuck" on disabled till muncher was reopened.
* In v9 if using Tidy Sheet multiple monster link buttons could be displayed.
* Character imports: option to disable resource creation.
* Some changes to alert when adventure scenes are for a higher Foundry version than currently installed.

# 2.7.0

* Class and class features are now available to Coffee Tier supporters
* Support for enhancing 3rd party scenes with DDB Data. Currently support for Steve's Scenes House of Lament and Cyrens Undermountain maps. Please reach out if you wish to add support for your own modules.
* Support for Obsidian character sheet during imports (will keep existing Obsidian data and categorise feature types).
* First pass of support for v9 of Foundry.
* Better checking for unsupported versions of the 5e system.
* Fixed token vision/senses for v9.
* Encounter muncher would start with two conflicting settings both set to true.
* Update Character to DDB: fixed a bug that could occur with custom items.
* Remove code for D&D 5e v 1.4
* Fix an issue where if copying effects from DAE SRD Unarmored Defence would get both MOnk and Barbarian.

# 2.6.27

* Encounters: you can now import encounters onto an existing scene.

# 2.6.26

* Character parsing: generation of generic/undefined ac effects for generic armour items with no type were incorrect, and incredibly rare cases would break character imports.

# 2.6.24/25

* Monsters: Support new size category for Strixhaven template monsters.

# 2.6.23

* Some debug information about ddbimporter flags
* Monsters: changes to DDB API meant that monsters imported when an adventure or encounter was imported resulted in weird formatting and incorrect forumula.

# 2.6.22

* Fix Max Dex restriction removal on some items, e.g. Serpent Scale Armor.
* If using "DFreds Convenient Effects" conditions from D&D Beyond will be applied to the actor during import and sync back to D&D Beyond.
* Tweaks to Adventure Muncher if using custom proxy.

# 2.6.21

* If Midi-QoL is installed use it's Adamantine and Silvered damage conditions for Monsters instead of free text. @⭐FiNalStaR#1337
* Retain more token image information if "Update Monster Images" is unchecked. @V3rotti#8154
* New icons and icon path updates from @flogistoni#5670 !

# 2.6.20

* Monster special traits could import with action count set to one, even if it wa not appropriate. @Zouln#0001

# 2.6.19

* Bundle sizes when munching items into the DDB Items compendium did not calculate properly.
* Character Update to D&D Beyond: Stackable items may not have updated on DDB.

# 2.6.18

* Some monsters, e.g. Abhorrent Overlord could import with the spellcaster level set incorrectly.
* Monsters: Sephek Kaltro did not import Misty Step. (Odd formating)
* Monsters: Aboleth tentacle damage was not correct. Acid is now split to the Other formula field.
* Monsters: Some mythic actions did not parse names correctly, e.g. Arasta's Armor of Spiders.

# 2.6.17

* Update to D&D Beyond: some weapons are stackable (e.g. Javelins) on D&D Beyond. The updater will now update the quantity correctly rather than creating a new item for each Javelin. Requires an reimport of the character and recommended that you reimport your items into the DDB Items compendium.
* Add level to class feature import requirement
* Refactor to scene downloader for Adventure Muncher

# 2.6.16

* Character import: Add an option to import D&D Beyond Actions as Features not Weapons. @PhantamaroK#2938

# 2.6.15

* Retain "Inventory +" categories on character and items during import. @TheLuckyDemon#0352

# 2.6.14

* Vehicle proficiencies no longer imported. @Seamonster#2107
* Moar icons for new items from Fizban's - thanks @JacksonBockus#1378 !
* Fix AC for Loxodon @LususNaturae#0046

# 2.6.13

*Hexblade and Kensai monks now import their special weapons again. @Rule#6296

# 2.6.12

* Dynamic Updates did not show up on each character sheet.

# 2.6.11

* Some class features that added stat bonus too iniative could add proficiency instead.

# 2.6.10

* Active Update now in BETA and available for Undying tier patreon supporters.
* Set weapon ability as default for weapons instead of explicit str/dex to allow default ability and finesse to auto apply/decide. @flogistoni#5670

# 2.5.34/2.6.9

* Improve the handling of default compendium creation.
* Improve handling of the compendium load during character munching.
* New icon mappings - thanks @JacksonBockus#1378

# 2.5.33/2.6.8

* In some instances the character importer would fail to generate a race.

# 2.5.32/2.6.7

* Compendium load and check refactor.
* Background tables did not always have unique names.

# 2.5.31/2.6.6

* Characters: now imports a consolidated race "feature" to help keep feature list more trim.
* Bead of Force did not parse correctly.
* Spell: Bones of the Earth had incorrect radius.

# 2.5.30/2.6.5

* Characters: In some rare circumstances a class and race feature name clashed (e.g. Radiant Soul) and would not import both.
* Characters: Consolidate background choices into single feature.

# 2.2.29/2.6.4

* Max prepared spells added to the Tidy sheet data.
* Sneak Attack ensures activation is set to special when importing features and actions. (@flynnkd#7958).
* Support for Link Item and Resource DnD5e module https://foundryvtt.com/packages/link-item-resource-5e (Thanks @Calego#0914)

# 2.5.28/2.6.3

* Improve Breath Weapon import.
* Rod of the Pact Keeper did not add a bonus when not using active effects.

# 2.5.27/2.6.2

* Item weights, notably for Ammunition did not parse correctly.

# 2.6.1

* Active Updates: Dynamically sync character changes back to D&D Beyond as they happen.

# 2.5.26

* In some instances, where a magic armour had multiple modifiers on DDB, the magic bonus to AC would not be parsed, noteable on Dragonguard. @✨ Algor_Langeaux ✨#2734

# 2.5.25

* Global Bonus Abilities could sometimes be added to field as an interger and when combined with CUB would cause problems.

# 2.5.24

* Crossbows did not register proficiency properly when imported on characters such as rogues. @draco#4365

# 2.5.23

* DnD5e Helpers - retain wild magic feat special feature on characters, and add for Wild Magic sorcerers.

# 2.5.22

* Character import Bug fix for missing weapon proficiencies transferring to weapons in some circumstances under D&D v1.5.

# 2.5.21

* Bug fix for skill bonus failure when no skill bonuses!

# 2.5.20

* Improve new save bonuses for skills and  in D&D5e 1.5. Add support for custom ability bonuses from DDB.

# 2.5.19

* Compendium migration bug tried to migrate all compendiumms, not just unlocked DDB compendiums.

# 2.5.18

* Retain custom icon information had stopped working and would loose setting during import. (@DrWiFi#8928)

# 2.5.17

* "Martial Adept" feat could cause parsing issues is some usecases.
* Item rarity did not always set correctly for Very Rare items, resulting in some interesting sorting when using Compendium Folders.

# 2.5.16

* DDB API change prevented adding new items to characters during update. (@Hexx#6358)

# 2.5.15

* Bug prevented bulk item loading.

# 2.5.14

* Better tool proficiency support and basic handling of Base Items for D&D 1.5 system.
* Changes for character update could prevent importer opening.

# 5.1.13

* Active Effect Skill bonuses: will now generate effects based off ability values, rather than just flat values.

# 2.5.12

* Character: Skill ability over-ride effects were not generated correctly.
* HP and HitDie are now toggleable on import screen. (@sharkey#2946)

# 2.5.11

* TWBtW race feature/trait icons (thanks @MaxPat#7936 )
* Better handling of some edge case items when updating characters on DDB.

# 2.5.10

* Some extra debug logging

# 2.5.9

* Some homebrew modifier combos could cause an integer to be placed into the damage field, which Foundry needs to parse as a string.

# 2.5.8

* Harengon prof bonus to initiative.

# 2.5.7

* Improve some language on the importer screen for compendium folders.
* Compendium list reordered.
* Some feature template strings did not parse class level.
* Update to DDB: if an item that is not from the DDB compendium is used, the updater will attempt to find a suitable DDB item from the DDB items compendium to use.
* Update to DDB: will no longer replace/delete items if item name has changed.
* Update to DDB: items using custom names will now update custom names. e.g. if you change an items name that comes from DDB (either via a compendium or ) it will update it on DDB.
* Icon updates for some new and existing features (thanks @MaxPat#7936 )

# 2.5.6

* Groundwork for future parsing improvements.

# 2.5.5

* CSS tweaks.
* Tweak to Hex to remove attack element of spell parse.

# 2.5.4

* Tweak infusion effect generation to apply effects generated for loot items like Rods.

# 2.5.2

* Character: handle cases like Druid Circle of Stars where spells are granted x times per day and also added to prepared spells.
* Character: handle cases like Hexblood where spells are granted x times a day and can also be added to prepared spells.
* Compendium Folders: Items now support Rarity as a folder structure option.
* Tweaks to Bomb and Fragmentation grenade so they parse as useable items.
* Compendium Folders: Fix a bug where folders could be created multiple times during an update of things.

# 2.5.1

* Fix for failure of infusion parsing in some circumstances.

# 2.5.0

* Encounter Muncher now available to all Patreon Supporters.
* BETA: For Undying and God Tier: Artificer Infusion Parsing now available. The muncher will now mark items that are infusions as such, generate Active Effects on infused items, and parse Infusion actions.

# 2.4.13

* Small bug caused error message when compendium folders was enabled and importing characters with roll tables.
* Some characters with optional class features enabled, at levels they did not have, would fail to parse with the following error " "Error parsing Character: TypeError: Reduce empty array with no initial value" @HighlandGreen#5213

# 2.4.12

* Can now create/assign item and spell compendium folders during import (re-assigns new items only).
* Groundwork to support check and save ability bonuses in D&D 5e v1.5.
* For creatures such as Spider where damage is a fixed value, it no longer tries to parse a weird dice roll (e.g. +mod -1) but will keep the fixed value.
* Level scaling text and dice parsing for optional class features had broken.

# 2.4.11

* Update to DDB borked by proxy changes.

# 2.4.10

* The avatar image can now use the token image during munch. @dirusulixes#6754
* Some changes to support proxy changes for infusion work.

# 2.4.9

* Backgrounds generated multiple skill tables.

# 2.4.8

* Active Effect generation: some effects like saving throw bonuses from Cloak of Protection could be applied twice (since 2.4.1).

# 2.4.7

* Dice processing: Some dice strings like the Orc War Chief, would not add a + in the correct place, so damage dice would not roll.
* Homebrew Monster: better detection and removal of false positive parsing.

# 2.4.6

* Character parsing: If you had multi-class or racial spells with a different ability to your primary casting ability, if the spell had a save, the ability it used would not be set correctly. @MaxPat#7936

# 2.4.5

* DDB has some tables badly formatted which could break the parsing of some characters.

# 2.4.4

* Handle edge cases in spell parsing which could causes parser to fail.
* Table Compendium. Items, spells, and features with rollable tables will now create a roll table in the DDB Tables compendium and link to it to allow easy rolling. TLDR Wild magic tables!

# 2.4.3

* Handle Homebrew Monster edge cases with damage variations in spell names.
* Automated Evocations - Companion Module support - when using this module and importing Extras, it will add a characters extras to this modules settings for that character to pre-populate the list.

# 2.4.2

* Adventure Muncher will work again if you try to import an adventure without monsters in the compendium, and you don't have a patreon link or proxy setup. @cam443#9999

# 2.4.1

* "Replace Items using DAE compendiums" has been removed in favour of just "Copy Active Effect from DAE Compendiums". It was not working following recent changes to the DAE SRD module.
* Items like the Ioun Stone of Mastery had stopped adding to proficiency bonus. @kid2407 / Tobias#6450

# 2.4.0

* Adventure Muncher imports will now find and import missing monsters, spells, and items from DDB. You no longer need to munch these prior to generating a config file. This requires adventure muncher 0.4.0.

# 2.3.12

* Better AC support for things like Warforged when using D&D 5e v 1.4.* system and not using DAE module.
* Compendium Folders: CR rating is now zero padded for better sorting.
* Compendium Folders: Now has Spell Level, Spell School, and Item Type sorting. (Thanks @Erceron#0370)

# 2.3.11

* Fix Rarity for items in D&D 5e 1.4.2

# 2.3.10

* Compendium folders checkbox could become disabled.

# 2.3.9

* Support AC in D&D 5e 1.4.2 for things like Cloak of Prtoection when Dynamic Active Effects is not installed.
* Monsters import with correct AC in D&D 5e 1.4.2.

# 2.3.8

* Recharge successfully detected on Monster actions again. @kuchrk24#3751
* Suport Natural AC for D&D 5e 1.4.2.

# 2.3.7

* Compendium Folder support can now create folders based on creature type, CR, or first letter. You can also migrate between the different styles without re-importing. (This can take a while!).
* Improve adventure config generation speed.

# 2.3.6

* Support for Compendium Folders in Monster Muncher. (Requires compendium folders v2.3.5).
* Feat, race, and frame munch are now available to all Patreon supporters.
* Encounter Muncher is now available to Undying Patreon Supporters.

# 2.3.4/5

* Retain Argon - Combat HUD settings on reimport.
* Actually commit code to allow Midi-SRD compendiums to load.

# 2.3.3

* Unarmored Movement now works correctly (again) with Active Effect generation when using DAE SRD. (@miromonti)
* Midi-SRD module name was incorrect during module detection.
* Healing Hands feature - better support.

# 2.3.2

* Use new v5 api endpoints from DDB, to allow future container work, and to fulfil the rentless march of progress.

# 2.3.1

* Encounter Muncher could hang if Compendium contained non DDB monsters.
* Encounter Muncher Bar map.
* Encounter Muncher will update map if changed between imports.
* Spell Munch now captures unique artificer spells in homebrew.

# 2.3.0

* New Feature: God Tier Supporters now have access to Encounter Muncher! This tool allows you to bring in Encounters from D&DBeyond. Import missing characters, monsters, create scenes and a combat tracker! It will even keep existing monster HP and all initiative rolls! This is available to God Tier for feedback, rolling out to everyone over the next couple of weeks as bugs are ironed out.

* Move back to using `value` rather than `bonus` field for Active Effect AC bonus additions. This is due to items like to Robe of the Archmagi not working with Bracers of Defence. The Defence would add a +1 to the bonus field, but this is only applied to base calculation, not the final result after active effects.
* Support new Midi-SRD module packs/compendiums for active effects.
* Removed Iconizer support. RIP Iconizer.

# 2.2.4

* Character Import: Attack actions that are not weapons will now import customised names.
* Replace some icon names that changed between v7 and v8 of Foundry.

# 2.2.3

* Fix Giant Fly parsing. @Aeristoka#6038

# 2.2.2

* Custom Defenses were not parsing due to change in DDB schema. @blackntan#0069
* Improvements for homebrew monsters with a Lair action but no regional action @Sayshal#0110
* Race import now adds parent race into Requirement field as per SRD races.
* Active Effect AC bonuses now applied to magical ac bonus field.

# 2.2.1

* Bug stopped spell and items muncher unlocking properly.

# 2.2.0

* Support for new AC calculation in D&D5e 1.4.1
** Monsters will continue to use flat AC values
** Hopefully correct values will be generated for most character/race combos. Exotic creatures like the Tortle will need "Generate Active Effects AC's for Character Features and Racial Traits" ticked until better support for custom calculations in implemented in the DDB Importer.

# 2.1.30

* Gust of wind width.
* Fighting Style: Dueling would add the effect twice if using active effects.

# 2.1.29

* Scene import for adventure muncher will now offer a selection dialogue to allow replacement of updated scenes - many thanks to @kid2407 / Tobias#6450 for this excellent contribution.
* "Wall" spells now definitely set target correctly.
* "Gust of Wind" spell now definitely set target correctly.
* "Divine Favor" now targets self and is a utility.

# 2.1.28

* Adventure journal links to DDB improved for books like ATG.
* Healing Light now parses use and dice more logically.

# 2.1.27

* Better handling of some exceptions when updating characters on DDB. These are around trying to sync items with a quantity of 0 or currency with non-numeric values.
* Armor of Agathys now does temphp rather than attack roll.

# 2.1.26

* Only try to check default directories for GM users.

# 2.1.25

* "Wall" spells now set target correctly.
* Active Effects: now handles attack and damage bonuses such as Fighting Style Archery and Improved Divine Smite.
* Generating effects for items always adds AC bonus for items such as Rings of Protection.
* Rewording of Active Effects screen for better clarity, as well as toggling some options which are exclusive correctly.
* Reset effects to "best default use" style option.
* Polearm master bonus attack now is an attack!

# 2.1.24

* Retain customised Animations placed via Otigon's Automated Animations.

# 2.1.23

* Update notifier broke.

# 2.1.22

* Barbarian Beast Sense from Spirit Seeker no longer importer properly and caused character import to fail.
* Try and prevent multiple D&DBeyond icons appearing on journal entries when the Scene Note button is clicked while the journal entry is open.

# 2.1.21

* Tomes/items that applied ability mods did not work if active effects was not enabled.
* You can no longer generate the following effects dynamically for backgrounds and feats: "Ability bonuses, proficiencies, languages".
* Additional Bardic Sercret spells did not come in prepared correctly.
* Slight improvement to parse a few missing class features such as Channel Divinity which are subclass specific.

# 2.1.20

* If using S3 for adventure asset uploads, icons for notes will always be uploaded to a local folder.
* Monsters like Anchorite of Talos would import custom damage adjustments to spells incorrectly.

# 2.1.19

* Eldritch blast now gets bonus damage values from custom items.
* Crash could happen when trying to use items during monster munch.

# 2.1.18

* Copy from SRD retains prepared spell status and other useful characteristics again.

# 2.1.17

* Don't expose DDB Links and info to players when using "Show to players" option in journal.
* Proxy endpoint detection improvements.

# 2.1.16

* If Agonising Blast was granted through the Feat Eldritch Adept it would not apply.
* Experimental feature: download all your character frames to a folder. This is useful for the new frame folder option in Tokenizer.
* Fighting Style: Interception now parses correct formula.
* Character Import: Custom senses adjustments now import again.
* Character Import: Stunning Strike correctly parses save requirement again.

# 2.1.15

* MagicItems module support: will now link spells to compendium items again.

# 2.1.14

* Compendium dropdowns now align.
* If use DAE Paladins Auras are now added as an effect.
* If using Active Effect Auras, the Paladin auras will have the appropriate metadata set.
* If using wildcards in monster token images, adventure importer will now respect the random token generation.
* Adventure import will now respect scales that have been changed on monster tokens in your compendium.
* Scene config for adventure muncher will now capture some missing fields for lights, as well as capturing light and wall flags allowing meta-data for modules like community lighting to be captured.

# 2.1.13

* Multiclass characters with special traits could loose special traits depending on the order classes were parsed. @Incanter#8172
* Monster will now parse Resistance/Immunity/Vulnerability of "Non-magical Physical" damage as the provided flag rather than other.
* Deflect Missiles now has a damage roll associated with it.

# 2.1.12

* Better handling of bad campaign id caused the ddb importer core settings screen to not open.
* Monster munch: Better parsing of Gelatinous Cube. This may also impact parsing of monsters where abilities are broken out over several paragraphs of text. This _may_ have impacted other monster parsing in unexpected ways, so please raise any oddities in #monster-parsing-fail.
* A button to toggle source status on/off.
* Monsters: Ensure that when sources are selected homebrew only command is not processed.
* Copy more description details for Tidy sheet.

# 2.1.11

* Attempt to reduce likelyhood of `The key xxxx does not exist in the EmbeddedCollection Collection` messages when creating actors with Effects.

# 2.1.10

* Monster with a cone/line/are effect weapon did not parse the size correctly anymore in Foundry 0.8.6. If you have munched monsters in 0.8.* then a full re-munch should be performed.
* Adding an extra as a Beast Companion when you have no ranger levels would break import.
* Tiamat's head legendary actions did not parse correctly.
* Adventure Scene exporter did not export wall direction.


# 2.1.9

* Some NPC spells casters (e.g. Evil Mage) used a different syntax and did not parse spellcasting ability. (Thanks @m42e for a quick fix).

# 2.1.8

* Scene exports should include padding value.
* Improved token and actor importing for adventure importer.
* Munched items/spells that were updated would gain duplicate active effects in 0.8.6.
* Eldritch Claw Tattoo will now parse damage and attack bonus to unarmed attacks.

# 2.1.7

* Adventure muncher did not find files in uploaded path.

# 2.1.6

* Searing Smite spell failed for people with custom spell named the same.
* Adventure importing no longer crashes when actor expected in Compendium is not there.
* Better detection and management of invalid cobalt cookie.
* Characters can now use their own Cobalt Cookie stored locally in the browser, useful for players.
* Added more natural attacks to monster parsing.
* Better support for spaces in file paths.
* Items copied from SRD now include DDB metadata for use when generating an adventure muncher config file.
* Cobalt Cookie can now be checked on the settings page.
* Campaigns are now detected based on Cobalt Cookie and drop down list presented.
* Adventure Scene Config download now include any pins from book, not just the scene.

# 2.1.5

* Don't always download images for experimental functions.
* Active Effect generation tweaked for changes in latest DAE module.
* Fix monster munch experimental option to load items from compendium.

# 2.1.4

* Compendium loading, especially from Override, did not work well. Further streamling of character import process to take advantage of new methods in 0.8.x.
* kl and kh active effect modifies had a space that caused a failure.
* Account for items that have a damage bonus, but provide not weapon stats from DDB.

# 2.1.3

* Bug could cause Patreon authentication window to repeatedly open.
* S3 bucket support for adventure imports @ayyrickay
* Rewrite of effect generation and character updates, now working with DAE properly (Note: Replace Items using DAE compendiums is not yet working)

# 2.1.2

* Unarmored defense imported an effect with incorrect formatting resulting in the AC adjustment not being applied.
* Class Features would be applied from SRD rather than DDB.
* When importing characters with active effects some error messages would appear. For now if importing using active effects, untick "Update Existing Items" in advanced settings.

# 2.1.1

* PC imports failed in 0.8.6


# 2.1.0

* Foundry 0.8.5. support
* Integrated adventure importer tool into muncher pane.
* If tokens are present in your adventure import scene, adventure muncher will attempt to import and link them.
* You can now specify an Override compendium to import character items/spells/features from.
* New only option has been removed.
* The munch button is now at the top of the page (option to put at bottom in settings).
* PC images can now be uploaded to separate folders to other images.
* Image upload directory is now set and created to a sensible default.
* Adventure Importer Journals with tables now offer a Roll on Table button.
* Heat Metal spell parsed as a spell attack.
* Option to add damage restrictions to damage hint tag.
* Bardic Inspiration is now a Utility action to help when using automation.
* You can now use a button to connect to Patreon to verify your patreon tier rather than entering a key.
* DAE AC effects on Armor is now a separate option.

# 1.0.9

* Barrier Tattoos did not appear in AC calculations when not using active effects.

# 1.0.8

* Source filter for VRGtR

# 1.0.7

* Adventure Scene exporter now captures more information for token placement.

# 1.0.6

* Boots of Striding and Springing did not set speed adjustment correctly.
* Previous ability adjustment for monk actions was not correct and had impacted Polearm master. This should now calculate correctly.
* Actions with 0 uses will now import blank rather than with a 0.

# 1.0.5

* Correct proficiency modifier multipliers on action and resource useage.
* Some abilities (e.g. Astaral monk Summon bonus action) added `+ @mod` incorrectly.

# 1.0.4

* Remove bug where actions such as Sneak Attack imported the feature and action when action only option was selected.
* Sneak attack now uses auto-scaling formula rather than fixed value.
* Divine Smite helper spell was no longer added.

# 1.0.3

* Tomes did not add stat bonuses correctly.

# 1.0.2

* Scene export improvements.

# 1.0.1

* Items with no names no longer cause the importer to fail.
* More CSS tweaks.
* Scene export now captures note icon scale and light animations.

# 1.0.0

* You can now import the full/avatar art as the token art, rather than the square token image.
* Better scene data extraction for adventure-muncher.
* Patreon restrictions relaxed, source filter and homebrew imports now available to Coffee Tier.
* Fixed CSS issue which effected all blockquotes.

# 0.6.33

* Improved Journal formatting for imported adventures.
* Improved scene note icons.

# 0.6.32

* Spells that have a target of self, but do damage, now set themselves to target creature instead.
* Default Better Rolls config will no longer auto-consume charges on Weapons when you attack with them.
* Support for exporting Adventure Muncher Note Pins for scenes imported from Adventure Muncher 0.0.15.

# 0.6.31

* Some optional class feature edge cases prevented some modifiers from being used. e.g. Skills from a Barbarian's Primal Knowledge option.
* Active Effects: Base AC option did not calculate correctly, if a shield was equipped.

# 0.6.30

* Some spells and actions did not respect correct damage hint rules.

# 0.6.28/29

* Ranged weapons did not import feet distance correctly.

# 0.6.27

* Some monsters did not parse attacks for negative damage modifier, e.g. Baboon.
* Improved munching of actions like a Smoke Mephit's Death Burst.
* Cleaned up some missed damage tag additions during monster parsing.
* Improved detection of cone/line/etc weapons when there were more than 1 dash, e.g. Ancient Blue Dragon.
* Some monster attacks could set the reach property even when they were not reach.

# 0.6.26

* Improved parsing of Ray of Enfeeblement, Absorb Elements, and Pyrotechnics.
* Damage hints are now an global option when parsing.
* Superiority Dice rolled all dice, not just one.

# 0.6.25

* Some spell component gold costs did nor parse correctly.

# 0.6.23

* Some effects did not parse correctly, e.g. Wand of the WarMage.

# 0.6.22

* Heal spell did not set value correctly

# 0.6.21

* After a first monster munch the monster compendium could no longer be opened.

# 0.6.20

* Previous update broke Dueling fighting style

# 0.6.19

* Great Weapon Fighter ability did not apply dice modifier correctly

# 0.6.17/18

* Monsters now use @mod in attack damage instead of fixed value.
* Melee weapons without a long range, imported with it set to undefined, now empty string.
* Improved parsing of names of actions like orc Aggressive trait.

# 0.6.16

* Optional class features would come in regardless of level.
* Melee weapons without a long range, imported with it set to 5, now empty.
* Crossbow bolts had range set to 5/5
* Magic weapons had stopped applying magic bonus to damage
* Duergar Mind Master did not parse special actions properly

# 0.6.15

* If the monster compendium was changed between munches, the monsters would still import into the old compendium until the page was reloaded.
* Unarmed strike could not roll damage for characters!
* Expired cobalt token now alerts on Update to D&D Beyond.
* Max HP changes now show on character sheet.
* Damage type of Sunblade and other such magical weapons which replaced the base damage did not do so correctly.
* Potions now set to consume on use and charge set.

# 0.6.14

* Some shields with artificer infusions would fail to import.
* Monsters: Demilich parsed a blank item.

# 0.6.12/13

* Base AC effects no longer multiply if retain effects is selected.
* Support for Life Domain bonus with and without Active Effects.

# 0.6.11

* Monsters: some monsters e.g. Shrieker did not parse reactions. This was an issue with all monsters with reactions where actions are not present.
* Effects: Tortle AC was not calculated properly if it had a DEX bonus.
* Effects: Rage duration was not set.

# 0.6.10

* Character Importer: Some characters did not import due to changes in custom proficiency handling.
* Monsters: Xill had inconsistent formatting and Claw attack did not parse. Improvements to parser, might effect some other monsters.

# 0.6.9

* Candlekeep: fix some problems munching Sages
* Icons: massive monster action inbuilt library, thanks @Zac!

# 0.6.8

* Muncher: some roleplaying information blocks were in the reactions block. Now parsed correctly.
* Some code optimisaion/modernisation by @Naito many thanks!
* Candlekeep monster munch support - monsters can now have no alignment and Skitterwidget language added.

# 0.6.6/0.6.7

* Handle ability overrides in DDB as effects.
* DDB Skill proficiency override stopped woking due to DDB data change.

# 0.6.5

* Blood Hunter Spell Slots not set correctly.
* Backgrounds might import description multiple times.
* Shadow of Moil action should be other, not attack.
* Effects: improved rage.

# 0.6.4

* Electron app does not support feature used for condition/tag block parsing, will now be ignored in the electron app.

# 0.6.3

* On weapons, damage type without dice did not always import correctly.
* In parsed feature and action blocks text like `[condition]incapacitated[/condition]` is now replaced with an entry linking to the SRD Rules compendium, if one can be found.
* For features parsed as active abilities/attacks, you can now optionally parse it as a passive feature as well. (Note this may cause some oddities).

# 0.6.2

* Non GM users got warning message.
* Effects: skills were additive, rather than upgrades.
* Character effects: choose from certain kind of effects generated.
* Effects: If character had override AC certain effect generation would fail.
* Monsters: some skills did not catch expertise prof.
* Effects: Soul of the Forge, Forge domain now adds AC effect.

# 0.6.1

* Backgrounds broken for some characters.

# 0.5.0 - 0.5.19 - 0.6.0

* Active Effect Generation Support for Characters, and Items (Requires DAE, with additional enhancements if using Midi-QOL):

Item effects generated:
* Armoured AC bonuses
* Unarmoured AC and bonuses
* Saving throw bonuses
* Ability Check bonuses and advantage on saves and checks
* Skill check bonuses and advantage on saves and checks
* Ability bonuses
* Proficiency bonuses
* Ability score over-rides (e.g. belt of x strength)
* Spell attack and DC bonuses
* Damage Resistance, Immunity and Vulnerabilities
* Condition immunities
* Languages
* Darkvision, blindsight base and bonuses
* Speed/movement
* Proficiencies
* HP per level
* Skill bonuses
* Advantage on skill checks
* Advantage on initiative
* Advantage on saves vs magical attacks
* AC base effects on armor items

Character, racial traits, and background effects generated:
* AC base effects on character features
* Same as item effects, except several features don't get a feature in foundry (e.g. Ability increases).

Notes:
* When importing characters and auto generating effects, the import will be significantly slower due to some race conditions around effect generation when updating characters.
* Some effects may not come through for some items, these tend to be ones with very specific advantages, e.g. Advantage on Persuasion vs Giants and the like. There exceptions such as the Cloak of Elvenkind, or resistances where you should be holding the item.
* It adds only a limited number of more specialist effects.
* You can use this in combination with Copy Effects for DAE SRD.
* Active Effect generation does not work in the Muncher for the experimental features such as feat, class and racial trait parsing.

Other Improvements:
* Icons don't use absolute paths
* Artificer Battle Smith will now use Int for magic weapon attacks
* Attacks now add damage type hints where possible
* If DAE is installed it will be used to generate skill bonuses rather than 5e skill customisation module
* If using the MagicItems module, spells will try to be found in the DDB Spells compendium -> SRD Compendium and only creating them n the world as a last resort if it can't find the spell allready.
* You can generate a set of Character Effects for each of your equipped AC options. This is similar to the DAE Auto Generate AC option, however, these will over-ride DAE and effects applied by equipping items. AC is quite hard to calculate dynamically in Foundry in edge cases as it requires users to active the correct set of effects that apply. Not all effects (e.g. from class features) are currently generated.
* Pressing enter in the monster search field no longer reloads the page.
* Homebrew monster parsing improvements.
* A handful of monsters had some odd formatting for their special traits which broke special trait and spell parsing. ["Hlam", "Ygorl, Lord of Entropy", "Whymsee (Kraken Priest Variant)", "Strahd Zombie", "Skr’a S’orsk", "Mongrelfolk", "Laeral Silverhand", "Jarlaxle Baenre", "Gar Shatterkeel (Noncore)", "Forlarren", "Fog Giant", "Fhenimore (Kraken Priest Variant)", "Drow Arachnomancer", "Archon of the Triumvirate", "Amble"].
* Cones and Line area effects were the wrong way around in monster parsing due to late night coding.
* For monster abilities that have a recharge function (e.g Hell Hounds breath) this now does the correct resource linking for the recharge.
* Bio updates are now optional during character update.
* Monster munch: improved parsing for a handful of monsters where special actions did not parse properly, e.g. Obzedat Ghost.
* Monster munch: improved parsing for monsters with tables e.g. variant troll.
* Monster munch: some monsters had their Roleplaying descriptions defined as actions, these now parse into the character biography. e.g. Augrek Brighthelm.
* Monster munch: some monsters like Worvil “the Weevil” Forkbeard had action names for items that duplicated.
* Background now imports as a feature.
* Support for grabbing the Cobalt Cookie using https://github.com/IamWarHead/ddb-data-grabber
* When copying DAE effects, it will now copy embedded macros on the item.

# 0.4.17

* Monster parsing: some cantrips did not import.
* Updating character/token name is now optional - thanks @Naito!

# 0.4.15/16

* Lizard folk bite attack would use a lower martial arts dice if lizard folk was a monk.

# 0.4.14

* Monster parsing failed due to skills formatting change.
* Artificer flamethrower added +mod to damage.

# 0.4.13

* Some characters would not import.

# 0.4.11/0.4.12

* Some users with an expired or no cobalt token could no longer import characters.

# 0.4.10

* Extras parsing was broken in 0.4.8.
* Racial Trait Icons added to internal dictionary - all hail @Zac !

# 0.4.8/0.4.9

* Custom languages now import separately
* Attempt to correct weirdness with optional feature modifier selection on character imports.

# 0.4.7

* In some situations the Unarmored AC would not add unarmored bonuses from items.
* (Regression) Monsters did not detect expertise skills. (0.4.0-0.4.6).

# 0.4.6

* Claws added to weapon icons.
* Dragon Hide feat now detects AC bonus.
* Munching: source filter is now applied to spells and items.

# 0.4.5

* Ammunition that had been customised with silvered property failed to import.
* Some Effects on actors would cause the importer to stumble.
* Items with changed quantity did not update when Updating D&D Beyond.

# 0.4.4

* Good selection of Class Features Added to icon list. (Thanks @Zac !)
* Iron Bands of Binding did not import.
* Bug fix: some AC mods, typically unarmed fighting were not detected in some cases.

# 0.4.3

* MASSIVE BUG: Characters would not import some choices like ability scores during levelling.
* Improved Active Effects transfer.

# 0.4.1/0.4.2

* Bug resulted in Optional Class feature modifiers applied, even if not selected. Please let me know if there are missing features and abilities after installing this version.
* Medium Armour Master did not set increased Dex mod for AC.
* Support for off-hand weapons, dual weilding and two-weapon fighting.

# 0.4.0

* Supporters can now import Extras, these are attached to characters on D&D Beyond. These are things like Ranger Companions, Wild Shape, pets, sidekicks etc.
* If using the magicitems modules, spells for magic items now go into subfolders for their item names.
* Character Sync has been renamed Update D&D Beyond to avoid confusion.
* In some cases characters wouldn't import because senses default data was incorrect.

# 0.3.10

* In some cases healing potions would break import.
* Improve parsing of abilities that have dice associated with them but are not attacks.
* Actions now have an option to use the snippet rather than full text during character import.

# 0.3.8/0.3.9

* Feat, Class, and Races munch now available to Undying supporters.

# 0.3.7

* Cantrip scaling gave incorrect results if character has Potent Spellcasting or similar.
* Werewolf processed it's attack actions incorrectly due to inconsistent formatting.
* Custom proficiencies were not applied to weapons.

# 0.3.6

* After the next character sync the ability to sync action uses will be available.
* If you have restricted import to trusted users only, you can now allow those users to sync their characters.
* Parse things like Way of Astral Self Wisdom based martial arts attack.

# 0.3.5

* New items added to characters from the DDB Item compendium can now be added to characters during sync.
* Equipment sync will update attunement, equipped status and charges used on items.
* Before the option to use Equipment sync appears your character will need to be re-imported using version 0.3.5.

# 0.3.4

* Fix some instances of the template parser not parsing correctly, e.g. Arcane Archer.
* Item screen title bar icon respects white colour choice as well!
* You can now retain Resource Consumption links on individual items/features/spells during updates.

# 0.3.3

* Monsters with Sneak Attack now parse the feature damage correctly. (Thanks bekriebel!)
* Ignored items did not transfer Active Effects on import update.
* Retain condition effects created by CUB.
* Title bar icon can now be set to white.
* Monsters with a ’ in the name such as Grum’shar would not import if searched for explicitly.

# 0.3.2

* Active Effect copy did not copy effects just on the character.
* Active Effects on a character could be duplicated on re-import.
* Active Effects did not retain current enabled status on character.
* Clarified the intent of various Active Effect copy Advanced Settings.

# 0.3.1

* Character Sync now supports XP.
* Owned Items on a character now have a title bar button. This allows an item (or just it's icon) to be excluded from the import when the characer import runs. This is useful if you have added or altered items/spells/features etc to a sheet and wish to retain them. Please let me know if there are specific aspects that would be useful to retain on a item.

# 0.3.0

* Major overhaul of the visual interface.
* New Inbuilt Icon Matching feature (many thanks to @Zac and others who have been filling in details here). All equipment, Spells and Feats in DDB can now be matched against one of the standard 5e provided system or Foundry icons.
* Monster URL link to DDB now can be selectively in the title bar or next to the name.
* DDB Importer link on the character sheet can be selectively in the title bar or next to the name.
* Icon used by DDB Importer changed to the awesome fonts D&D Beyond brand image.
* Feat import failed if use SRD was selected.
* Source filtering now available for Undying Tier supporters.
* Some items like vials and flasks will now show up as consumable.
* Some actions which had consume actions had to be edited before they could be rolled.
* Some items would not import if their charge reset type was not specified.
* Patreon supporters now have access to a limited Character Sync option. This will sync Hit Points, Hit Dice, Exhaustion, Currency, Spell Slots, Spells Prepared, Death Saves, and Inspiration. Action uses, biography/notes, and Equipment will be coming soon.

# 0.2.32/0.2.33

* Some speed bonuses applied to all speed types.
* More metadata additions for various future improvements.
* Monster/NPC sheet open URL button now appears on title bar, to reduce sheet breakage.
* When a characters skill proficiencies are not selected it no longer bombs out.

# 0.2.31

* Allow Classes to be optionally updated on character update/import.
* Improved spell and item metadata.
* Some features (like Rage) were duplicated twice - once as a passive and once as active. This caused problems with tools likes DAE where both features would be changed. Now just the active feature is imported.
* Better detection of Better Rolls consume uses flag.
* If you're not using a cobalt cookie character parsing would fail for some character types.

# 0.2.30

* Bulk spell import was failing.

# 0.2.29

* Some optional class features like Wild Companion no longer imported due to JSON change.
* Small improvements to file detection performance.
* Improved parsing of Stirge, Grell and other creatures with a multi-paragraph attack block.
* Spirit Guardians now attempts to deduce your damage type based on alignment.

# 0.2.27/0.2.28

* Correct Eldritch Cannon: Force Ballista
* Improved detection of files and (hopefully) reduction in forge upload messages

# 0.2.25

* Improved debugging.

# 0.2.25

* Eldritch cannon parsing improvements.
* Fix issue where some actions would fail to parse (notably artificiers).

# 0.2.24

* Improved senses parsing. Blind Fighting now imports blindsight.
* Enriched action parsing for things like Unarmed Fighting actions.
* Fix feat import requirements section.

# 0.2.23

* Experimental beta Feat imports available to God Tier patreon supporters (coming to other tiers later).

# 0.2.22

* Munching Spells and Items can now copy over DAE SRD effects.
* Support Silvered, Magical and Adamantine weapon properties.
* Retain journal notes on characters.
* Some NPC's like Nezznar did not match some spells due to formatting differences.
* Another bug squashed preventing npcs importing from SRD compendiums.

# 0.2.21

* Copy over new attunement status on compendium matched items.
* Race and Class feature imports fill out requirements field.
* You can now import from SRD compendiums again.
* Character with no name will now import.

# 0.2.20

* Monks unarmoured speed added to all speed types.
* Correct Flaming Sphere template size.
* Improved SRD Icon matching speed.
* Bloodhunter subclasses now import.
* Duplicate class features now import as separate features.
* Class Optional features now import in class munch.

# v 0.2.19

* Monster action name is no longer included in the action description.
* Some abilities like Chef: Special Food did not calculate users correctly.
* Importing from compendium did not work if action type had changed.
* Some legendary actions split the charges used into a separate action (e.g. Aboleth).

# v 0.2.18

* Add missing character URL back, will fix broken shift-click functionality on the B icon.
* Spells from some class feature edge cases did not import after Tasha's changed, e.g. Divine Soul extra spells.
* Some string parsing in descriptions resulted in ad "+ +" rather than "+".
* When using a cobalt cookie authentication will now be attempted to retrieve private characters. (i.e. character can now be set to private and imported, as long as you have permission to view them).
* DAE preferred midi compendium when midi-qol was not installed.

# v 0.2.17

* Workflow for prompting for key change
* Monster munch: allow filtering by exact name match [Undying and God tier Patreon supporters]
* Monster munch: filter by source book [God tier Early Access feature]

# v 0.2.16

* Retains Midi-QOL flags/settings on features/items
* If it can, Character Imports will now update items rather than deleting and recreating. This will help modules like Better Roles with rely on item ID.
* Class feature imports when copying SRD entries went to wrong compendium.
* DAE feature swap now available for monsters.
* General improvements to DAE imports for characters.
* A characters magic item spells now import with icons, respecting character settings.
* Monster Munch: Improved action parsing for monsters such as otyugh.
* Monster Munch: Improved parsing of Legendary Actions.
* Save proficiencies from feats, e.g. Resilient
* Warlock monsters now import pact spells, pact spell slots also set and spells marked as pact spells.
* Monster Munch: Improved attacks for monsters like Aurelia
* Monster Munch: Include healing for actions like Warleaders Helix.
* Skill Customization bonuses not coming through.
* Improved parsing of Stone's Endurance, Divine Intervention, and Second Wind.
* Healing potions will now roll damage.
* Better matching for SRD replaced Healing potions.

# v 0.2.14/0.2.15

* Directory picker was not showing in settings screen.

# v 0.2.13

* Settings menu overhaul. New screens for initial/core setup and compendium selection.
* When using Iconizer icons and don't update existing images was checked, no images would be updated, even on new items.
* [BETA] Add Subclass parsing for God Tier supporters.

# v 0.2.12

* Players were unable to upload images

# v 0.2.11

* Racial traits now have their own compendium
* Features compendium when created is now named "Class Features" by default
* Bug where image check came back as null and import failed

# v 0.2.10

* Better class skill detection
* Pull in spells granted by optional class features and Dragonmarked races (patreon supporters only)
* [BETA] Initial class munching - God tier supporters only. No subclasses or subclass features. Yet.

# v 0.2.9

* Dragonborn breath weapon was not parsing DC save type correctly.
* Better detection of optional choices like Mask of the Wild for variant Half Elf's.
* Support Dual Wielding AC Bonus.
* Better UI messages for homebrew.
* Add ID tags to most items and feats for future [redacted].

# v 0.2.7/0.2.8

* Bug when importing characters using use existing features/compendium is checked fixed.

# v 0.2.6

* Monster senses were not opening.

# v 0.2.5

* Optional class features for Rangers now handle speed changes for Deft Explorer (Roving 6th level)
* Races go into their own compendium
* Stability fixes around API and enabled options changing on munch screen.

# v 0.2.4

* Some selection boxes inappropriately enabled.

# v 0.2.3

* Fix a failure during spell and weapon customisation.

# v 0.2.2

* Experimental race import for God Mode Tier patreons to trial.
* Refactored existing item search to improve lookups for future improvements.
* Homebrew monster import toggle.
* Module setting for monsters have vision toggle.
* Devils site was not importing correctly due to senses change in latest D&D system.
* Option to restrict character imports to trusted users only.

# v 0.2.0/0.2.1

* Software is now distributed using webpack, which will increase performance
* Optional features you haven't selected won't show up
* Optional features will now import if you are a God Mode tier patreon supporter, this will come to all users after a small beta window

# v 0.1.16

* Support new attunement options
* Better error reporting on config screen
* Improved character background parsing
* Option to not replace art on monster munch update
* Global option to use Source book acronym rather than full name

# v 0.1.14

* Jarl's were not parsing
* Goodberry healing fix
* Experimental import of items for monsters. This might result in imported items not having the correct attack/damage values. Please fo let me know!
* Critical roll spells now get munched
* Fixed regression where generic ddb item and spell icons are no longer downloaded (otherwise they CORS error)
* Enable extra damage for things like Flame Blade
* Certain Weapons such as Maces always imported as Dex weapons in muncher

# v 0.1.13

* Sir Godfrey Gwilym spells did not import correctly
* Better error messaging for outdated D&D5e system

# v 0.1.12

* Better handling of Access Denied images - if you currently have any broken image files you will need to remove them from your server manually. When using remote images some may still appear broken, e.g. Icewind Kobold.
* Fixed an issue where Bracers of Archery tried to add damage bonus to magic arrow items and failed.
* Added config helper screen for setting up Muncher for the first time.
* Check campaign id/url for join link
* Allip Incorporeal Movement feature did not import correctly.
* Add option to prevent recreation of missing compendiums (@ajclarke)

# v 0.1.11

* Monster Parsing: If image upload fails, fallback to remote image
* Support Senses in DND5E 1.2.0 system for characters and monsters

# v 0.1.10

* Generic loot item images from dndbeyond are here! (Thanks to @CaptainYoshi )
* First pass of option to hide monster action/attack description from players

# v 0.1.9

* Resolved bug with duplicate items when using SRD items

# v 0.1.7

* Minotaur characters had a speed of 0

Monster, monster, monster:
* Fixed issue with bad data causing blights to not import senses correctly.

# v 0.1.6

* Prevent users importing if image upload is not set - present screen with helpful message and tutorials

Monster Parsing:
* Improved lair action detection

# v 0.1.5

* Improved S3 handling (thanks @Ivan Von Girderboot)
* Slimline and fix up logger options

Monster Parsing Bugs:
* Better spellcaster level detection
* Improved at will spell matching for monsters such as the Archmage & Drider
* Monster with self only spells will now have target set to self.
* Parse limited uses of some actions and special actions, e.g. Archer
* Support higher damage dice
* Add restrictions to spell descriptions and names
* Support unique spell DC's e.g. Nezznar the Black Spider
* Remove material components when not required from spells
* Import innate spells for Mephits (they have unique syntax)

# v 0.1.4

Monster Bug Hunt edition:
* Legendary resistance now parses correctly
* Legendary resistance now decrease resource value
* Some Legendary actions did not parse damage or saves correctly
* Better Weapon Type guess, including some natural weapons
* Better Reach detection
* Cone and Line breath target parsing
* Regional effects are now parsed separately to Lair Actions

Other:
* Fixed S3 regression bug (thanks @Ivan Von Girderboot)
* (Option) Copy Active Effects from current character items on import

# v 0.1.3

* Monster parsing no longer downloads images repeatedly on S3 (thanks @Ivan Von Girderboot)
* Compatibility bump
* Support custom AC magic, misc and over ride values

# v 0.1.2

* Updating README and module dependencies
* Option to use generic magic item icons from DDB
* Fix a darkvision bug with goggles of night
* If a monster has legendary actions it appears in token bar 2, as per SRD monsters

# v 0.1.1

* Some monsters did not download avatar images correctly

# v 0.1.0

* Monster imports enabled for Patreon supporters
* Fix broken innate spellcasting for monster parser
* Tortle AC fix
* When importing from SRD try and update icons if they don't already have one

# v 0.0.31

* Monster token import fixes

# v 0.0.30

* Improved image handling for monster uploads
* Spell school and item images split into separate options

# v 0.0.29

* Fix up Booming Blade and Green-Flame blade cantrips for errata changes

# v 0.0.28

* Prefer DDB Equipment icons over others

# v 0.0.27

* Improvements to broken source name lookup
* Items/Weapons can now download/use D&D Beyond images
* Use remote dndbeyond images rather than downloading
* Monster parsing moved into git

# v 0.0.26

* Error checking around Campaign Id
* Add custom proficiencies for Weapons, Languages, Tools, and Armor

# v 0.0.25

* Improved import screen wording
* Compendium import now respects proficiency in weapons

# v 0.0.24

* Support monk/kensei weapon damage scaling
* Fix up broken Hex Warrior parsing
* If importing from a compendium, fix up proficiency in weapon

# v 0.0.21

* Compendium import will now use Iconizer if it's installed and active for missing icons
* Even more SRD icon matching
* Allow use of DDB Spell School icons

# v 0.0.20

* Override HP not working correctly
* Improved SRD icon matching


# v 0.0.19

* Fix a problem with null custom senses
* Support sharing content via Campaigns

# v 0.0.17

* Bug prevented DAE copy import option appearing
* Fixed import issue for features like Psychic Blades which stopped the ability bonus addition to damage
* Improved SRD icon name matching

# v 0.0.16

* Bug prevented module loading where DAE was not installed.

# v 0.0.15

* Support Dynamic Active Effect replacements if you have DAE SRD module installed
* Handle new proficiency bonus based resources/features
* Divine Sense on Paladins (and possibly some other resources/features) imported incorrectly

# v 0.0.14

* Temporary fixes for partial Tasha's implementation causing some character imports to fail.

# v 0.0.13

* Make cobalt setting DM only

# v 0.0.11

* Improved parsing for Tasha's changes
* Structure in place for handling monster parsing

