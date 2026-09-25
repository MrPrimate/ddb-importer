import DDBEnricherData from "../data/DDBEnricherData";

/**
 * DDB grants a bare ability-check bonus; the book scopes it to Intelligence (Study) checks. The
 * Study action cannot be told apart from other Intelligence checks, so it covers them all.
 */
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
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @abilities.cha.mod)", 20, "system.abilities.int.bonuses.check"),
        ],
      },
    ];
  }

}
