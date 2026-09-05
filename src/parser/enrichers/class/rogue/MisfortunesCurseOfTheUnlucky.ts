import Misfortune from "./Misfortune";

export default class MisfortunesCurseOfTheUnlucky extends Misfortune {

  override get jinxCost(): number {
    return 3;
  }

  override get activity(): IDDBActivityData {
    return {
      ...super.activity,
      activationType: "bonus",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Unlucky",
        options: {
          description: "Subtract 1d4 from this creature's attack rolls and saving throws while it remains cursed by the rogue's Evil Eye.",
        },
        changes: [
          Misfortune.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.mwak.bonus"),
          Misfortune.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.rwak.bonus"),
          Misfortune.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.msak.bonus"),
          Misfortune.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.attack.rsak.bonus"),
          Misfortune.ChangeHelper.unsignedAddChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

}
