import DDBEnricherData from "../../data/DDBEnricherData";

export default class AggressiveDefense extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aggressive Defense (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn: on a melee hit, lose up to half your Fighter level in Temporary Hit Points to deal that much extra damage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=(bonusScale); usesCount=hptemp,{min:1,max:floor(rollingActor.classes.fighter.levels / 2),step:1}; oncePerTurn; optin; actionType.mwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
