# D&D Beyond Importer

Import your dndbeyond.com characters into Foundry Virtual Tabletop.

This module is similar to ddb-importer, in fact I have been a large contributor to the character parser.

This module only parsers characters.
It won't import monseters, etc.

## Pre-requisites and recommendations

I'd recommend installing:

- [The Tokenizer](https://www.vttassets.com/asset/vtta-tokenizer) and
- [The Iconizer](https://www.vttassets.com/asset/vtta-iconizer)
- [Magic Items](https://foundryvtt.com/packages/magicitems/)


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

