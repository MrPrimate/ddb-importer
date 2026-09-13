import DDBEnricherData from "../../data/DDBEnricherData";

export default class IronPunisher extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stance: Iron Punisher",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "While in this stance, your melee weapon attacks have advantage, but all attacks against you also have advantage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack", {
            conditions: DDBEnricherData.ChangeHelper.MELEE_WEAPON_ATTACK_FILTER,
          }),
        ],
        // the incoming-attack half modifies other creatures' rolls, which only midi can do
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
