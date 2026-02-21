import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineOrderThaumaturge extends DDBEnricherData {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.scale.cleric.cantrips-known.value"),
        ],
      },
    ];
  }

}
