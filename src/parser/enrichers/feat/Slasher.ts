import DDBEnricherData from "../data/DDBEnricherData";

export default class Slasher extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  get additionalActivities() {
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

  get effects() {
    return [
      {
        name: "Slashed: Hamstrung",
        options: {
          description: "Speed penalty until the start of the origins next turn",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.speed.walk"),
        ],
        activitiesMatch: ["Hamstring"],
      },
      {
        name: "Slashed: Enhanced Critical",
        options: {
          durationSeconds: 6,
          description: "Disadvantage on attack rolls until the start of the origins next turn",
        },
        activitiesMatch: ["Enhanced Critical"],
        daeSpecialDurations: ["turnStartSource" as const],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
      {
        name: "Slasher (Automation)",
        midiOnly: true,
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "slasher.js", document: this.data },
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
        daeSpecialDurations: [],
      },
    ];
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "slasher.js",
    };
  }

}
