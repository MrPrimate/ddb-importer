import DDBEnricherData from "../data/DDBEnricherData";

export default class Frostbite extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: `Frostbitten`,
        options: {
          expiry: "targetEnd",
          description: "The target has disadvantage on the next weapon attack roll it makes before the end of its next turn. Without DAE or AC5e the effect lasts for every weapon attack until then.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack", {
            conditions: DDBEnricherData.ChangeHelper.WEAPON_ATTACK_FILTER,
          }),
        ],
        // DAE and AC5e each end the effect after the one weapon attack; the native expiry is the ceiling
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; actionType.mwak || actionType.rwak", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        daeSpecialDurations: ["1Attack:rwak", "1Attack:mwak"],
      },
    ];
  }

}
