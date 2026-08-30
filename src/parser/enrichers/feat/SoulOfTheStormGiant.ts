import DDBEnricherData from "../data/DDBEnricherData";

export default class SoulOfTheStormGiant extends DDBEnricherData {

  static ABILITIES = [
    { label: "Strength", ability: "str" },
    { label: "Wisdom", ability: "wis" },
    { label: "Charisma", ability: "cha" },
  ];

  /**
   * The aura save DC keys off the ability the feat increased. A character import
   * carries the choice; the mule/muncher import does not, so it gets one save
   * activity per ability and the user deletes the ones that do not apply.
   */
  get chosenAbility(): string | null {
    const chosenLabel = this.ddbParser._chosen?.find((c) =>
      SoulOfTheStormGiant.ABILITIES.some((a) => a.label === (c.label ?? "")),
    )?.label;
    return SoulOfTheStormGiant.ABILITIES.find((a) => a.label === chosenLabel)?.ability ?? null;
  }

  get saveActivities(): { name: string; ability: string }[] {
    const chosen = this.chosenAbility;
    if (chosen) return [{ name: "Aura Save", ability: chosen }];
    return SoulOfTheStormGiant.ABILITIES.map((a) => ({ name: `Aura Save (${a.label} DC)`, ability: a.ability }));
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Maelstrom Aura",
      activationType: "bonus",
      targetType: "self",
      data: {
        target: {
          override: true,
          affects: {
            type: "self",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
        consumption: {
          targets: [
            {
              type: "itemUses",
              value: "1",
              target: "",
              scaling: {
                mode: "",
              },
            },
          ],
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            // prefix-resolves against the per-ability variants on muncher imports
            activityName: "Aura Save",
            // "whenever ANOTHER creature starts its turn within the aura"
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.saveActivities.map(({ name, ability }) => ({
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      },
      build: {
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        generateSave: true,
        saveOverride: {
          ability: ["str"],
          dc: {
            formula: "",
            calculation: ability,
          },
        },
        activationOverride: {
          type: "special",
          condition: "Starts its turn in the aura",
        },
        targetOverride: {
          override: true,
          affects: {
            count: "1",
            type: "creature",
          },
          template: {},
        },
      },
      overrides: {
        data: {
          range: {
            override: true,
            units: "spec",
          },
        },
      },
    }));
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maelstrom Aura",
        activityMatch: "Maelstrom Aura",
        options: { expiry: "sourceStart" },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("lightning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("thunder", 20, "system.traits.dr.value"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
      },
      {
        name: "Maelstrom Aura: Halved Speed",
        activitiesMatch: this.saveActivities.map((a) => a.name),
        options: { expiry: "targetStart" },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: null,
            max: "@prof",
            recovery: [
              { period: "lr", type: "recoverAll", formula: undefined },
            ],
          },
        },
      },
    };
  }

}
