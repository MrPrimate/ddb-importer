import { ChooserDialog } from "./_module.mjs";

export default class DialogHelper {

  /**
   * Generates a dialog with buttons and options in the specified direction.
   *
   * @param {object} options An object containing the dialog options.
   *   @param {string} options.title The title of the dialog.
   *   @param {string} options.content The content of the dialog.
   *   @param {Array<{label: string, value: string}} options.buttons An array of buttons for the dialog.
   *      label The label of the button.
   *      value The value associated with the button.
   *   @param {object} options.options Additional options to pass to the dialog.
   * @param {string} direction The direction of the dialog buttons.
   * @returns {Promise} A promise that resolves with the button value or rejects with an error.
   *
   *     @example
     const selected = await DDBImporter.EffectHelper.buttonDialog(
       {
        buttons: [{ label: "Label1", value: "Value1"}, {label: "Label2", value: "Value2" }],
        title: "A title",
        content: "Some <b>bold</b> content"
      },
      'row'
     );
     console.warn(`You selected ${selected}`);
   */
  static async buttonDialog({ title = "", content = "", buttons, options = { height: "auto" } } = {}, direction = "row") {

    return new Promise((resolve) => {
      new Dialog(
        {
          title,
          content,
          buttons: buttons.reduce((o, button) => ({
            ...o,
            [button.label]: { label: button.label, callback: () => resolve(button.value) },
          }), {}),
          close: () => resolve(this),
        },
        {
          classes: ["dialog", `ddb-button-dialog-${direction}`],
          ...options,
        },
      ).render(true);
    });
  }

  static ChooserDialog = ChooserDialog;

  static async AskUserButtonDialog(user, ...buttonArgs) {
    return globalThis.DDBImporter.socket.executeAsUser("simpleButtonDialog", user, ...buttonArgs);
  }

  static async AskUserChooserDialog(user, ...dialogArgs) {
    return globalThis.DDBImporter.socket.executeAsUser("chooserDialog", user, ...dialogArgs);
  }
}
