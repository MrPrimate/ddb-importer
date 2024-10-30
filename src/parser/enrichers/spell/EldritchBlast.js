/* eslint-disable class-methods-use-this */
import DICTIONARY from "../../../dictionary.js";
import DDBHelper from "../../../lib/DDBHelper.js";
import logger from "../../../logger.js";
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class EldritchBlast extends DDBEnricherMixin {

  _getEldritchInvocations() {
    let damage = "";
    let range = 0;

    const eldritchBlastMods = DDBHelper.filterBaseModifiers(this.ddbParser.ddbData, "eldritch-blast").filter((modifier) => modifier.isGranted);

    eldritchBlastMods.forEach((mod) => {
      switch (mod.subType) {
        case "bonus-damage": {
          // almost certainly CHA :D
          const abilityModifierLookup = DICTIONARY.character.abilities.find((ability) => ability.id === mod.statId);
          if (abilityModifierLookup) {
            if (damage !== "") damage += " + ";
            damage += `@abilities.${abilityModifierLookup.value}.mod`;
          } else if (mod.fixedValue) {
            if (damage !== "") damage += " + ";
            damage += `${mod.fixedValue}`;
          }
          break;
        }
        case "bonus-range":
          range = mod.value;
          break;
        default:
          logger.warn(`Not yet able to process ${mod.subType}, please raise an issue.`);
      }
    });

    return {
      damage: damage,
      range: range,
    };
  }

  eldritchBlastRangeAdjustments(initialRange) {
    const eldritchBlastMods = this.ddbParser?.ddbData
      ? this._getEldritchInvocations()
      : null;

    if (eldritchBlastMods?.range && Number.parseInt(eldritchBlastMods.range)) {
      const range = Number.parseInt(initialRange) + Number.parseInt(eldritchBlastMods.range);
      return `${range}`;
    }
    return initialRange;
  }

  eldritchBlastDamageBonus() {
    const eldritchBlastMods = this.ddbParser?.ddbData
      ? this._getEldritchInvocations()
      : null;
    const bonus = eldritchBlastMods?.damage
      ? `${eldritchBlastMods["damage"]}`
      : "";

    return bonus;
  }


  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        damage: {
          parts: [DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 10, type: "force", scalingMode: "none", bonus: this.eldritchBlastDamageBonus() })],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.range.value": this.eldritchBlastRangeAdjustments(this.ddbParser.spellDefinition?.range?.rangeValue ?? 0),
      },
    };
  }

}
