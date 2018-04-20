# spine-floating-expansion-list
An element that displays an associated array of items as a list of cards and allows displaying
an expanded item view that stands out in a "floating" card.

You can specify the template for the content that should be displayed for each item in the nested
`template` element. This template will be stamped for each of the provided items with a different
value of the `item` variable, which can be used inside the template's elements to refer to the
respective item object.

A template for an expanded item can be specified using an additional nested `template` element with
a no-value `expanded` attribute.

Example:
```
<spine-floating-expansion-list items="[[attachments]]">
  <template>
    <div>Name: [[item.name]]</div>
    <div>Size: [[item.size]]</div>
  </template>
  <template expanded>
    <div>Name: [[item.name]]</div>
    <img src="[[item.imageUrl]]>
  </template>
</spine-floating-expansion-list>
```

### Styling

The templates provided are stamped in the light DOM of the `spine-floating-expansion-list` element,
so regular CSS declarations in your element will be applicable to the item elements rendered with
these templates. `spine-floating-expansion-list` renders some intermediate container elements as
containers of the actual stamped templates, which is considered as an implementation details, and
these elements shouldn't be relied upon in your CSS declarations.

You can use the following custom CSS properties and mixins:

Custom property                                  | Description                                    | Default
-------------------------------------------------|------------------------------------------------|----------
`--spine-floating-expansion-list-item`           | Mixin applied to all list item containers      | `{}`
`--spine-floating-expansion-list-expanded-item`  | Mixin applied to expanded list item containers | `{}`
`--spine-floating-expansion-list-expansion-size` | Size by which an expanded item's left/right edges stand out relative to the side edges of collapsed items | `20px`

# License

Apache License

Version 2.0, January 2004
