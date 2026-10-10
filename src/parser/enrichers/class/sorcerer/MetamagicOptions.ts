import DDBEnricherData from "../../data/DDBEnricherData";

export default class MetamagicOptions extends DDBEnricherData {

  // the options are modelled on this feature, so DDB's options are not built as documents
  override get noChoiceBuild(): boolean {
    return true;
  }

}
