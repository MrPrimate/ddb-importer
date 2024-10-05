# D&D 2024 and the Foundry D&D 5e v4.x FAQ

## Is this ready for primetime?

No. Please consider the content broken, especially for 2024 characters and spells until version 6.1.0 of DDB Importer.
When that happens this note will disappear.

When will that be? This is difficult to say, but probably mid-late October.

## What versions support 2024 content?

You will need to upgrade the Foundry D&D system to 4.x+, and DDB Importer to 6.x+ to import the 2024 content.

## I don't want to import 2024 content

If you stay on the 3.x D&D System and 5.x DDB Importer you will not get 2024 content (mostly).

As off now there is no filter to remove 2024 content during import in the 6.x version of DDB Importer. This may come at a later date.

## How do I install an older version of DDB Importer

Visit the [modules page](https://foundryvtt.com/packages/ddb-importer/) on the Foundry website.

In the list of releases find the release you want.
The 6.x.x+ series of DDB Importer _only_ supports Foundry v12 and D&D 4.x+.

Right click on the Manifest URL link, and select `Copy Link`.

Go to your Foundry Setup screen, and to the `Add-on Modules` section.
Uninstall DDB Importer if it's already installed.
Click `Install Module`.
Paste the link into the `Manifest URL` box at the bottom and click `Install`.

## So 2024 is fully implemented for import?

No. Please see this [Known Issues list](https://github.com/MrPrimate/ddb-importer/issues/505)

The big issues that might be stopping you upgrading straight away are:

- No character imports into compendiums (class/features/species/background etc)
- Monsters may pick up 2024 versions of spells.
- Many 2024 character features have not been tested, and there are a number of missing icons for features.
- If you run a high automation game, many of the automation modules are not yet compatible.

## Can I still import adventures?

Yes, any adventure listed in [the status page](https://docs.ddb.mrprimate.co.uk/status.html) can still be imported.

## Can I update characters back to D&D Beyond?

- Some bits. Features/ACtions are likely to not work.

## How long till I can import backgrounds, features, species, and classes into compendiums?

This will likely take a couple of months or more. (Late 2024).

## I have found a problem/want to make a suggestion

Please add to the [Known Issues list](https://github.com/MrPrimate/ddb-importer/issues/505) or the [#bugs](https://discord.gg/aUQBCa9bv8) channel.

## Characters I import have additional stats boosts

This is likely because a legacy background was selected and the stats adjusted on the Abilities page of the DDB Character Builder, and then later switched to a 2024 background.

Go into the Character Builder and select a legacy background, switch to the Abilities page and select "Choose an Option" in the stats drop down.
Switch back to your chosen 2024 background, reselect the ability boosts, and reimport your character.
