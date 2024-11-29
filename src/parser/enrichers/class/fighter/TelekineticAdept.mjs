/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TelekineticAdept extends DDBEnricherData {


  get additionalActivities() {
    return this.is2024
      ? [
        { action: { name: "Psionic Power: Psi-Powered Leap", type: "class" } },
        { action: { name: "Psionic Power: Telekinetic Thrust", type: "class" } },
      ]
      : [
        { action: { name: "Telekinetic Adept: Psi-Powered Leap", type: "class" } },
        { action: { name: "Telekinetic Adept: Telekinetic Thrust", type: "class" } },
      ];
  }


}
