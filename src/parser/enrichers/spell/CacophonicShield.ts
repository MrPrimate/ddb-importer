import DDBEnricherData from "../data/DDBEnricherData";

export default class CacophonicShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    // targets stay self so the Cast card applies the caster's Shielded buff; the
    // region applies the aura marker to everyone inside (RAW lets the caster
    // designate unaffected creatures, so no disposition filter)
    return {
      name: "Cast",
      targetType: "self",
      data: {
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Cacophonic Shield Aura",
            auraeffectsNever: true,
          }),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityName: "Save vs Damage and Deafness",
            // the emanation originates from the caster, who gains the thunder
            // resistance instead of saving against their own shield
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Damage and Deafness",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateDamage: true,
          noSpellslot: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "Enters the field or ends its turn there",
          noTemplate: true,
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }


  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Save vs Damage and Deafness",
        name: "Deafness",
        options: {
          expiry: "sourceStart",
        },
        statuses: ["Deafness"],
      },
      {
        name: "Shielded",
        activityMatch: "Cast",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.rwak"),
        ],
      },
      {
        name: "Cacophonic Shield Aura",
        standalone: true,
        auraeffectsNever: true,
        options: {
          durationSeconds: 600,
          description: "Within the Cacophonic Shield's thunderous field: Constitution save on entering or ending a turn there (3d6 Thunder, Deafened on a failure), once per turn.",
        },
      },
      {
        name: "Cacophonic Shield Aura",
        activityMatch: "Cast",
        auraeffectsOnly: true,
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "10",
          disposition: -1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
