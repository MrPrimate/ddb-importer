import DDBEnricherData from "../../data/DDBEnricherData";

export default class AssertiveAttacker extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Assertive Attacker (Bloodied)",
        options: {
          transfer: true,
          disabled: true,
          description: "While you are Bloodied, you add your Wisdom modifier to the damage you deal with Unarmed Strikes and Monk weapons.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.wis.mod", 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
