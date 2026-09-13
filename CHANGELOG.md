# Next Up

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
