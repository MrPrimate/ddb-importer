import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * The parser's single save is the once-a-day ray action, reshaped here into the damage ray with
 * the healing ray beside it. The Aura of Cold is a 20-foot emanation toggled with a Magic action;
 * its region rolls the cold damage for a creature that enters it or ends its turn there, never
 * for the attuned holder. The rules also deal the damage when the emanation moves onto a creature,
 * which a region cannot see, so that case is a manual roll of the same activity.
 */
export default class CalimemnonCrystal extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Damage Ray",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Six rays in one Magic action; choose damage or healing for each",
      addItemConsume: true,
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, bonus: "6", types: ["radiant"] }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "18" } },
        damage: { onSave: "half" },
        range: { override: true, value: "60", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Healing Ray", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          healingPart: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "2", types: ["healing"] }),
          activationOverride: { type: "special", value: null, condition: "One of the six rays" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "60", units: "ft" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
      regionPlacer("Aura of Cold", {
        template: { type: "radius", size: "20" },
        activationCondition: "Enable the aura",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Aura of Cold Damage",
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Aura of Cold Damage", {
        condition: "Enters the aura or ends its turn there, or the aura moves onto it (once per turn)",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["cold"] }),
        ],
      }),
    ];
  }

}
