import { ChooserDialog, optionsToPosition } from "./AdvancedDialog";
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
  static async buttonDialog({ title = "", content = "", buttons = [], options = {} }: IDDBDialogHelperButtonDialogConfig = {}, direction = "row") {
    if (!buttons?.length) return null;

    return foundry.applications.api.DialogV2.wait({
      window: { title },
      content,
      classes: ["ddb-button-dialog", `ddb-button-dialog-${direction}`],
      position: optionsToPosition(options),
      buttons: buttons.map((button, index) => ({
        action: `button-${index}`,
        label: button.label,
        callback: () => button.value,
      })),
      rejectClose: false,
      // dismissing the dialog resolves null (was `this` in the legacy Dialog,
      // a latent bug that also broke socket serialisation)
      close: () => null,
    } as any);
  }

  static ChooserDialog = ChooserDialog;

  static async AskUserButtonDialog(user: string, ...buttonArgs: any[]) {
    return globalThis.DDBImporter.socket.executeAsUser("simpleButtonDialog", user, ...buttonArgs);
  }

  static async AskUserChooserDialog(user: string, ...dialogArgs: any[]) {
    return globalThis.DDBImporter.socket.executeAsUser("chooserDialog", user, ...dialogArgs);
  }
}
