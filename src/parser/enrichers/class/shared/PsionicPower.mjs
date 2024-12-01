/* eslint-disable class-methods-use-this */
import { DDBHelper } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsionicPower extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    const formula = `1@scale.${DDBHelper.classIdentifierName(this.ddbParser.subKlass)}.energy-die.die`;
    const result = {
      name: "",
      type: "utility",
      addItemConsume: true,
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula,
          name: "Roll Bonus",
        },
      },
    };

    if (this.isSubclass("Soulknife")) {
      result.name = "Psi-Bolstered Knack";
    } else {
      result.name = "Protective Field";
      result.activationType = "reaction";
      result.targetType = "creature";
      result.data.range = {
        units: "ft",
        value: "30",
      };
    }
    return result;
  }

  get additionalActivities() {
    const results = [];
    if (this.isSubclass("Soulknife")) {
      results.push(
        { action: { name: "Psionic Power: Psychic Whispers", type: "class" } },
      );
    } else {
      results.push(
        { action: { name: "Psionic Power: Psionic Strike", type: "class" } },
        { action: { name: "Psionic Power: Telekinetic Movement", type: "class" } },
      );
    }

    if (this.is2014) {
      results.push({
        action: { name: "Psionic Power: Recovery", type: "class" },
      });
    }
    return results;
  }

  get override() {
    const spent = this.isSubclass("Soulknife")
      ? this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Soulknife")
      : this._getSpentValue("class", "Psionic Power: Psionic Energy Dice", "Psi Warrior");

    const recovery = [
      { period: "lr", type: 'recoverAll', formula: undefined },
    ];
    if (!this.is2014) {
      recovery.push({ period: "sr", type: 'formula', formula: "1" });
    }
    const subclass = this.ddbParser.subKlass === "Soulknife"
      ? "soulknife"
      : "psi-warrior";

    return {
      data: {
        "system.uses": {
          spent,
          max: this.is2014 ? "@prof * 2" : `@scale.${subclass}.energy-die.number`,
          recovery,
        },
      },
    };
  }

}
