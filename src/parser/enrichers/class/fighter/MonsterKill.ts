import DDBEnricherData from "../../data/DDBEnricherData";

export default class MonsterKill extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const creatureTypes = ["aberration", "dragon", "fey", "fiend", "monstrosity", "ooze", "undead"];
    const typeCondition = creatureTypes
      .map((type) => `opponentActor.creatureType.includes('${type}')`)
      .join(" || ");
    return [
      {
        name: "Monster Kill (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a weapon attack hit against an Aberration, Dragon, Fey, Fiend, Monstrosity, Ooze, or Undead. The damage type matches the weapon.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=1d10; oncePerTurn; optin; (actionType.mwak || actionType.rwak) && (${typeCondition})`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
