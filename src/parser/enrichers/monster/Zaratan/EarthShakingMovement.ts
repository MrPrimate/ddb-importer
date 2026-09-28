import DDBEnricherData from "../../data/DDBEnricherData";
import PlacedZone from "../Generic/PlacedZone";

const BURIED = "Buried: Dex Save";
const ESCAPE = "Escape the Rubble";

/**
 * The shock wave's difficult terrain and concentration save are the generic placed zone. The
 * Dexterity save belongs to a single creature buried by a collapsing structure, which the parser
 * built as a sibling of the zone action with its activation and none of its consequences: 5d6
 * bludgeoning, Prone, and trapped (Restrained) until a DC 20 Strength (Athletics) check frees it.
 */
export default class EarthShakingMovement extends PlacedZone {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ...super.additionalActivities,
      {
        init: { name: BURIED, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "25" } },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 5, denomination: 6, types: ["bludgeoning"] })],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature within half a collapsing structure's height of it",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "120", units: "ft", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
        },
      },
      {
        init: { name: ESCAPE, type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          checkOverride: { ability: "str", associated: ["ath"], dc: { calculation: "", formula: "20" } },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "The trapped creature, or another creature within 5 feet of it",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      ...super.effects,
      {
        name: "Trapped in the Rubble",
        activityMatch: BURIED,
        statuses: ["Prone", "Restrained"],
        options: {
          transfer: false,
          description: "Knocked prone and trapped in the rubble: restrained until a creature succeeds on a DC 20 Strength (Athletics) check as an action to free it.",
        },
      },
    ];
  }

  // the parser's Dexterity save is rebuilt above with its consequences
  override get keepParsedActivities(): boolean {
    return false;
  }

}
