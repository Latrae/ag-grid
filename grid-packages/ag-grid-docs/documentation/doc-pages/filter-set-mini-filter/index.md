---
title: "Set Filter - Mini Filter"
enterprise: true
---

This section describes the behaviour of the Mini Filter and shows how it can be configured.

The Mini Filter allows the user to search for particular values in the Filter List. Entering text into the Mini Filter will narrow down the presented list of values shown inside the Set Filter, but by default will not filter the data inside the grid.

<image-caption src="filter-set-mini-filter/resources/mini-filter.gif" alt="Mini Filter" constrained="true" centered="true"></image-caption>

## Keyboard Shortcuts

When the `Enter` key is pressed while on the Mini Filter, the Set Filter will exclusively select all values in the Filter List that pass the Mini Filter and apply the filter immediately (note that even if an Apply Button is used, hitting `Enter` applies the filter).

Alternatively, you can choose to have the Mini Filter applied as the user is typing, i.e. as the Filter List is filtered, the Set Filter will be applied as described above so that the results in the grid will also be filtered at the same time. To enable this behaviour, use the following:

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'country',
            filter: 'agSetColumnFilter',
            filterParams: {
                applyMiniFilterWhileTyping: true,
            },
        }
    ]
}
</snippet>

The following example demonstrates this behaviour. Note the following:

- The Athlete column's Set Filter shows the Mini Filter with default behaviour. Try typing in the Mini Filter to search the Filter List, and then hit the `Enter` key and notice how the grid is filtered using the displayed values.

- The Country column's Set Filter applies the Mini Filter as you type because `filterParams.applyMiniFilterWhileTyping = true`.

<grid-example title='Mini Filter Keyboard Shortcuts' name='mini-filter-keyboard-shortcuts' type='generated' options='{ "enterprise": true, "exampleHeight": 565, "modules": ["clientside", "setfilter", "menu"] }'></grid-example>

## Custom Searches

Sometimes it is necessary to provide custom handling for Mini Filter searches, for example to substitute accented characters.

As with the [Text Filter](../filter-text/#text-formatter) it is possible to supply a Text Formatter to the Set Filter which formats the text before applying the Mini Filter compare logic. The snippet below shows how this can be configured:

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'athlete',
            filter: 'agSetColumnFilter',
            filterParams: {
                textFormatter: value => {
                    return value
                        .replace(/\s/g, '')
                        .replace(/[????????????]/g, 'a')
                        .replace(/??/g, 'ae')
                        .replace(/??/g, 'c')
                        .replace(/[????????]/g, 'e')
                        .replace(/[????????]/g, 'i')
                        .replace(/??/g, 'n')
                        .replace(/[??????????]/g, 'o')
                        .replace(/??/g, 'oe')
                        .replace(/[????????]/g, 'u')
                        .replace(/[????]/g, 'y')
                        .replace(/\W/g, '');
                }
            }
        }
    ]
}
</snippet>

The following example demonstrates searching when there are accented characters. Note the following:

- The Athlete column's Set filter is supplied a text formatter via `filterParams.textFormatter` to ignore accents.
- Searching using `'bjorn'` will return all values containing `'bj??rn'`.

<grid-example title='Mini Filter Text Formatter' name='mini-filter-text-formatter' type='generated' options='{ "enterprise": true, "exampleHeight": 565, "modules": ["clientside", "setfilter", "menu", "columnpanel"] }'></grid-example>

## Text Customisation

Text used in the Mini Filter can be customised using [Localisation](../localisation/).

The text shown as a placeholder in the Mini Filter textbox can be customised by setting `'searchOoo'`.

When no matching values are found when typing in the Mini Filter, a message is displayed. This can be customised by setting `'noMatches'`.

The example below shows this text being customised.

<grid-example title='Text Customisation' name='text-customisation' type='generated' options='{ "enterprise": true, "modules": ["clientside", "setfilter", "menu"] }'></grid-example>

## Hiding the Mini Filter

By default, the Mini Filter is shown whenever the Set Filter is used. If you would like to hide it, you can use the following:

<snippet>
const gridOptions = {
    columnDefs: [
        {
            field: 'country',
            filter: 'agSetColumnFilter',
            filterParams: {
                suppressMiniFilter: true,
            },
        }
    ]
}
</snippet>

The following example demonstrates hiding the mini filter. Note the following:

- The Athlete column's Set Filter shows the Mini Filter by default.
- The Country column's Set Filter does not have a Mini Filter as `filterParams.suppressMiniFilter = true`.

<grid-example title='Hiding the Mini Filter' name='mini-filter-hiding' type='generated' options='{ "enterprise": true, "exampleHeight": 565, "modules": ["clientside", "setfilter", "menu"] }'></grid-example>

## Next Up

Continue to the next section: [Excel Mode](../filter-set-excel-mode/).
