import DDBEnricherData from "../data/DDBEnricherData";

export default class Caltrops extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spread Caltrops",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "square",
            size: "5",
            units: "ft",
          },
        },
        range: {
          override: true,
          value: "5",
          units: "ft",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "15",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "1",
              types: ["piercing"],
            }),
          ],
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter"],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Caltrop: Speed Reduced",
        changes: this.is2014
          ? [DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20)]
          : [DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50)],
        data: {
          duration: this.is2014 ? {} : { expiry: "turnStart" },
        },
        options: {
          description: this.is2014
            ? "Walking speed reduced by 10 feet until the creature regains at least 1 hit point."
            : "Speed 0 until the start of its next turn.",
        },
      },
    ];
  }

}
