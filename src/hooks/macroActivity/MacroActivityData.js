const { BooleanField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data model for an utility activity.
 *
 * @property {object} macro
 * @property {string} macro.function   Macro name
 * @property {string} macro.name      Label for the rolling button.
 * @property {boolean} macro.isFunction   Is this a function, not a true macro?
 * @property {boolean} macro.visible  Should the macro button be visible to all players?
 * @property {boolean} macro.parameters  Parameters to pass to the macro
 */
export default class MacroActivityData extends dnd5e.dataModels.activity.BaseActivityData {
  /** @inheritDoc */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      macro: new SchemaField({
        function: new StringField(),
        name: new StringField(),
        // isFunction: new BooleanField(),
        visible: new BooleanField(),
        parameters: new StringField(),
      }),
    };
  }

}
