// import logger from "../../logger.js";

export function setupSocketlib() {

  const socket = globalThis.socketlib.registerModule("ddb-importer");
  socket.register("simpleButtonDialog", DDBImporter.lib.DialogHelper.buttonDialog);
  socket.register("chooserDialog", DDBImporter.lib.DialogHelper.ChooserDialog.Ask);

  return socket;

}
