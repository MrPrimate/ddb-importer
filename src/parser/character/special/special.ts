import { logger } from "../../../lib/_module";
import DDBCharacter from "../../DDBCharacter";

DDBCharacter.prototype._addSpecialAdditions = function _addSpecialAdditions(this: DDBCharacter) {
  const ci = this.data.character.system.traits?.ci;
  if (!ci) {
    logger.warn("Unable to add special additions, no condition immunity traits on character");
    return;
  }
  const checkList = this.data.features.concat(this.data.actions);

  const sleepFeatures = [
    "Fey Ancestry",
    "Trance",
    "Constructed Resilience",
    "Everlasting",
  ];
  const features = checkList.filter((f) => sleepFeatures.includes(f.name) && f.type === "feat");
  const customs = new Set((ci.custom ?? "").split(":"));
  for (const sleepFeature of features) {
    if (sleepFeature && ((foundry.utils.getProperty(sleepFeature, "system.description.value") ?? "") as string).includes("magic can’t put you to sleep")) {
      customs.add("Sleep");
    }
  }
  ci.custom = Array.from(customs).join(";");

};
