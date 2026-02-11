/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class BolsteringMagic extends Generic {

  get type() {
    return this.isAction ? "none" : "utility";
  }

  get activity() {
    return {
      name: "Bolstering Magic",
    };
  }

  get additionalActivities() {
    return this.isAction
      ? []
      : [
        {
          constructor: {
            name: "Spell Level Roll",
            type: "utility",
          },
          build: {
            generateTarget: true,
            generateActivation: true,
            durationOverride: {
              value: "",
              units: "inst",
            },
            activationOverride: {
              type: "special",
            },
            targetOverride: {
              affects: {
                value: "1",
                type: "ally",
              },
            },
          },
          overrides: {
            data: {
              roll: {
                name: "Roll for Spell Slot Level",
                formula: "1d3",
              },
            },
          },
        },
      ];
  }

  get effects() {
    return this.isAction
      ? [
        {
          name: "Bolstering Magic",
          activityNameMatch: "Bolstering Magic",
          changes: [
            Generic.ChangeHelper.addChange("1d3", 20, "system.bonuses.abilities.check"),
            Generic.ChangeHelper.addChange("1d3", 20, "system.bonuses.msak.attack"),
            Generic.ChangeHelper.addChange("1d3", 20, "system.bonuses.mwak.attack"),
            Generic.ChangeHelper.addChange("1d3", 20, "system.bonuses.rsak.attack"),
            Generic.ChangeHelper.addChange("1d3", 20, "system.bonuses.rwak.attack"),
          ],
          options: {
            durationSeconds: 600,
          },
        },
      ]
      : [];
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

}
