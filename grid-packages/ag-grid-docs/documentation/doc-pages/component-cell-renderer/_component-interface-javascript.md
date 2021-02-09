[[only-javascript]]
|## Cell Renderer Component
|
|The interface for the cell renderer component is as follows:
|
|```ts
|interface ICellRendererComp {
|    // Optional - Params for rendering. The same params that are passed to the cellRenderer function.
|    init?(params: ICellRendererParams): void;
|
|    // Mandatory - Return the DOM element of the component, this is what the grid puts into the cell
|    getGui(): HTMLElement;
|
|    // Optional - Gets called once by grid after rendering is finished - if your renderer needs to do any cleanup,
|    // do it here
|    destroy?(): void;
|
|    // Mandatory - Get the cell to refresh. Return true if the refresh succeeded, otherwise return false.
|    // If you return false, the grid will remove the component from the DOM and create
|    // a new component in its place with the new values.
|    refresh(params: ICellRendererParams): boolean;
|}
|```
|
|The interface for the cell renderer parameters is as follows:
|
|```ts
|interface ICellRendererParams {
|    value: any, // value to be rendered
|    valueFormatted: any, // value to be rendered formatted
|    getValue: () => any, // convenience function to get most recent up to date value
|    setValue: (value: any) => void, // convenience to set the value
|    formatValue: (value: any) => any, // convenience to format a value using the column's formatter
|    data: any, // the row's data
|    node: RowNode, // row node
|    colDef: ColDef, // the cell's column definition
|    column: Column, // the cell's column
|    rowIndex: number, // the current index of the row (this changes after filter and sort)
|    api: GridApi, // the grid API
|    eGridCell: HTMLElement, // the grid's cell, a DOM div element
|    eParentOfValue: HTMLElement, // the parent DOM item for the cell renderer, same as eGridCell unless using checkbox selection
|    columnApi: ColumnApi, // grid column API
|    context: any, // the grid's context
|    refreshCell: () => void // convenience function to refresh the cell
|}
|```