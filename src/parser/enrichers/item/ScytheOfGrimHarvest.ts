import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemProperty } from "./_ItemActivities";

/**
 * The Magus Class scythe. Sweeping Shear is a DC 13 Dexterity save for chosen creatures within 10
 * feet (3d6 + level Slashing, half on a success); DDB's restricted damage modifier otherwise turns
 * into a stray extra attack, so the automatic extras are off. Harvest Soul's temporary Hit Points
 * equal the fallen creature's CR or level, picked as the scaling. Bloody Hungry is an AC5e
 * Advantage against Bloodied targets.
 */
export default class ScytheOfGrimHarvest extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Sweeping Shear", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "13" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, bonus: "@details.level", types: ["slashing"], scalingMode: "none" }),
        ],
        onSave: "half",
        activationType: "action",
        condition: "Creatures of your choice within 10 feet",
        template: { type: "radius", size: "10" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
      itemActivity("Harvest Soul", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
        activationType: "reaction",
        activationCondition: "A creature within 30 feet is reduced to 0 Hit Points; pick its CR or level as the scaling, then make one weapon attack",
        data: {
          healing: DDBEnricherData.basicDamagePart({ customFormula: "@scaling", types: ["temphp"], scalingMode: "none" }),
          consumption: { targets: [], scaling: { allowed: true, max: "30" } },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bloody Hungry",
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "Advantage on attack rolls against Bloodied creatures.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("opponentActor.statuses.bloodied", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
