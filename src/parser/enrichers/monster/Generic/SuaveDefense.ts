import DDBEnricherData from "../../data/DDBEnricherData";

export default class SuaveDefense extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@abilities.cha.mod", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
