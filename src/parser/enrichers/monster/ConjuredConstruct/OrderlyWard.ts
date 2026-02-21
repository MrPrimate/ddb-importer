// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class OrderlyWard extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          bonus: "@flags.dnd5e.summon.mod",
        }),
      },
    };
  }


}
