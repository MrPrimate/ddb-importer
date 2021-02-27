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
