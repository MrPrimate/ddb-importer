import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Risk Taker grants free d6 versions of the Maverick Spirit and Skin of Your Teeth maneuvers.
 * DDB ships those as "Maneuver: X (Risk Taker)" actions under actions.class, which the default
 * action match folds on as activities (ManeuverMaverickSpiritRiskTaker /
 * ManeuverSkinOfYourTeethRiskTaker supply their rolls) - but that path copies activities only,
 * not descriptions, so the variant rules text is pulled in here.
 */
export default class RiskTaker extends DDBEnricherData {

  static MANEUVERS = [
    { action: "Maneuver: Maverick Spirit (Risk Taker)", label: "Maverick Spirit" },
    { action: "Maneuver: Skin of Your Teeth (Risk Taker)", label: "Skin of Your Teeth" },
  ];

  // the two variant actions stay activities on this feature, as they were before this enricher
  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    const blocks = RiskTaker.MANEUVERS
      .map(({ action, label }) => {
        const description = this.getActionDescription({ name: action, type: "class" });
        return description ? `<p><strong>${label}</strong></p>${description}` : "";
      })
      .filter((block) => block !== "");

    if (blocks.length === 0) return {};
    return { descriptionSuffix: `<hr>${blocks.join("")}` };
  }

}
