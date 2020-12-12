# v 0.1.12

* Better handling of Access Denied images - if you currently have any broken image files you will need to remove them from your server manually. When using remote images some may still appear broken, e.g. Icewind Kobold.

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
