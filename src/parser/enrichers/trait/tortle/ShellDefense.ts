import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShellDefense extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    // the same-named DDB action also loads this enricher and its effect is
    // cloned onto the trait with the activity - skip the trait-side copy
    if (!this.isAction) return [];
    return [
      {
        // transfer + disabled: always visible/toggleable on the sheet;
        // ignoreTransfer keeps it linked on the Shell Defense activity too
        name: "In Shell",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "In your shell: +4 AC, Advantage on STR and CON saves, Disadvantage on DEX saves, Prone, Speed 0, no reactions; a Bonus Action to emerge ends this.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("4", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.con.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.dex.save.roll.mode"),
        ],
        statuses: ["Prone"],
      },
    ];
  }

}
