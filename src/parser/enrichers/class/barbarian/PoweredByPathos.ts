import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer, areaTrigger } from "../../data/AreaBuilders";

const JEALOUSY = "Jealousy: Spectral Assailants";
const TERROR = "Terror: Terrify";

function aura(name: string): IDDBAdditionalActivity {
  return areaPlacer(name, {
    template: { type: "radius", size: "30" },
    affects: "enemy",
    activationType: "special",
    activationCondition: "While raging, with this emotion chosen for Final Night Catharsis",
  });
}

/**
 * DDB ships no action, so the feature imported with nothing usable. Jealousy and Terror both
 * answer a creature starting its turn within 30 feet of the raging barbarian, so each is a
 * 30-foot emanation with its Reaction beside it; which one applies follows the emotion chosen for
 * Final Night Catharsis, which this feature's text does not record, so both are built. "A
 * creature you can see" is offered against enemies. Hate's wider critical range is not an area.
 */
export default class PoweredByPathos extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const reaction = (trigger: IDDBAdditionalActivity): IDDBAdditionalActivity => ({
      ...trigger,
      build: { ...trigger.build, activationOverride: { type: "reaction", value: 1, condition: trigger.build?.activationOverride?.condition ?? "" } },
    });
    return [
      aura("Jealousy: Place Aura"),
      reaction(areaTrigger(JEALOUSY, {
        affects: "enemy",
        condition: "A creature you can see starts its turn within 30 feet while you rage; it chooses Strength or Dexterity, and on a success each foot of movement costs 1 extra until the end of its turn",
        save: { ability: ["str", "dex"], calculation: "con" },
      })),
      aura("Terror: Place Aura"),
      reaction(areaTrigger(TERROR, {
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
        changes: [DDBEnricherData.ChangeHelper.customChange("/2", 50, "system.attributes.movement.all")],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationSeconds: 6,
          durationRounds: 1,
          description: "Speed halved, and Opportunity Attacks against it have Advantage, until the start of its next turn.",
        },
      },
    ];
  }

}
