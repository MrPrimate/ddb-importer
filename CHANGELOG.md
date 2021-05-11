# 1.0.6

* Boots of Striding and Springing did not set speed adjustment correctly.

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
