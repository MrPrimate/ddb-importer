import DDBEnricherData from "../data/DDBEnricherData";

/** DDB grants a bare ability-check bonus; the book scopes it to Intelligence (Study) checks. */
export default class ThespiansPlaybill extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Thespian's Playbill",
        options: { transfer: true, description: "Add your Charisma modifier (minimum +1) to Intelligence checks made with the Study action." },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("check", "max(1, @abilities.cha.mod)", {
            conditions: { k: "roll.ability", o: "exact", v: "int" },
          }),
        ],
      },
    ];
  }

}
