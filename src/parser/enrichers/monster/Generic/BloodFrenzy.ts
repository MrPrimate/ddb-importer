import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodFrenzy extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // most stat blocks scope this to melee attack rolls; the 2024 sahuagin does not
    const description = (this.document?.system?.description?.value ?? "").toLowerCase();
    const hpCondition = "opponentActor.attributes.hp.value < opponentActor.attributes.hp.max";
    const value = description.includes("melee")
      ? `(actionType.mwak || actionType.msak) && ${hpCondition}`
      : hpCondition;
    return [
      {
        options: {
          transfer: true,
          description: "Advantage on attack rolls against creatures that don't have all their hit points.",
        },
        name: "Blood Frenzy",
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            value,
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
