import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../../data/RegionBuilders";

const JEALOUSY = "Jealousy: Spectral Assailants";
const TERROR = "Terror: Terrify";

function aura(name: string, activityName: string): IDDBAdditionalActivity {
  return regionPlacer(name, {
    template: { type: "radius", size: "30" },
    affects: "enemy",
    activationType: "special",
    activationCondition: "While raging, with this emotion chosen for Final Night Catharsis",
    behaviors: [
      DDBEnricherData.BehaviorHelper.activity({
        events: ["tokenTurnStart"],
        activityName,
        excludeSelf: true,
      }),
    ],
  });
}

/**
 * DDB ships no action, so the feature imported with nothing usable. Jealousy and Terror both
 * answer a creature starting its turn within 30 feet of the raging barbarian, so each is a
 * 30-foot emanation offering its Reaction then; which one applies follows the emotion chosen for
 * Final Night Catharsis, which this feature's text does not record, so both are built. "A
 * creature you can see" is offered against enemies. Hate's wider critical range is not a region.
 */
export default class PoweredByPathos extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const reaction = (trigger: IDDBAdditionalActivity): IDDBAdditionalActivity => ({
      ...trigger,
      build: { ...trigger.build, activationOverride: { type: "reaction", value: 1, condition: trigger.build?.activationOverride?.condition ?? "" } },
    });
    return [
      aura("Jealousy: Place Aura", JEALOUSY),
      reaction(regionTrigger(JEALOUSY, {
        affects: "enemy",
        condition: "A creature you can see starts its turn within 30 feet while you rage; it chooses Strength or Dexterity, and on a success each foot of movement costs 1 extra until the end of its turn",
        save: { ability: ["str", "dex"], calculation: "con" },
      })),
      aura("Terror: Place Aura", TERROR),
      reaction(regionTrigger(TERROR, {
        affects: "enemy",
        condition: "A creature you can see starts its turn within 30 feet while you rage",
      })),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: JEALOUSY,
        statuses: ["Restrained"],
        options: { transfer: false, expiry: "turnEnd", description: "Restrained by spectral assailants until the end of its turn." },
      },
      {
        name: "Terrified",
        activityMatch: TERROR,
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50)],
        options: { transfer: false, expiry: "targetStart", description: "Speed halved, and Opportunity Attacks against it have Advantage, until the start of its next turn." },
      },
    ];
  }

}
