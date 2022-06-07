# 2.9.49

* Updating characters on DDB could fail if racial traits had been munched with the old format into a compendium.
* Remove dependency on About Time.

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
