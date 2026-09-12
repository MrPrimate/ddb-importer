import DDBEnricherData from "../data/DDBEnricherData";

export default class Slasher extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Hamstring",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Hit a creature with an attack that deals slashing damage",
        },
      },
      {
        init: {
          name: "Enhanced Critical",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Crit a creature with an attack that deals slashing damage",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slashed: Hamstrung",
        options: {
          description: "Speed penalty until the start of the origins next turn",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20),
        ],
        activitiesMatch: ["Hamstring"],
      },
      {
        name: "Slashed: Enhanced Critical",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls until the start of the origins next turn",
        },
        activitiesMatch: ["Enhanced Critical"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
      {
        name: "Slasher (Automation)",
        midiOnly: true,
        options: {
          transfer: true,
          durationSeconds: undefined,
          expiry: null,
        },
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "slasher.js", document: this.data },
        ],
        data: {
          duration: {
            value: null,
            expired: undefined,
          },
        },
      },
    ];
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "slasher.js",
    };
  }

}
