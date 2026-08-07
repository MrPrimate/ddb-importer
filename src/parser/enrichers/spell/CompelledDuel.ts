import DDBEnricherData from "../data/DDBEnricherData";

export default class CompelledDuel extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        // tracking effect; the AC5e change enforces disadvantage on the
        // target's attacks against anyone other than the caster
        name: "Compelled to Duel",
        options: {
          durationSeconds: 60,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange(
            "(opponentActor.actorId !== effectOriginActor.actorId ? 1 : 0)",
            20,
            "flags.automated-conditions-5e.attack.disadvantage",
          ),
        ],
      },
    ];
  }

}
