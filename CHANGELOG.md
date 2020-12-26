# v 0.2.13

* Settings menu overhaul. New screens for initial/core setup and compendium selection.

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
