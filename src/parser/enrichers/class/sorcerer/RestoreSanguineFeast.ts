import Generic from "../Generic";

/** Crimson Sorcery: 5 sorcery points restore Sanguine Feast's long-rest use. */
export default class RestoreSanguineFeast extends Generic {

  override get activity(): IDDBActivityData {
    return {
      activationType: "none",
      data: {
        consumption: {
          scaling: { allowed: false, max: "" },
          targets: [
            {
              type: "itemUses",
              target: "",
              value: "-1",
              scaling: { mode: "", formula: "" },
            },
            {
              type: "itemUses",
              target: "feat:sorcery-points",
              value: "5",
              scaling: { mode: "", formula: "" },
            },
          ],
        },
      },
    };
  }

}
