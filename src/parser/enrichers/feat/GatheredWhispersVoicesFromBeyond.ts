import DDBEnricherData from "../data/DDBEnricherData";
import _DarkGiftFlaw from "./_DarkGiftFlaw";

export default class GatheredWhispersVoicesFromBeyond extends _DarkGiftFlaw {

  flaw = {
    ability: "wis",
    condition: "Immediately after you roll a 1 on the d20 for a D20 Test",
    effect: {
      name: "Voices from Beyond",
      statuses: ["Deafened"],
      options: { expiry: "sourceEnd" as const },
      changes: [
        DDBEnricherData.ChangeHelper.ruleDisadvantageChange("check"),
        DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
      ],
    },
  };

}
