import getCharacter from "./character/index.js";
import getActions from "./features/actions.js";
import getFeatures from "./features/features.js";
import getClasses from "./classes/index.js";
import { getCharacterSpells } from "./spells/getCharacterSpells.js";
import { getItemSpells } from "./spells/getItemSpells.js";
import getInventory from "./inventory/index.js";
import getSpecial from "./special/index.js";

export function parseJson(ddb) {
  let character = getCharacter(ddb);
  let features = getFeatures(ddb, character);
  let classes = getClasses(ddb);
  let spells = getCharacterSpells(ddb, character);
  let actions = getActions(ddb, character);
  let itemSpells = getItemSpells(ddb, character);
  let inventory = getInventory(ddb, character, itemSpells);

  let characterJSON = {
    character: character,
    features: features,
    classes: classes,
    inventory: inventory,
    spells: spells,
    actions: actions,
    itemSpells: itemSpells,
  };

  getSpecial(characterJSON);

  return characterJSON;
}
