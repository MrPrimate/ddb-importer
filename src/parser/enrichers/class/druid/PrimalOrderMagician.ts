import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * DDB sends the Arcana and Nature bonus as a plain Wisdom modifier; the rule gives a minimum of +1,
 * so the generated effect is replaced. The extra cantrip is a Druid cantrip choice, as the dnd5e 6.1
 * SRD feature has it; on a character import DDB's pick is linked to it (CharacterFeatureFactory.linkSpells).
 * Munched copies, which build characters in Foundry, also raise the Druid's cantrips known as the SRD
 * effect does; a character import already has DDB's pick, so its count is left alone.
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

  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      DDBEnricherData.AdvancementBuilder.buildSpellChoice({
        name: "Extra Druid Cantrip",
        choices: { 1: { count: 1, replacement: false } },
        level: 0,
        lists: ["class:druid"],
        spell: {
          ability: ["wis"],
          method: "spell",
          prepared: 2,
        },
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
