import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A passive 10-foot emanation: the cleric and allies inside add 2 to Intelligence, Wisdom and
 * Charisma saves. DDB ships that bonus as modifiers on the cleric alone, so the parsed effect is
 * moved out to the effects compendium for the region to hand to whoever is inside, or kept on
 * the cleric as an Aura Effects aura when that module drives it. It switches off while the
 * cleric is Incapacitated, which nothing here can test.
 */
export default class GestaltAnchor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "ally",
      activationType: "special",
      activationCondition: "Inactive while you are Incapacitated",
      data: {
        target: {
          override: true,
          affects: { type: "ally" },
          template: { contiguous: false, type: "radius", size: "10", units: "ft" },
        },
        range: { override: true, value: null, units: "self", special: "" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: this.data.name,
            auraeffectsNever: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        standalone: true,
        auraeffectsNever: true,
        name: this.data.name,
      },
      {
        options: { transfer: true },
        noCreate: true,
        auraeffectsOnly: true,
        daeStackable: "noneNameOnly",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "10",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
