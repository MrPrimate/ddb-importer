DDB Importer tries to generate as much of the data model automatically from parsing the structured JSON on DDB or via regex parsing.

For many documents, some nudging is required.
This nudging is done through enrichers.
The core element here is around parsing activities for documents.
However enrichers can also be used to enrich or alter other elements of a document.

The most common elements to target are:

- Changing the uses of an activity or document
- Changing the consumption target of an activity
- Changing the activity type.
- Adding additional activities, either from the actions related to a feature on DDB or entirely from scratch. A good example of this might be adding an activity to restore uses of a feature using spellslots or a resource.
- Generating effects for features
- Adding feature automation
- Generating enchantments
