import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Ring of Eldritch Ire: its charges and the Bonus Action mark are parsed from DDB. The +1 to
 * attack and damage rolls only applies against marked creatures, which dnd5e cannot condition on
 * the target, so it is a toggle effect to enable while attacking a marked creature.
 */
export default class RingOfEldritchIre extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Attacking a Marked Creature",
        changes: ["mwak", "rwak", "msak", "rsak"].flatMap((type) => [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.bonuses.${type}.attack`),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.bonuses.${type}.damage`),
        ]),
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: null,
          expiry: null,
          description: "+1 to attack and damage rolls against creatures marked by the ring. Enable this effect while attacking a marked creature; marked creatures also take a -1 penalty to saving throws against your spells.",
        },
      },
    ];
  }

}
