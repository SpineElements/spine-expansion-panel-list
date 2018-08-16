# spine-expansion-panel-list

An element that displays an associated array of items as a list of panels showing a summary view
for each item, and allows expanding any item to display a full item view.

You can specify the template for the content that should be displayed for each item using the
`renderItem` property, which should be declared as a function that accepts two arguments: an
 item, and a boolean `expanded` value, and returns a respective lit-html `TemplateResult`
 instance. This function will be used for rendering each of the provided items.

A template for an expanded item can be specified using the `renderExpandedItem` property, which
works the same as `renderItem`, but is invoked for rendering an expanded item. If this attribute
is specified, the function specified with `renderItem` will be used only for rendering collapsed
items.

Example:
```
<spine-expansion-panel-list
    items="${attachments}"

    renderItem="${item => html`
      <div>Name: ${item.name}</div>
      <div>Size: ${item.size}</div>
    `}"

    renderExpandedItem="${item => html`
      <div class="spine-epl-expansion-toggle">Name: ${item.name}</div>
      <img src="${item.imageUrl}">
    `}">
</spine-expansion-panel-list>
```

### Item Expansion and Collapsing

A user can expand and collapse items either using a mouse or a keyboard (by pressing Tab to focus
a respective item, Enter to expand it, and Esc to collapse it).

It is also possible to make certian portion(s) of an expanded item's layout as active areas that
can be clicked to collapse an item. To do this, add the `spine-epl-expansion-toggle` class to the
respective element in an expanded layout.

This element dispatches a non-bubbling `expanded-item-changed` event when an expanded item is
changed. You can read the `event.detail.expandedItem` property from the dispatched `event` to
detect which item has been expanded (will be `null` if no items are expanded).

### Styling

The templates provided are stamped in the light DOM of the `spine-expansion-panel-list` element,
so regular CSS declarations in your element will be applicable to the item elements rendered with
these templates. `spine-expansion-panel-list` renders some intermediate container elements as
containers of the actual stamped templates, which is considered as an implementation details, and
these elements shouldn't be relied upon in your CSS declarations.

You can use the following custom CSS properties and mixins:

Custom property/mixin                         | Description                                    | Default
----------------------------------------------|------------------------------------------------|----------
`--spine-expansion-panel-list-item`           | Mixin applied to all list item containers      | `{}`
`--spine-expansion-panel-list-expanded-item`  | Mixin applied to expanded list item containers | `{}`
`--spine-expansion-panel-list-expansion-size` | Size by which an expanded item's left/right edges stand out relative to the side edges of collapsed items | `20px`
`--spine-expansion-panel-list-focus-color`    | A color for displaying a focus bar and a semi-transparent overlay for a focused item | `#53c297`
`--spine-expansion-panel-list-item-focus-bar` | Mixin for a focus bar for a focused item (displayed on the left item's side by default) | `{}`
`--spine-expansion-panel-list-item-focus-overlay` | Mixin for an semi-transparent overlay that is displayed over a focused item | `{}`
`--shadow-elevation-2dp`                      | Mixin that specifies a shadow displayed for collapsed items by default | (see @polymer/paper-styles/shadow.js)
`--shadow-elevation-8dp`                      | Mixin that specifies a shadow displayed for expanded items by default  | (see @polymer/paper-styles/shadow.js)

# License

Apache License

Version 2.0, January 2004
