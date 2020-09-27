import { tutorialConnectToFoundry } from "../../tutorial/index.js";

export default () => {
  // prettier-ignore
  if ((/electron/i).test(navigator.userAgent)) {
    let text = $(`<h2>Native App detected</h2><p>Connect to your Foundry server using Google Chrome to enable the DDB Importer extension.</p>
    <p>Not sure what to do? <a>Let me show you!</a></p>`);

    $(text).find('a').click((event) => {
      event.preventDefault();
      tutorialConnectToFoundry();
    });
    window.ddbimporter.notification.show(
      text,
      null
    );
  }
};
