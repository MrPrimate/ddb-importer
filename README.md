# D&D Beyond Importer

Import your dndbeyond.com characters into Foundry Virtual Tabletop.

This module is similar to vtta-dndbeyond, in fact I have been a large contributor to the character parser.

This module:
* Parses characters similar to vtta-dndbeyond but with better accuracy.
* _Won't_ add items, and spells to the compendiums during character import. There's a new tools to do that! Class features are still added to the Features compendium.
* Can bulk import spells.
* Can bulk import items.
* [Patreon](https://patreon.com/mrprimate) supporters can bulk import monsters. These monsters come from JSON definitions, so parsing is easier.
* [Not yet available] Can bulk import simple class feature descriptions.
* When you import a Cleric or Druid it will import _all_ your spells.*

In addition you can:

- Use supplied SRD items where available.
- Choose to use matching SRD icons.

## Examples

![](./docs/bulk-spell-import.gif)

## What's the catch?

Calls to dndbeyond are proxied to provide authentication and to bypass CORS checks.

The proxy calls dndbeyond with your credentials to fetch your data.

To get all your spells and do bulk importing you need to set the Cobalt Cookie setting to the value of your D&DBeyond `CobaltSession` cookie. See my helper [Chrome extension](https://github.com/mrprimate/ddb-importer-chrome) to help.

Do **NOT** give your cookie to other people, this is like handing out a password to your dndbeyond account.

We do not store your cobalt cookie on the server.

To logout/invalidate these credentials log out of your D&DBeyond Session.

## Notes

You CAN use this alongside the vtta-dndbeyond extension, two icons will show up. This extension has yellow text on the B symbol.

## Support

Where can you support me? See my [Patreon](https://patreon.com/mrprimate).

You can log bugs here, or mention them in the [Discord channel](https://discord.gg/WzPuRuDJVP).

## What's next?

If I get enough support I will work on getting Artificers infusions importing and seeing what active effects can be extracted and automatically added.

## Pre-requisites and recommendations

I'd recommend installing:

- Iconizer, install it by pasting [this link for now](https://github.com/MrPrimate/vtta-iconizer/releases/download/latest/module.json)
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
* proficiency


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



# FAQ

## Why do my compendium features not get updated on import?

This is a different feature to vtta-dndbeyond, use the bulk import tool to import features, spells and items.

## The import buttons are greyed out!

They require the cobalt token setting to be set.
Remember don't share this token with anyone, it can be used to access your DDB account.

## Clerics and Druids don't get their un-prepared spells

You need to have the cobalt token set to get these spells.

# Known Issues


## Magic Items don't have spells attached

When you use the Magic Items module and Munch Items the spells are not attached to the Item.
This is a tricky issue and parsing these things out of the item text takes time as they are not exposed as an attached object to the item.

