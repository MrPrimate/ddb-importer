import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * Four charge-fed properties; DDB carries no charges for the rod. The parser's primary becomes
 * the Sandblast attack. Sandstorm is a 15-foot emanation held with concentration whose region
 * fires the save against a creature that moves in or starts its turn there, never the holder.
 * Sand Summon triples movement costs, which the doubled cost of difficult terrain understates.
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
      regionPlacer("Sandstorm", {
        template: { type: "radius", size: "15" },
        activationCondition: "Heavily obscured for creatures other than you; ordinary projectiles entering it miss",
        duration: { value: "1", units: "hour", concentration: true },
        consume: true,
        consumeValue: "5",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Sandstorm Save",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Sandstorm Save", {
        condition: "Moves into the sandstorm for the first time on its turn or starts its turn there",
        save: { ability: ["con"], dc: "17" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 4, denomination: 10, types: ["bludgeoning"] }),
        ],
        onSave: "half",
      }),
      regionPlacer("Sand Summon", {
        template: { type: "circle", size: "30" },
        range: "60",
        activationCondition: "Creatures spend 3 feet of movement for every 1 foot moved through the area",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeValue: "3",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["sand"] }),
        ],
      }),
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
