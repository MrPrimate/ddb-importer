/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import { logger } from "../../../lib/_module.mjs";
import { DDBModifiers } from "../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EldritchBlast extends DDBEnricherData {

  _getEldritchInvocations() {
    let damage = "";
    let range = 0;

    const eldritchBlastMods = DDBModifiers.filterBaseModifiers(this.ddbParser.ddbData, "eldritch-blast").filter((modifier) => modifier.isGranted);

    eldritchBlastMods.forEach((mod) => {
      switch (mod.subType) {
        case "bonus-damage": {
          // almost certainly CHA :D
          const abilityModifierLookup = DICTIONARY.actor.abilities.find((ability) => ability.id === mod.statId);
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
    const eldritchBlastMods = this.ddbParser.isMuncher
      ? null
      : this.ddbParser.ddbData
        ? this._getEldritchInvocations()
        : null;

    if (eldritchBlastMods?.range && Number.parseInt(eldritchBlastMods.range)) {
      const range = Number.parseInt(initialRange) + Number.parseInt(eldritchBlastMods.range);
      return `${range}`;
    }
    return initialRange;
  }

  eldritchBlastDamageBonus() {
    const eldritchBlastMods = this.ddbParser.isMuncher
      ? null
      : this.ddbParser.ddbData
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
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, type: "force", scalingMode: "none", bonus: this.eldritchBlastDamageBonus() })],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.range.value": this.eldritchBlastRangeAdjustments(this.ddbParser.ddbDefinition?.range?.rangeValue ?? 0),
      },
    };
  }

}
