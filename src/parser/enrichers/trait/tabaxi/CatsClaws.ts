import { Generic } from "../_module";

export default class CatsClaws extends Generic.Generic {

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
    };
  }

}
