import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spreading the bag rolls nothing: it places a 5-foot square whose region fires the
 * "Caltrops Save" activity against each creature that enters, and that save carries the
 * speed rider for the creature that fails it.
 */
export default class Caltrops extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
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
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter"],
            activityName: "Caltrops Save",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Caltrops Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            condition: this.is2014
              ? "Enters the area (not needed when moving through at half speed)"
              : "Enters the area for the first time on a turn",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          // the square is placed by "Spread Caltrops", so this rolls against whoever entered it
          rangeOverride: {
            override: true,
            value: null,
            units: "self",
            special: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "1",
              types: ["piercing"],
            }),
          ],
        },
        overrides: {
          data: {
            damage: {
              onSave: "none",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Caltrop: Speed Reduced",
        activityMatch: "Caltrops Save",
        changes: this.is2014
          ? [DDBEnricherData.ChangeHelper.movementBonusChange("-10", 20)]
          : [DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50)],
        data: {
          duration: this.is2014 ? {} : { expiry: "turnStart" },
        },
        options: {
          transfer: false,
          description: this.is2014
            ? "Walking speed reduced by 10 feet until the creature regains at least 1 hit point."
            : "Speed 0 until the start of its next turn.",
        },
      },
    ];
  }

}
