# v6 changes

- [MAJOR UPDATE]: a full reimport/munch is recommended to gain the improvements provided by the new v6.0.x D&D System. Over 400 new parser improvements.
- A massive number of changes and improvements to support the new regions, effect expiry conditions, teleporting activities, and many other improvements.
- [REMOVAL]: Active Auras support is removed. Aura Effects is the drop in alternative. DDB Importer now has a native Experimental setting to add low automation to many template/region based activities (See Experimental entry below), although this is disabled by default. Several of the auras that were previosuly handled by AA or AE are now system native. If Aura Effects is installed then the system will use this over template/region attached effects in a lot of cases.
- [EXPERIMENTAL]: DDB Region Behaviours - will use the movement triggers for regions to put appropriate saves into chat to be rolled (rolling isn't automated). E.g. Spike Growth. Can be disabled in Enhancement Settings.
- [EXPERIMENTAL]: DDB Region Cleanup - a tool to help cleanup expired region effect - will offer a prompt to remove a region when it thinks it has expired. You probably don't want this active if using tools like midi-qol or CPR. Can be disabled in Enhancement Settings.
- Custom DDB Region Trigger that allows activities to be posted to chat, or macros to be called.
- Effects that generate a global damage bonus will add the types (previously just dice string). E.g. 2014 Paladin Improved Divine Smite
- Characters imported with the Healer feat will get the appropriate rolls modified with appropriate dice modifiers
- The `Add D&D Beyond tool proficiencies?` setting now also controls whether free-text and exotic tool proficiencies are added to the character, not just whether they are registered with the system.

# Next Up

# 7.4.4

- Some 2024 Companions would incorrectly type Damage immunities as custom conditions. (Reanimator companion). @redarchongaming
- Scene Snip Processor Improvements

# Previous Changes

See the [CHANGELOG-historic.md](./CHANGELOG-historic.md)
