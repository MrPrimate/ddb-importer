# FAQ

## The import buttons are greyed out!

They require the cobalt token setting to be set.

## Clerics and Druids don't get their un-prepared spells

You need to have the cobalt token set to get these spells.

## Magic Items don't have spells attached

When you use the Magic Items module and Munch Items the spells are not attached to the Item.
This is a tricky issue and parsing these things out of the item text takes time as they are not exposed as an attached object to the item.

## Can I import books/adventures?

Yes! But you should see the [DDB Adventure Muncher](https://github.com/MrPrimate/ddb-adventure-muncher).

## My Characters AC is wrong

This is almost certainly because you have the "Dynamic Active Effects" module installed. In the DAE module settings make sure you untick the set base AC and autocalculate ac options or DAE will try to do that for you.

It might also be because your AC settings in the "Active Effects" tab is incorrect.
