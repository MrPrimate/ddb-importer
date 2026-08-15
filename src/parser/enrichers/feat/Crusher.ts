import DDBEnricherData from "../data/DDBEnricherData";

export default class Crusher extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
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
          activationCondition: "Crit a creature with an attack that deals bludgeoning damage",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crushed: Enhanced Critical",
        options: {
          durationSeconds: 6,
          description: "Attack rolls against the creature have advantage until the start of the origin's next turn",
        },
        activitiesMatch: ["Enhanced Critical"],
        daeSpecialDurations: ["turnStartSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
        ],
      },
      {
        midiOnly: true,
        options: {
          transfer: true,
          durationSeconds: undefined,
          durationRounds: undefined,
        },
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "crusher.js", document: this.data },
        ],
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: undefined,
          },
        },
        daeSpecialDurations: [],
      },
    ];

  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "crusher.js",
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
