# FAQ

## The import buttons are greyed out!

They require the cobalt token setting to be set.

# My Core settings screen won't open

Open the Browser Developer Console (F12) and run the following:

```javascript
DDBImporter.resetSecrets();
```

# I tried the custom proxy and want to reset to use yours

Open the Browser Developer Console (F12) and run the following:

```javascript
DDBImporter.resetProxy();
```

## I get a key does not exist error!

I get an error along the lines of:

```
The key xxxx does not exist in the EmbeddedCollection Collection
```

This is a core Foundry bug and will hopefully be fixed in version 9 of the software. You can find out more [here](https://gitlab.com/foundrynet/foundryvtt/-/issues/5312) and [here](https://gitlab.com/foundrynet/foundryvtt/-/issues/5309).


## Clerics and Druids don't get their un-prepared spells

You need to have the cobalt token set to get these spells.

## Magic Items don't have spells attached

When you use the Magic Items module and Munch Items the spells are not attached to the Item.
This is a tricky issue and parsing these things out of the item text takes time as they are not exposed as an attached object to the item.

## Can I import books/adventures?

Yes! But you should see the [DDB Adventure Muncher](https://github.com/MrPrimate/ddb-adventure-muncher).

## My Characters AC is wrong

This is almost certainly because you have the "Dynamic Active Effects" module installed. In the DAE module settings make sure you untick the set base AC and autocalculate ac options or DAE will try to do that for you.

It might also be because your AC settings in the "Active Effects" tab is incorrect.

## My characters hit points are wrong

First try adding a level and removing it, sometimes the underlying JSON cna get stuck on another level.


## Explain Active Effects

There are some good primer docs [here](https://docs.google.com/document/d/1hgCJ4evPXo1gabJ_1z8AZLnsAtNdETlRgqWyZL28nMs/edit) and [here](https://docs.google.com/document/d/1DuZaIFVq0YulDOvpahrfhZ6dK7LuclIRlGOtT0BIYEo/edit)

The [DAE Readme](https://gitlab.com/tposney/dae/-/blob/master/Readme.md) is useful.

### History:

* The parser was born before before the special traits and DAE/active effects existed.
* The parser does not require DAE to work .
* It translates a character on DDB to a sheet in foundry.
* Some of the more exotic effects got added as 5e special traits.
* Active Effects came along.

### Currently

- the parser will try and use special traits if they are available. other wise it tries to best apply the effects your character has.
- it offers you the option to swap out matching features for those in DAE. it does not clean these up for you/resulting mismatches/extra effects


### Dream

- the importer will offer you "regular" or "effects" driven approach


## How can I share content between my worlds in Foundry?

Setup a shared compendium module. [Read](https://www.reddit.com/r/FoundryVTT/comments/fvw3c7/how_to_create_a_tiny_module_for_shared_content/) or [watch](https://www.youtube.com/watch?v=Q23cJJ36kX8) how.

### I've upgraded to a new major Foundry version how do I migrate my shared compendium content to the new model?

Open the Browser Developer Console (F12) and run the following:

```javascript
DDBImporter.migrateCompendiums();
```

Okay so I have migrated to D&D 5e sytem version 1.4.0/1 and now none of my shared compendium monster AC's are right!

Answer: run the above migration command.

## Do I need Compendium Content or the Character builder content?

* For integrating characters/spells/items you need to the character builder content.

* For adventure muncher you need the compendium content.

## Can I update all my characters without opening each one?

Yes, use the following macro:

```javascript
const actors = game.actors;
for (let [key, value] of actors.entries()) {
  const ddbImported = 'ddbimporter' in value.data.flags;
  if (ddbImported && value.type === "character") {
    console.log('Importing: ' + value.data.name);
    await DDBImporter.importCharacter(value);
  }
}
```
