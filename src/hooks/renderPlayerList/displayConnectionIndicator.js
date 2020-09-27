export default (app, html) => {
  // display an indicator to the user that the connection is established
  if (window.ddbimporter && window.ddbimporter.isConnected) {
    $(html).find("h3").addClass("ddbimporterConnected");
  }
};
