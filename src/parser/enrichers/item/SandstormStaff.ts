import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

/**
 * Spending a charge on a spell leaves a dust vortex in the caster's space. It threatens every
 * creature within 5 feet of it, so it is placed as a stationary 5-foot emanation, and its region
 * fires the save against a creature that starts its turn inside. Each vortex drifts or vanishes
 * on a d20 at the start of the caster's turns, which means moving or deleting its region by hand.
 */
export default class SandstormStaff extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Dust Vortex", {
        template: { type: "radius", size: "5", stationary: true },
        activationType: "special",
        activationCondition: "Casting a spell with the staff as the focus: +1 to that spell's attack rolls",
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Dust Vortex Save",
          }),
          DDBEnricherData.BehaviorHelper.activity({
            ownerTurn: true,
            ownerTurnTargets: "none",
            events: ["tokenTurnStart"],
            activityName: "Dust Vortex Drift",
          }),
        ],
      }),
      regionTrigger("Dust Vortex Save", {
        condition: "Starts its turn within 5 feet of a dust vortex",
        save: { ability: ["con"], calculation: "spellcasting" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] }),
        ],
      }),
      regionTrigger("Dust Vortex Drift", {
        condition: "Start of each of your turns, once per vortex: 11 or higher moves it 5 feet in a random direction, 10 or lower ends it",
        roll: { prompt: false, visible: false, name: "Dust Vortex Drift", formula: "1d20" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded by Dust",
        activityMatch: "Dust Vortex Save",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Blinded until the end of its turn.",
        },
      },
    ];
  }

}
