export class DDBActivityDictionary {

  ACTIVITY_HINTS = {

  };

  ACTIVITY_OVERRIDES = {

  };


  constructor({ document, name = null }) {
    this.document = document;
    this.name = name ?? document.flags?.ddbimporter?.originalName ?? document.name;

    this.type = this.ACTIVITY_HINTS[this.name]?.type;

  }


}
