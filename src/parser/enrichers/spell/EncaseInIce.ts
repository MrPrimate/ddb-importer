import DDBEnricherData from "../data/DDBEnricherData";
import { area, ongoingTrigger } from "./_SpellRegions";

/**
 * The wave rolls its save as it freezes, restraining those it catches. The ice then stays as
 * difficult terrain and fires a second, different save, against falling Prone, at a creature that
 * enters it or ends its turn there. The rules spare creatures caught at the cast from the
 * terrain, and creatures already Restrained from the second save; both are left to the table.
 * DDB gives the spell no template.
 */
export default class EncaseInIce extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: area("square", "20"),
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Slip Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Slip Save",
        condition: "A creature not Restrained by the ice enters it or ends its turn there",
        noDamage: true,
      }),
      {
        init: { name: "Break Free", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          checkOverride: { ability: "", associated: ["ath"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: { noeffect: true, noTemplate: true, activationType: "action" },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: "Cast",
        statuses: ["Restrained"],
        options: { transfer: false, description: "Legs trapped in the ice until the spell ends or a Strength (Athletics) check against the spell save DC frees it." },
      },
      {
        name: "Prone",
        activityMatch: "Slip Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
