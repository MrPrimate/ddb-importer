import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

let isHalfProficiencyRoundedUp = (data, ab) => {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => ab === ability.value)
    .map((ability) => ability.long)[0];
  const roundUp = utils.filterBaseModifiers(data, "half-proficiency-round-up", `${longAbility}-ability-checks`);
  return Array.isArray(roundUp) && roundUp.length;
};

let getProficiency = (data, toolName, ability) => {
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
};

/**
 * Checks if the character can attune to an item and if yes, if he is attuned to it.
 */
let getAttuned = (data) => {
  if (data.definition.canAttune !== undefined && data.definition.canAttune === true) {
    return data.isAttuned;
  } else {
    return false;
  }
};

/**
 * Checks if the character can equip an item and if yes, if he is has it currently equipped.
 */
let getEquipped = (data) => {
  if (data.definition.canEquip !== undefined && data.definition.canEquip === true) {
    return data.equipped;
  } else {
    return false;
  }
};

/**
 * Gets Limited uses information, if any
 * uses: { value: 0, max: 0, per: null }
 */
let getUses = (data) => {
  if (data.limitedUse !== undefined && data.limitedUse !== null) {
    let resetType = DICTIONARY.resets.find((reset) => reset.id == data.limitedUse.resetType);
    return {
      max: data.limitedUse.maxUses,
      value: data.limitedUse.numberUsed
        ? data.limitedUse.maxUses - data.limitedUse.numberUsed
        : data.limitedUse.maxUses,
      per: resetType.value,
    };
  } else {
    return { value: 0, max: 0, per: null };
  }
};

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

  /* "ability": "int", */
  // well. How should I know how YOU are using those tools. By pure intellect? Or with your hands?
  tool.data.ability = DICTIONARY.character.proficiencies
    .filter((prof) => prof.name === tool.name)
    .map((prof) => prof.ability);

  if (!tool.data.ability) tool.data.ability = "dex";

  // description: {
  //     value: '',
  //     chat: '',
  //     unidentified: ''
  // },
  tool.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  /* proficient: true, */
  tool.data.proficient = (ddb) ? getProficiency(ddb, tool.name, tool.data.ability) : 0;

  /* source: '', */
  tool.data.source = utils.parseSource(data.definition);

  /* quantity: 1, */
  tool.data.quantity = data.quantity ? data.quantity : 1;

  /* weight */
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  tool.data.weight = totalWeight / bundleSize;

  /* attuned: false, */
  tool.data.attuned = getAttuned(data);

  /* equipped: false, */
  tool.data.equipped = getEquipped(data);

  /* rarity: '', */
  tool.data.rarity = data.definition.rarity;

  /* identified: true, */
  tool.data.identified = true;

  tool.data.uses = getUses(data);

  return tool;
}
