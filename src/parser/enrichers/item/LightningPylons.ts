import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../data/RegionBuilders";

/**
 * The wall between two electrified pylons rolls its save as it appears, so electrifying is the
 * save, placed as a wall up to 20 feet long, and the wall's region fires that same save again for
 * a creature that enters it. The rules also call for the save from a creature that ends its turn
 * within 5 feet of the wall; a band around a wall has no region shape, so that one is rolled by
 * hand.
 */
export default class LightningPylons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Electrify", {
      template: { type: "wall", size: "20", width: "1", height: "10" },
      range: "5",
      activationType: "bonus",
      activationCondition: "A charged pylon within 5 feet; creatures made of metal or wearing metal armor save with Disadvantage",
      duration: { value: "1", units: "minute" },
      save: { ability: ["dex"], dc: "15" },
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 8, types: ["lightning"] }),
      ],
      onSave: "half",
      linkEffects: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter"],
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Touch an Electrified Pylon", {
        condition: "Touches an electrified pylon or hits it with a metal melee weapon: roll once per connected pylon",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["lightning"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lightning Pylons: Speed 0",
        activityMatch: "Electrify",
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50)],
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Speed 0 until the start of its next turn. A creature that saves has its Speed halved instead.",
        },
      },
    ];
  }

}
