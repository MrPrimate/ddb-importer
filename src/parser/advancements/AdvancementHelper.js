import utils from '../../lib/utils.js';

export default class AdvancementHelper {

  static convertToSingularDie(advancement) {
    advancement.title += ` (Die)`;
    for (const key of Object.keys(advancement.configuration.scale)) {
      advancement.configuration.scale[key].n = 1;
    }
    return advancement;
  }

  static renameTotal(advancement) {
    advancement.title += ` (Total)`;
    return advancement;
  }

  static addAdditionalUses(advancement) {
    const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
    const update = {
      configuration: {
        identifier: `${advancement.configuration.identifier}-uses`,
        type: "number",
        scale: {},
      },
      title: `${advancement.title} (Uses)`,
    };

    for (const [key, value] of Object.entries(advancement.configuration.scale)) {
      update.configuration.scale[key] = {
        value: value.n,
      };
    }
    adv.updateSource(update);

    return adv.toObject();
  }

  static addSingularDie(advancement) {
    const scaleValue = AdvancementHelper.convertToSingularDie(duplicate(advancement));

    scaleValue._id = foundry.utils.randomID();
    scaleValue.configuration.identifier = `${advancement.configuration.identifier}-die`;

    return scaleValue;
  }

  static generateScaleValueAdvancement(feature) {
    // distance, number, dice, anything
    let type = "string";
    const die = feature.levelScales[0]?.dice
      ? feature.levelScales[0]?.dice
      : feature.levelScales[0]?.die
        ? feature.levelScales[0]?.die
        : undefined;

    if (die?.diceString && (!die.fixedValue || die.fixedValue === "")) {
      type = "dice";
    } else if (feature.levelScales[0].fixedValue
      && feature.levelScales[0].fixedValue !== ""
      && Number.isInteger(feature.levelScales[0].fixedValue)
    ) {
      type = "number";
    }

    const advancement = new game.dnd5e.documents.advancement.ScaleValueAdvancement();

    const update = {
      configuration: {
        identifier: utils.referenceNameString(feature.name).toLowerCase(),
        type,
        scale: {},
      },
      value: {},
      title: feature.name,
    };

    feature.levelScales.forEach((scale) => {
      const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
      if (type === "dice") {
        update.configuration.scale[scale.level] = {
          n: die.diceCount,
          die: die.diceValue,
        };
      } else if (type === "number") {
        update.configuration.scale[scale.level] = {
          value: scale.fixedValue,
        };
      } else {
        let value = (die.diceString && die.diceString !== "")
          ? die.diceString
          : "";
        if (die.fixedValue && die.fixedValue !== "") {
          value += ` + ${die.fixedValue}`;
        }
        if (value === "") {
          value = scale.description;
        }
        update.configuration.scale[scale.level] = {
          value,
        };
      }
    });

    advancement.updateSource(update);

    return advancement.toObject();
  }

}
