import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";
import { escapeCheck, regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * Three charge-fed properties; DDB carries no charges for the gloves. The parser's single damage
 * roll belongs to the retribution aura, so the primary becomes the first reaction and the aura is
 * built here: a 15-foot emanation for 1 minute whose region rolls the necrotic damage for an enemy
 * that enters it or starts its turn there. Two 8s on that roll grapple the creature.
 */
export default class IndigoStraysConviction extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Allow Me!",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "An attacker you can see within 15 feet damages a friendly creature: move up to 15 feet and make one weapon attack against it",
      addItemConsume: true,
      removeDamageParts: true,
      noTemplate: true,
      data: {
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("By His Will!", {
        template: { type: "radius", size: "15" },
        affects: "enemy",
        activationType: "bonus",
        activationCondition: "The aura is magical darkness",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeValue: "3",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityName: "Aura of Retribution Damage",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Aura of Retribution Damage", {
        affects: "enemy",
        condition: "A hostile creature enters the darkness for the first time on a turn or starts its turn there",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["necrotic"] }),
        ],
      }),
      escapeCheck("17"),
      itemActivity("The Price of Freedom!", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "reaction",
        activationCondition: "A creature you can see within 30 feet takes damage, or gains the Blinded, Deafened, Paralyzed, Petrified or Poisoned condition: you suffer it instead",
        noConsumeTargets: false,
        addItemConsume: true,
        itemConsumeValue: "2",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled by Smoky Tendrils",
        activityMatch: "Aura of Retribution Damage",
        statuses: ["Grappled"],
        options: {
          transfer: false,
          description: "Only when both damage dice show an 8. Grappled while within the aura; a DC 17 Strength (Athletics) or Dexterity (Acrobatics) check as an action escapes.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "dawn", type: "recoverAll" }]);
  }

}
