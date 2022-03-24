import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

function isHalfProficiencyRoundedUp(data, ab) {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => ab === ability.value)
    .map((ability) => ability.long)[0];
  const roundUp = utils.filterBaseModifiers(data, "half-proficiency-round-up", `${longAbility}-ability-checks`);
  return Array.isArray(roundUp) && roundUp.length;
}

function getProficiency(data, toolName, ability) {
  const modifiers = [
    utils.getChosenClassModifiers(data, true),
    utils.getModifiers(data, "race", true),
    utils.getModifiers(data, "background", true),
    utils.getModifiers(data, "feat", true),
    utils.getActiveItemModifiers(data, true),
  ]
    .flat()
    .filter((modifier) => modifier.friendlySubtypeName === toolName)
    .map((mod) => mod.type);

  const halfProficiency =
    utils.getChosenClassModifiers(data).find(
      (modifier) =>
        // Jack of All trades/half-rounded down
        (modifier.type === "half-proficiency" && modifier.subType === "ability-checks") ||
        // e.g. champion for specific ability checks
        isHalfProficiencyRoundedUp(data, ability)
    ) !== undefined
      ? 0.5
      : 0;

  const proficient = modifiers.includes("expertise") ? 2 : modifiers.includes("proficiency") ? 1 : halfProficiency;

  return proficient;
}

export default function parseTool(ddb, data, itemType) {
  /**
   * MAIN parseTool
   */
  let tool = {
    name: data.definition.name,
    type: "tool",
    data: JSON.parse(utils.getTemplate("tool")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  tool.system.ability = DICTIONARY.character.proficiencies
    .filter((prof) => prof.name === tool.name)
    .map((prof) => prof.ability);

  if (!tool.system.ability) tool.system.ability = "dex";
  tool.system.description = getDescription(data);
  tool.system.proficient = (ddb) ? getProficiency(ddb, tool.name, tool.system.ability) : 0;
  tool.system.source = utils.parseSource(data.definition);
  tool.system.quantity = getQuantity(data);
  tool.system.weight = getSingleItemWeight(data);
  tool.system.equipped = getEquipped(data);
  tool.system.rarity = getItemRarity(data);
  tool.system.identified = true;
  tool.system.uses = getUses(data);

  return tool;
}
