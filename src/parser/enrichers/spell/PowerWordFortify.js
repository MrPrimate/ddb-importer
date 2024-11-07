/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class PowerWordFortify extends DDBEnricherMixin {

  get override() {
    return {
      descriptionSuffix: `
<details>
    <summary><strong>Temp HP Helpers</strong></summary>
    <p>[[/healing 20 type=temphp]]</p>
    <p>[[/healing 30 type=temphp]]</p>
    <p>[[/healing 40 type=temphp]]</p>
    <p>[[/healing 60 type=temphp]]</p>
    <p>[[/healing 120 type=temphp]]</p>
</details>`,
    };
  }

}
