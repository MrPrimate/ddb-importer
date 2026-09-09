import Generic from "../Generic";

export default class BolsteringMagic extends Generic {

  override get type(): IDDBActivityType | null {
    return this.isAction ? Generic.ACTIVITY_TYPES.NONE : Generic.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bolstering Magic",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.isAction
      ? []
      : [
        {
          init: {
            name: "Spell Level Roll",
            type: Generic.ACTIVITY_TYPES.UTILITY,
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
                count: "1",
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

  override get effects(): IDDBEffectHint[] {
    return this.isAction
      ? [
        {
          name: "Bolstering Magic",
          activityMatch: "Bolstering Magic",
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

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

}
