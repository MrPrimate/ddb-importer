import DDBEnricherData from "../../data/DDBEnricherData";

export default class TokensOfTheDeparted extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Soul Trinket",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "-1",
          targetType: "self",
        },
      },
      {
        action: {
          name: "Tokens of the Departed: Sneak Attack",
          type: "class",
          rename: ["Wails From the Grave"],
        },
      },
      {
        action: {
          name: "Wails From the Grave",
          type: "class",
          rename: ["Wails From the Grave"],
        },
      },
      {
        action: {
          name: "Wails from the Grave",
          type: "class",
          rename: ["Wails From the Grave"],
        },
      },
      {
        action: {
          name: "Tokens of the Departed: Question Spirit",
          type: "class",
          rename: ["Question Spirit"],
        },
        overrides: {
          addItemConsume: true,
          targetType: "creature",
          rangeSelf: true,
        },
      },
      {
        action: {
          name: "Spirit Query",
          type: "class",
          rename: ["Spirit Query"],
        },
        overrides: {
          addItemConsume: true,
          targetType: "creature",
          rangeSelf: true,
        },
      },
    ];
  }

  get _2024SoulTrinketMax() {
    const level = this.ddbParser._class.level;
    if (level >= 17) return 4;
    if (level >= 13) return 3;
    return 2;
  }

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: this.is2014 ? "Tokens of the Departed: Create Soul Trinket" : "Soul Trinkets",
      max: this.is2014 ? "@prof" : "@scale.phantom.tokens-of-the-departed",
    });

    const maxInt = this.is2014 ? this.ddbParser.ddbCharacter?.profBonus ?? 2 : this._2024SoulTrinketMax;

    // uses are inverted here
    uses.spent = this.is2014
      ? Math.max(maxInt - uses.spent, 0)
      : Math.max(maxInt - uses.spent, 0);

    if (this.is2014) {
      uses.recovery = [{ period: "lr", type: "formula", formula: "max(0, min(2,  2 -@item.uses.value))" }];
    }

    return {
      retainResourceConsumption: true,
      retainUseSpent: true,
      uses,
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbTokensOfTheDeparted">
<p><strong>Implementation Details</strong></p>
<p>Track your tokens with the uses on this feature. DDB Importer initially draws them from the "Tokens of the Departed: Create Soul Trinket" action on DDB. It will retain your current uses on the character reimport.</p>
</section>`,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        name: "Tokens of the Departed (Automation)",
        options: {
          description: "You have advantage on death saving throws and Constitution saving throws.",
          transfer: true,
        },
        activityMatch: "None",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("(token.actor.items.getName('Tokens of the Departed')?.system.uses.value ?? 0) > 0", 20, "flags.midi-qol.advantage.ability.save.con"),
          DDBEnricherData.ChangeHelper.customChange("(token.actor.items.getName('Tokens of the Departed')?.system.uses.value ?? 0) > 0", 20, "flags.midi-qol.advantage.deathSave"),
        ],
        // DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.attributes.death.roll.mode"),
      },
    ];
  }

}
