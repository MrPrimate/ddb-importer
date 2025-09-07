/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TokensOfTheDeparted extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        action: {
          name: "Tokens of the Departed: Create Soul Trinket",
          type: "class",
          rename: ["Create Soul Trinket"],
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
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Tokens of the Departed: Create Soul Trinket",
      max: "@prof",
    });

    // uses are inverted here
    uses.spent = Math.max((this.ddbParser.ddbCharacter?.profBonus ?? 2) - uses.spent, 0);

    return {
      data: {
        "system.uses": uses,
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbTokensOfTheDeparted">
<p><strong>Implementation Details</strong></p>
<p>Track your tokens with the uses on this feature. DDB Importer initially draws them from the "Tokens of the Departed: Create Soul Trinket" action on DDB. It will retain your current uses on the character reimport.</p>
</section>`,
    };
  }

  get effects() {
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
