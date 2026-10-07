import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Beseech the Norns: one activity per Norn (Uror returns a creature to life at 1 HP, Verthandi
 * makes the next attack roll or ability check a natural 20, Skuld grants Advantage on checks and
 * saves for a minute) plus a free d100 roll for the cumulative 25 percent failure chance on
 * repeat castings.
 */
export default class BeseechTheNorns extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Change the Past (Uror)",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateHealing: true,
          generateTarget: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "1",
            types: ["healing"],
          }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "A creature you can see that died since the start of your last turn",
            },
          },
        },
      },
      {
        init: {
          name: "Guide the Present (Verthandi)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
        },
      },
      {
        init: {
          name: "Shape the Future (Skuld)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
        },
      },
      {
        init: {
          name: "Failure Chance",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            condition: "Casting the spell again before finishing a Long Rest",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            roll: {
              prompt: false,
              visible: true,
              formula: "1d100",
              name: "Failure Chance = Previous Casts * 25",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const verthandi = "Guide the Present (Verthandi)";
    const verthandiDescription = "Treat the first attack roll or ability check you roll before the end of your turn as a natural 20.";
    return [
      {
        name: "Verthandi",
        activityMatch: verthandi,
        ac5eOnly: true,
        options: {
          expiry: "turnEnd",
          durationSeconds: null,
          description: verthandiDescription,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("modifier=min20; once", 20, "flags.automated-conditions-5e.attack.modifier"),
          DDBEnricherData.ChangeHelper.ac5eChange("modifier=min20; once", 20, "flags.automated-conditions-5e.check.modifier"),
        ],
      },
      {
        name: "Verthandi",
        activityMatch: verthandi,
        ac5eNever: true,
        options: {
          expiry: "turnEnd",
          durationSeconds: null,
          description: `${verthandiDescription} Delete this effect after that roll.`,
        },
        changes: ["attack", "check"].map((category) =>
          DDBEnricherData.ChangeHelper.ruleChange({
            category: category as TRuleChangeCategory,
            type: "dnd5e.minimum",
            value: "20",
          }),
        ),
      },
      {
        name: "Skuld",
        activityMatch: "Shape the Future (Skuld)",
        options: {
          durationSeconds: 60,
          description: "Beginning at the start of your next turn and lasting for 1 minute, you have Advantage on all ability checks and saving throws.",
        },
        changes: [
          ...["str", "dex", "con", "int", "wis", "cha"].flatMap((ability) => [
            DDBEnricherData.ChangeHelper.abilityCheckRollModeChange(ability, DDBEnricherData.ChangeHelper.ADVANTAGE),
            DDBEnricherData.ChangeHelper.abilitySaveRollModeChange(ability, DDBEnricherData.ChangeHelper.ADVANTAGE),
          ]),
          DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
        ],
      },
    ];
  }

}
