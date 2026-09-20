import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

/**
 * Four charge-fed properties; DDB carries no charges for the rod. The parser's primary becomes
 * the Sandblast attack. Sandstorm is a 15-foot emanation held with concentration; its save is
 * rolled by hand against a creature that moves in or starts its turn there, never the holder.
 * Sand Summon triples movement costs, which is left to the table.
 */
export default class HrethiSoulScepter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sandblast",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      flatAttack: "10",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["bludgeoning"] }),
      ],
      data: {
        attack: { ability: "none", type: { value: "ranged", classification: "spell" } },
        damage: { includeBase: false },
        range: { override: true, value: "60", units: "ft" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Sandstorm", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Heavily obscured for creatures other than you; ordinary projectiles entering it miss",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "radius", size: "15" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "hour", concentration: true },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "5",
          noeffect: true,
        },
      },
      {
        init: { name: "Sandstorm Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, types: ["bludgeoning"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Moves into the sandstorm for the first time on its turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "half" } },
        },
      },
      {
        init: { name: "Sand Summon", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Creatures spend 3 feet of movement for every 1 foot moved through the area",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "30" },
          },
          rangeOverride: { override: true, value: "60", units: "ft" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "3",
          noeffect: true,
        },
      },
      itemActivity("Soul of the H'rethi", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        activationCondition: "Summons a sand elemental (an Earth Elemental confined to sandy terrain) within 30 feet, with concentration for up to 1 hour",
        noConsumeTargets: false,
        addItemConsume: true,
        itemConsumeValue: "3",
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "20", [{ period: "dawn", type: "formula", formula: "2d6 + 8" }]);
  }

}
