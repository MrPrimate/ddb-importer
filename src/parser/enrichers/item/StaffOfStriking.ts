import DDBEnricherData from "../data/DDBEnricherData";
import { weaponRange } from "./_ItemActivities";

/**
 * Staff of Striking: spend up to 3 charges on a hit for 1d6 force per charge. DDB's "Per Charge
 * (Max 3)" modifier put a single 1d6 on every hit, so the attack rolls none of it, and the charge
 * damage rolls only its own dice.
 */
export default class StaffOfStriking extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { primaryOnly: true, data: { damage: { includeBase: true, parts: [] } } };
  }
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Charge Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          includeBaseDamage: false,
          activationOverride: { type: "special", value: null, condition: "When you hit with a melee attack using the staff" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(@scaling)d6", types: ["force"] })],
          targetOverride: { affects: { count: "1", type: "creature", choice: false, special: "" } },
          rangeOverride: { override: true, ...weaponRange(this), special: "" },
        },
        overrides: {
          addItemConsume: true,
          addScalingMode: "amount",
          addConsumptionScalingMax: "min(3, @item.uses.value)",
        },
      },
    ];
  }

}
