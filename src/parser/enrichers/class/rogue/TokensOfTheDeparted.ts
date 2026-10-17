import DDBEnricherData from "../../data/DDBEnricherData";

export default class TokensOfTheDeparted extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
          // "you can take a Reaction to open your soul trinket" as a creature dies near you
          activationType: "reaction",
        },
      },
      // DDB names Wails two ways and name matching ignores case, so one present name builds it; a 2014
      // character carries both, and only the Sneak Attack action has the second target's 30 ft range
      {
        action: { name: this._presentAction(["Tokens of the Departed: Sneak Attack", "Wails from the Grave"]), type: "class", rename: ["Wails From the Grave"] },
      },
      // DDB sends the 2014 action as "Tokens of the Departed: Question Spirit", the 2024 one as "Spirit Query"
      {
        action: {
          name: this._questionSpiritAction,
          type: "class",
          rename: [this._questionSpiritAction === "Spirit Query" ? "Spirit Query" : "Question Spirit"],
        },
        overrides: {
          addItemConsume: true,
          targetType: "creature",
          rangeSelf: true,
        },
      },
    ];
  }

  get _questionSpiritAction(): string {
    return this._presentAction(["Tokens of the Departed: Question Spirit", "Spirit Query"]);
  }

  /** The first of the names DDB sends as a class action, or the first name (which then warns once). */
  _presentAction(names: string[]): string {
    return names.find((name) => this.hasAction({ name, type: "class" })) ?? names[0];
  }

  get _2024SoulTrinketMax(): number {
    const level = this.ddbParser._class?.level ?? 0;
    if (level >= 17) return 4;
    if (level >= 13) return 3;
    return 2;
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: this.is2014 ? "Tokens of the Departed: Create Soul Trinket" : "Soul Trinkets",
      max: this.is2014 ? "@prof" : "@scale.phantom.tokens-of-the-departed",
    });

    const maxInt = this.is2014 ? this.ddbParser.ddbCharacter?.profBonus ?? 2 : this._2024SoulTrinketMax;

    // uses are inverted here
    uses.spent = this.is2014
      ? Math.max(maxInt - (uses.spent ?? 0), 0)
      : Math.max(maxInt - (uses.spent ?? 0), 0);

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

  override get effects(): IDDBEffectHint[] {
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
        // DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
      },
    ];
  }

}
