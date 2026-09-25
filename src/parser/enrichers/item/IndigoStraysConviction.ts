import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

/**
 * Three charge-fed properties; DDB carries no charges for the gloves. The parser's single damage
 * roll belongs to the retribution aura, so the primary becomes the first reaction and the aura is
 * built here: a 15-foot emanation for 1 minute, with the necrotic damage rolled by hand for an
 * enemy that enters it or starts its turn there. Two 8s on that roll grapple the creature.
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
      {
        init: { name: "By His Will!", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "The aura is magical darkness",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "radius", size: "15" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "3",
          noeffect: true,
        },
      },
      {
        init: { name: "Aura of Retribution Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["necrotic"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A hostile creature enters the darkness for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
      {
        init: { name: "Escape Check", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          generateCheck: true,
          checkOverride: { ability: "", associated: ["acr", "ath"], dc: { calculation: "", formula: "17" } },
        },
        overrides: { noConsumeTargets: true, noTemplate: true, noeffect: true },
      },
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
