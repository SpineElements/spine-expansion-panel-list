# spine-expansion-panel-list
An element that displays an associated array of items as a list of panels showing a summary view
for each item, and allows expanding any item to display a full item view.

You can specify the template for the content that should be displayed for each item in the nested
`template` element. This template will be stamped for each of the provided items with a different
value of the `item` variable, which can be used inside the template's elements to refer to the
respective item object.

A template for an expanded item can be specified using an additional nested `template` element
with `class="expanded"` attribute.

Example:
```
<spine-expansion-panel-list
    items="${attachments}">

    collapsedItemRenderer="${item => html`
      <div>Name: [[item.name]]</div>
      <div>Size: [[item.size]]</div>
    `}"

    expandedItemRenderer="${item => html`
      <div>Name: [[item.name]]</div>
      <img src="[[item.imageUrl]]>
    `}">
</spine-expansion-panel-list>
```

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

# License

Apache License

Version 2.0, January 2004
