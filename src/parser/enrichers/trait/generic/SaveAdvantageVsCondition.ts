import DDBEnricherData from "../../data/DDBEnricherData";
import DDBDescriptions from "../../../lib/DDBDescriptions";
import Generic from "./Generic";

/**
 * Species traits giving Advantage on saving throws against conditions (Fey Ancestry, Brave,
 * Dwarven Resilience and friends), read from the trait's own text. AC5e's riderStatuses map is
 * built from the effects the triggering activity applies, so the initial save is automated; repeat
 * saves to end a condition have no activity context and stay manual. The change joins the trait's
 * passive effect (Dwarven Resilience's poison resistance) when it has one.
 */
export default class SaveAdvantageVsCondition extends Generic {

  override get effects(): IDDBEffectHint[] {
    const { statuses, poison } = DDBDescriptions.saveAdvantageConditions(this.data.system?.description?.value ?? "");
    if (statuses.length === 0) return [];
    const conditions = [
      ...statuses.map((status) => `riderStatuses.${status}`),
      ...(poison ? ["damageTypes.poison"] : []),
    ];
    const joinsPassive = this.data.effects?.[0]?.transfer === true;
    return [
      {
        noCreate: joinsPassive,
        ac5eOnly: true,
        options: joinsPassive
          ? {}
          : {
            transfer: true,
            description: `Advantage on saving throws against ${new Intl.ListFormat("en", { type: "disjunction" }).format(statuses)}. Automated for the initial save only.`,
          },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(conditions.join(" || "), 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
    ];
  }

}
