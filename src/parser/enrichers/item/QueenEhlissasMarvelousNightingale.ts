import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The nightingale's 6 charges (1d6 + 1 back at dawn) pay for its spells by level; Speak with
 * Animals, Detect Evil and Good and the Zone of Truth aura are free, and Counterspell is once per
 * dawn. DDB ships each spell's cost as its own limited use, so the casts are reshaped here, as the
 * official data has them.
 */
export default class QueenEhlissasMarvelousNightingale extends DDBEnricherData {

  static CHARGE_COSTS: Record<string, number> = {
    "Prismatic Spray": 6,
    "Delayed Blast Fireball": 6,
    "Greater Restoration": 4,
    "Compulsion": 3,
    "Slow": 2,
    "Calm Emotions": 1,
  };

  static FREE = ["Speak with Animals", "Detect Evil and Good", "Zone of Truth"];

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Begin Singing",
      activationType: "action",
      targetType: "self",
      noConsumeTargets: true,
      data: {
        duration: { override: true, value: "10", units: "minute" },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "6",
        recovery: [{ period: "dawn", type: "formula", formula: "1d6 + 1" }],
      },
    };
  }

  override async customFunction({ name, activity }: ICustomFunctionOptions) {
    if (!activity || !name) return;
    const cast = activity.data as I5eCastActivity;
    const cost = QueenEhlissasMarvelousNightingale.CHARGE_COSTS[name];
    if (cost) {
      cast.uses = { spent: 0, max: "", recovery: [] };
      cast.consumption = {
        ...cast.consumption,
        targets: [{ type: "itemUses", target: "", value: String(cost), scaling: { mode: "", formula: "" } }],
      };
    } else if (QueenEhlissasMarvelousNightingale.FREE.includes(name)) {
      cast.uses = { spent: 0, max: "", recovery: [] };
      cast.consumption = { ...cast.consumption, targets: [] };
    } else if (name === "Counterspell") {
      cast.uses = { spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll", formula: "" }] };
      cast.consumption = {
        ...cast.consumption,
        targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
      };
      cast.activation = { ...cast.activation, type: "reaction", override: true };
    }
  }

}
