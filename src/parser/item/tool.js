import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

function isHalfProficiencyRoundedUp(data, ab) {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => ab === ability.value)
    .map((ability) => ability.long)[0];
  const roundUp = DDBHelper.filterBaseModifiers(data, "half-proficiency-round-up", { subType: `${longAbility}-ability-checks` });
  return Array.isArray(roundUp) && roundUp.length;
}

function getProficiency(data, toolName, ability) {
  const mods = DDBHelper.getAllModifiers(data, { includeExcludedEffects: true });
  const modifiers = mods
    .filter((modifier) => modifier.friendlySubtypeName === toolName)
    .map((mod) => mod.type);

  const toolExpertise = data.character?.classes
    ? data.character.classes.some((cls) =>
      cls.classFeatures.some((feature) => feature.definition.name === "Tool Expertise" && cls.level >= feature.definition.requiredLevel)
    )
      ? 2
      : 1
    : 1;

  const halfProficiency
    = DDBHelper.getChosenClassModifiers(data).find(
      (modifier) =>
        // Jack of All trades/half-rounded down
        (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
        // e.g. champion for specific ability checks
        || isHalfProficiencyRoundedUp(data, ability)
    ) !== undefined
      ? 0.5
      : 0;

  const proficient = modifiers.includes("expertise")
    ? 2
    : modifiers.includes("proficiency")
      ? toolExpertise
      : halfProficiency;

  return proficient;
}

export default function parseTool(ddb, data, itemType) {
  /**
   * MAIN parseTool
   */
  let tool = {
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: "tool",
    system: utils.getTemplate("tool"),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  const defaultAbility = DICTIONARY.character.proficiencies.find((prof) => prof.name === tool.name);

  tool.system.ability = defaultAbility?.ability ?? "dex";
  tool.system.description = getDescription(data);
  tool.system.proficient = (ddb) ? getProficiency(ddb, tool.name, tool.system.ability) : 0;
  tool.system.source = DDBHelper.parseSource(data.definition);
  tool.system.quantity = getQuantity(data);
  tool.system.weight = getSingleItemWeight(data);
  tool.system.equipped = getEquipped(data);
  tool.system.rarity = getItemRarity(data);
  tool.system.identified = true;
  tool.system.uses = getUses(data);

  return tool;
}
