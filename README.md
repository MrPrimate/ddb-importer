# D&D Beyond Importer

Import your dndbeyond.com characters into Foundry Virtual Tabletop.

This module is similar to vtta-dndbeyond, in fact I have been a large contributor to the character parser.

This module:
* Parses characters similar to vtta-dndbeyond but with better accuracy.
* Can bulk import spells.
* [Not yet available] Can bulk import monsters. These monsters come from JSON definitions, so parsing is easier.
* When you import a Cleric or Druid it will import _all_ your spells.*

In addition you can:

- Use supplied SRD items where available.
- Choose to use matching SRD icons.

## Examples

![](./docs/bulk-spell-import.gif)

## What's the catch?

Parsing is remote, this is because of the nature of the calls made to the dndbeyond api that can't be done browser side. It will cache your characters data for around 15 minutes, more if the service is busy.
- There maybe an option to remove this restriction to patreon supporters in the future.
- In order to get all your spells and do bulk importing you need to set the Cobalt Cookie setting to the value of your D&DBeyond `CobaltSession` cookie. See my helper [Chrome extension](https://github.com/mrprimate/ddb-importer-chrome) to help.
- Do **NOT** give your cookie to other people, this is like handing out a password to your dndbeyond account.

## Notes

You CAN use this alongside the vtta-dndbeyond extension, two icons will show up. This extension has yellow text on the B symbol.

## Support

Where can you support me? See my [Patreon](https://patreon.com/mrprimate).

## What's next?

If I get enough support I will work on getting Artificers infusions importing and seeing what active effects can be extracted and automatically added.

## Pre-requisites and recommendations

I'd recommend installing:

- [The Tokenizer](https://www.vttassets.com/asset/vtta-tokenizer) and
- [The Iconizer](https://www.vttassets.com/asset/vtta-iconizer)
- [Magic Items](https://foundryvtt.com/packages/magicitems/)
- [Skill Customization for D&D5E](https://foundryvtt.com/packages/skill-customization-5e/)

These all offer enhancements for your game, and the parser will attempt to add flags to use them.

## SRD Import Notes

Some detail will be lost:

* Any auto configuration of Magic Item spells
* Any custom damage modifications from things like Fighting Styles and Improved Divine Smite

Some details are updated, if applicable:

* number of uses
* quantity of items
* attuned status
* equipped status
* resource tracking
* spell preparation status


## Configuration

### Avatar upload directory

Sets the icon directory where you are storing your avatar image uploads. It's relative to the Foundry `/Data` directory, please do not add a leading or trailing slash to this path.

Examples:

- `img/uploads` references to `[Foundry]/Data/img/uploads`
- `uploads` references to `[Foundry]/Data/uploads`
- `` references to `[Foundry]/Data` - not recommended

# Entity import policy

Three settings are available:

- **Save all entities, overwrite existing ones** - Imported entities will be saved to their designated compendium, which you will set below. Existing entries will be updated/ overwritten. Great if you want to import all your stuff into Foundry
- **Save new entities only, do not overwrite existing ones** - Import only entities currently not available in the compendiums
- **Do not save the entities at** all - Just do nothing. If you choose this, you do not need to set the compendium entries below

