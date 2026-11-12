import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * DDB sends the Arcana and Nature bonus as a plain Wisdom modifier; the rule gives a minimum of +1,
 * so the generated effect is replaced. A character import receives the extra cantrip as a granted
 * spell, but munched copies build characters in Foundry, so they raise the cantrips known instead.
 */
export default class PrimalOrderMagician extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Primal Order: Magician",
        options: {
          transfer: true,
        },
        changes: [
          ...["arc", "nat"].map((skill) =>
            DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @abilities.wis.mod)", 20, `system.skills.${skill}.roll.bonus`),
          ),
          ...(this.ddbParser.isMuncher
            ? [DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.scale.${this.classIdentifier("Druid")}.cantrips-known.value`)]
            : []),
        ],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
