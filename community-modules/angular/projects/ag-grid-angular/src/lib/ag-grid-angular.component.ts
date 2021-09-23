import {
    AfterViewInit,
    Component,
    ComponentFactoryResolver,
    ContentChildren,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    QueryList,
    ViewContainerRef,
    ViewEncapsulation
} from "@angular/core";

import {
    ColDef,
    ColumnApi,
    ComponentUtil,
    Grid,
    GridApi,
    GridOptions,
    GridParams,
    Module,
    AgPromise,
    ColGroupDef,
    ExcelStyle,
    IDatasource,
    IServerSideDatasource,
    IViewportDatasource,
    IAggFunc,
    CsvExportParams,
    ExcelExportParams,
    StatusPanelDef,
    SideBarDef,
    AgChartThemeOverrides,
    AgChartTheme,
    ServerSideStoreType,
    RowGroupingDisplayType,
    ICellRendererComp,
    ICellRendererFunc,
    GetContextMenuItems,
    GetMainMenuItems,
    GetRowNodeIdFunc,
    NavigateToNextHeaderParams,
    HeaderPosition,
    TabToNextHeaderParams,
    NavigateToNextCellParams,
    CellPosition,
    TabToNextCellParams,
    PostProcessPopupParams,
    GetDataPath,
    ICellRenderer,
    ILoadingOverlayComp,
    INoRowsOverlayComp,
    RowNode,
    IsRowMaster,
    IsRowSelectable,
    PaginationNumberFormatterParams,
    ProcessDataFromClipboardParams,
    GetServerSideGroupKey,
    IsServerSideGroup,
    SuppressKeyboardEventParams,
    ChartRef,
    ChartOptions,
    GetChartToolbarItems,
    FillOperationParams,
    IsApplyServerSideTransaction,
    GetServerSideStoreParamsParams,
    ServerSideStoreParams,
    IsServerSideGroupOpenByDefaultParams,
    IsGroupOpenByDefaultParams,
    ColumnEverythingChangedEvent,
    NewColumnsLoadedEvent,
    ColumnPivotModeChangedEvent,
    ColumnRowGroupChangedEvent,
    ExpandCollapseAllEvent,
    ColumnPivotChangedEvent,
    GridColumnsChangedEvent,
    ColumnValueChangedEvent,
    ColumnMovedEvent,
    ColumnVisibleEvent,
    ColumnPinnedEvent,
    ColumnGroupOpenedEvent,
    ColumnResizedEvent,
    DisplayedColumnsChangedEvent,
    VirtualColumnsChangedEvent,
    AsyncTransactionsFlushed,
    RowGroupOpenedEvent,
    RowDataChangedEvent,
    RowDataUpdatedEvent,
    PinnedRowDataChangedEvent,
    RangeSelectionChangedEvent,
    ChartCreated,
    ChartRangeSelectionChanged,
    ChartOptionsChanged,
    ChartDestroyed,
    ToolPanelVisibleChangedEvent,
    ModelUpdatedEvent,
    PasteStartEvent,
    PasteEndEvent,
    FillStartEvent,
    FillEndEvent,
    CellClickedEvent,
    CellDoubleClickedEvent,
    CellMouseDownEvent,
    CellContextMenuEvent,
    CellValueChangedEvent,
    RowValueChangedEvent,
    CellFocusedEvent,
    RowSelectedEvent,
    SelectionChangedEvent,
    CellKeyDownEvent,
    CellKeyPressEvent,
    CellMouseOverEvent,
    CellMouseOutEvent,
    FilterChangedEvent,
    FilterModifiedEvent,
    FilterOpenedEvent,
    SortChangedEvent,
    VirtualRowRemovedEvent,
    RowClickedEvent,
    RowDoubleClickedEvent,
    GridReadyEvent,
    GridSizeChangedEvent,
    ViewportChangedEvent,
    FirstDataRenderedEvent,
    DragStartedEvent,
    DragStoppedEvent,
    RowEditingStartedEvent,
    RowEditingStoppedEvent,
    CellEditingStartedEvent,
    CellEditingStoppedEvent,
    BodyScrollEvent,
    PaginationChangedEvent,
    ComponentStateChangedEvent,
    RowDragEvent,
    ColumnRowGroupChangeRequestEvent,
    ColumnPivotChangeRequestEvent,
    ColumnValueChangeRequestEvent,
    ColumnAggFuncChangeRequestEvent,
    ProcessRowParams,
    ProcessCellForExportParams,
    ProcessHeaderForExportParams,
    ProcessChartOptionsParams,
    RowClassRules,
    RowClassParams,
    RowHeightParams,
    SendToClipboardParams,
    TreeDataDisplayType,
    FullWidthCellKeyDownEvent,
    FullWidthCellKeyPressEvent,
    LoadingCellRendererSelectorFunc
} from "@ag-grid-community/core";

import { AngularFrameworkOverrides } from "./angularFrameworkOverrides";
import { AngularFrameworkComponentWrapper } from "./angularFrameworkComponentWrapper";
import { AgGridColumn } from "./ag-grid-column.component";

@Component({
    selector: 'ag-grid-angular',
    template: '',
    providers: [
        AngularFrameworkOverrides,
        AngularFrameworkComponentWrapper
    ],
    // tell angular we don't want view encapsulation, we don't want a shadow root
    encapsulation: ViewEncapsulation.None
})
export class AgGridAngular implements AfterViewInit {
    // not intended for user to interact with. so putting _ in so if user gets reference
    // to this object, they kind'a know it's not part of the agreed interface
    private _nativeElement: any;
    private _initialised = false;
    private _destroyed = false;

    private gridParams: GridParams;

    // in order to ensure firing of gridReady is deterministic
    private _fullyReady: AgPromise<boolean> = AgPromise.resolve(true);

    // making these public, so they are accessible to people using the ng2 component references
    public api: GridApi;
    public columnApi: ColumnApi;

    @ContentChildren(AgGridColumn) public columns: QueryList<AgGridColumn>;

    constructor(elementDef: ElementRef,
        private viewContainerRef: ViewContainerRef,
        private angularFrameworkOverrides: AngularFrameworkOverrides,
        private frameworkComponentWrapper: AngularFrameworkComponentWrapper,
        private componentFactoryResolver: ComponentFactoryResolver) {
        this._nativeElement = elementDef.nativeElement;

    }

    ngAfterViewInit(): void {
        this.frameworkComponentWrapper.setViewContainerRef(this.viewContainerRef);
        this.frameworkComponentWrapper.setComponentFactoryResolver(this.componentFactoryResolver);
        this.angularFrameworkOverrides.setEmitterUsedCallback(this.isEmitterUsed.bind(this));

        this.gridOptions = ComponentUtil.copyAttributesToGridOptions(this.gridOptions, this, true);

        this.gridParams = {
            globalEventListener: this.globalEventListener.bind(this),
            frameworkOverrides: this.angularFrameworkOverrides,
            providedBeanInstances: {
                frameworkComponentWrapper: this.frameworkComponentWrapper
            },
            modules: (this.modules || []) as any
        };

        if (this.columns && this.columns.length > 0) {
            this.gridOptions.columnDefs = this.columns
                .map((column: AgGridColumn): ColDef => {
                    return column.toColDef();
                });
        }

        new Grid(this._nativeElement, this.gridOptions, this.gridParams);

        if (this.gridOptions.api) {
            this.api = this.gridOptions.api;
        }

        if (this.gridOptions.columnApi) {
            this.columnApi = this.gridOptions.columnApi;
        }

        this._initialised = true;

        // sometimes, especially in large client apps gridReady can fire before ngAfterViewInit
        // this ties these together so that gridReady will always fire after agGridAngular's ngAfterViewInit
        // the actual containing component's ngAfterViewInit will fire just after agGridAngular's
        this._fullyReady.resolveNow(null, resolve => resolve);
    }

    public ngOnChanges(changes: any): void {
        if (this._initialised) {
            ComponentUtil.processOnChange(changes, this.gridOptions, this.api, this.columnApi);
        }
    }

    public ngOnDestroy(): void {
        if (this._initialised) {
            // need to do this before the destroy, so we know not to emit any events
            // while tearing down the grid.
            this._destroyed = true;
            if (this.api) {
                this.api.destroy();
            }
        }
    }

    // we'll emit the emit if a user is listening for a given event either on the component via normal angular binding
    // or via gridOptions
    protected isEmitterUsed(eventType: string): boolean {
        const emitter = <EventEmitter<any>>(<any>this)[eventType];
        const hasEmitter = !!emitter && emitter.observers && emitter.observers.length > 0;

        // gridReady => onGridReady
        const asEventName = `on${eventType.charAt(0).toUpperCase()}${eventType.substring(1)}`
        const hasGridOptionListener = !!this.gridOptions && !!this.gridOptions[asEventName];

        return hasEmitter || hasGridOptionListener;
    }

    private globalEventListener(eventType: string, event: any): void {
        // if we are tearing down, don't emit angular events, as this causes
        // problems with the angular router
        if (this._destroyed) {
            return;
        }

        // generically look up the eventType
        const emitter = <EventEmitter<any>>(<any>this)[eventType];
        if (emitter && this.isEmitterUsed(eventType)) {
            if (eventType === 'gridReady') {
                // if the user is listening for gridReady, wait for ngAfterViewInit to fire first, then emit the
                // gridReady event
                this._fullyReady.then((result => {
                    emitter.emit(event);
                }));
            } else {
                emitter.emit(event);
            }
        }
    }

    @Input() public gridOptions: GridOptions;
    @Input() public modules: Module[];

    // @START@
    /** Specifies the status bar components to use in the status bar.     */
    @Input() public statusBar: { statusPanels: StatusPanelDef[]; } | undefined = undefined;
    /** Specifies the side bar components.     */
    @Input() public sideBar: SideBarDef | string | boolean | null | undefined = undefined;
    /** Set to `true` to not show the context menu. Use if you don't want to use the default 'right click' context menu.     */
    @Input() public suppressContextMenu: boolean | undefined = undefined;
    /** When using `suppressContextMenu`, you can use the `onCellContextMenu` function to provide your own code to handle cell `contextmenu` events.
     * This flag is useful to prevent the browser from showing its default context menu.     */
    @Input() public preventDefaultOnContextMenu: boolean | undefined = undefined;
    /** Allows context menu to show, even when `Ctrl` key is held down.     */
    @Input() public allowContextMenuWithControlKey: boolean | undefined = undefined;
    /** Set to `true` to always show the column menu button, rather than only showing when the mouse is over the column header.     */
    @Input() public suppressMenuHide: boolean | undefined = undefined;
    /** Set to `true` to use the browser's default tooltip instead of using the grid's Tooltip Component     */
    @Input() public enableBrowserTooltips: boolean | undefined = undefined;
    /** The delay in milliseconds that it takes for tooltips to show up once an element is hovered over.
     *     **Note:** This property does not work if `enableBrowserTooltips` is `true`.     */
    @Input() public tooltipShowDelay: number | undefined = undefined;
    /** Set to `true` to have tooltips follow the cursor once they are displayed.     */
    @Input() public tooltipMouseTrack: boolean | undefined = undefined;
    /** DOM element to use as the popup parent for grid popups (context menu, column menu etc).     */
    @Input() public popupParent: HTMLElement | undefined = undefined;
    /** Set to `true` to also include headers when copying to clipboard using `Ctrl + C` clipboard.     */
    @Input() public copyHeadersToClipboard: boolean | undefined = undefined;
    /** Specify the deliminator to use when copying to clipboard.     */
    @Input() public clipboardDeliminator: string | undefined = undefined;
    /** Set to `true` to only have the range selection, and not row selection, copied to clipboard.     */
    @Input() public suppressCopyRowsToClipboard: boolean | undefined = undefined;
    /** Set to `true` to work around a bug with Excel (Windows) that adds an extra empty line at the end of ranges copied to the clipboard.     */
    @Input() public suppressLastEmptyLineOnPaste: boolean | undefined = undefined;
    /** Set to `true` to turn off paste operations within the grid.     */
    @Input() public suppressClipboardPaste: boolean | undefined = undefined;
    /** Set to `true` to stop the grid trying to use the Clipboard API, if it is blocked, and immediately fallback to the workaround.     */
    @Input() public suppressClipboardApi: boolean | undefined = undefined;
    /** Array of Column / Column Group definitions.     */
    @Input() public columnDefs: (ColDef | ColGroupDef)[] | null | undefined = undefined;
    /** A default column definition. Items defined in the actual column definitions get precedence.     */
    @Input() public defaultColDef: ColDef | undefined = undefined;
    /** A default column group definition. All column group definitions will use these properties. Items defined in the actual column group definition get precedence.     */
    @Input() public defaultColGroupDef: Partial<ColGroupDef> | undefined = undefined;
    /** An object map of custom column types which contain groups of properties that column definitions can inherit by referencing in their `type` property.     */
    @Input() public columnTypes: { [key: string]: ColDef; } | undefined = undefined;
    /** Keeps the order of Columns maintained after new Column Definitions are updated.     */
    @Input() public maintainColumnOrder: boolean | undefined = undefined;
    /** If `true`, then dots in field names (e.g. `address.firstline`) are not treated as deep references. Allows you to use dots in your field name if you prefer.     */
    @Input() public suppressFieldDotNotation: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public deltaColumnMode: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public applyColumnDefOrder: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public immutableColumns: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public suppressSetColumnStateEvents: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public suppressColumnStateEvents: boolean | undefined = undefined;
    /** @deprecated Set via `defaultColDef.width`
     */
    @Input() public colWidth: number | undefined = undefined;
    /** @deprecated Set via `defaultColDef.minWidth`
     */
    @Input() public minColWidth: number | undefined = undefined;
    /** @deprecated Set via `defaultColDef.maxWidth`
     */
    @Input() public maxColWidth: number | undefined = undefined;
    /** The height in pixels for the row containing the column label header. Default: `25`     */
    @Input() public headerHeight: number | undefined = undefined;
    /** The height in pixels for the rows containing header column groups. If not specified, it uses `headerHeight`.     */
    @Input() public groupHeaderHeight: number | undefined = undefined;
    /** The height in pixels for the row containing the floating filters. Default: `20`     */
    @Input() public floatingFiltersHeight: number | undefined = undefined;
    /** The height in pixels for the row containing the columns when in pivot mode. If not specified, it uses `headerHeight`.     */
    @Input() public pivotHeaderHeight: number | undefined = undefined;
    /** The height in pixels for the row containing header column groups when in pivot mode. If not specified, it uses `groupHeaderHeight`.     */
    @Input() public pivotGroupHeaderHeight: number | undefined = undefined;
    /** Allow reordering and pinning columns by dragging columns from the Columns Tool Panel to the grid.     */
    @Input() public allowDragFromColumnsToolPanel: boolean | undefined = undefined;
    /** Set to `true` to suppress column moving, i.e. to make the columns fixed position.     */
    @Input() public suppressMovableColumns: boolean | undefined = undefined;
    /** If `true`, the `ag-column-moving` class is not added to the grid while columns are moving. In the default themes, this results in no animation when moving columns.     */
    @Input() public suppressColumnMoveAnimation: boolean | undefined = undefined;
    /** If `true`, when you drag a column out of the grid (e.g. to the group zone) the column is not hidden.     */
    @Input() public suppressDragLeaveHidesColumns: boolean | undefined = undefined;
    /** Set to `'shift'` to have shift-resize as the default resize operation (same as user holding down `Shift` while resizing).     */
    @Input() public colResizeDefault: string | undefined = undefined;
    /** Suppresses auto-sizing columns for columns. In other words, double clicking a column's header's edge will not auto-size.     */
    @Input() public suppressAutoSize: boolean | undefined = undefined;
    /** Number of pixels to add to a column width after the [auto-sizing](/column-sizing/#auto-size-columns) calculation.
     * Set this if you want to add extra room to accommodate (for example) sort icons, or some other dynamic nature of the header.     */
    @Input() public autoSizePadding: number | undefined = undefined;
    /** Set this to `true` to skip the `headerName` when `autoSize` is called by default.     */
    @Input() public skipHeaderOnAutoSize: boolean | undefined = undefined;
    /** A map of component names to plain JavaScript components.     */
    @Input() public components: { [p: string]: any; } | undefined = undefined;
    /** A map of component names to framework (Angular, React, Vue etc.) components.     */
    @Input() public frameworkComponents: { [p: string]: { new(): any; }; } | any | undefined = undefined;
    /** Set to `'fullRow'` to enable Full Row Editing. Otherwise leave blank to edit one cell at a time.     */
    @Input() public editType: string | undefined = undefined;
    /** Set to `true` to enable Single Click Editing for cells, to start editing with a single click.     */
    @Input() public singleClickEdit: boolean | undefined = undefined;
    /** Set to `true` so that neither single nor double click starts editing.     */
    @Input() public suppressClickEdit: boolean | undefined = undefined;
    /** Set this to `true` to stop cell editing when grid loses focus.
     * The default is that the grid stays editing until focus goes onto another cell. For inline (non-popup) editors only.     */
    @Input() public stopEditingWhenCellsLoseFocus: boolean | undefined = undefined;
    /** Set to `true` along with `enterMovesDownAfterEdit` to have Excel-style behaviour for the `Enter` key.
     * i.e. pressing the `Enter` key will move down to the cell beneath.     */
    @Input() public enterMovesDown: boolean | undefined = undefined;
    /** Set to `true` along with `enterMovesDown` to have Excel-style behaviour for the 'Enter' key.
     * i.e. pressing the Enter key will move down to the cell beneath.     */
    @Input() public enterMovesDownAfterEdit: boolean | undefined = undefined;
    /** Set to `true` to enable Undo / Redo while editing.     */
    @Input() public undoRedoCellEditing: boolean | undefined = undefined;
    /** Set the size of the undo / redo stack.     */
    @Input() public undoRedoCellEditingLimit: number | undefined = undefined;
    /** @deprecated Use stopEditingWhenCellsLoseFocus instead
     */
    @Input() public stopEditingWhenGridLosesFocus: boolean | undefined = undefined;
    /** A default configuration object used to export to CSV.     */
    @Input() public defaultCsvExportParams: CsvExportParams | undefined = undefined;
    /** Prevents the user from exporting the grid to CSV.     */
    @Input() public suppressCsvExport: boolean | undefined = undefined;
    /** A default configuration object used to export to Excel.     */
    @Input() public defaultExcelExportParams: ExcelExportParams | undefined = undefined;
    /** Prevents the user from exporting the grid to Excel.     */
    @Input() public suppressExcelExport: boolean | undefined = undefined;
    /** A list (array) of Excel styles to be used when exporting to Excel with styles.     */
    @Input() public excelStyles: ExcelStyle[] | undefined = undefined;
    /** @deprecated Use defaultCsvExportParams or defaultExcelExportParams
     */
    @Input() public defaultExportParams: CsvExportParams | ExcelExportParams | undefined = undefined;
    /** Rows are filtered using this text as a quick filter.     */
    @Input() public quickFilterText: string | undefined = undefined;
    /** Set to `true` to turn on the quick filter cache, used to improve performance when using the quick filter.     */
    @Input() public cacheQuickFilter: boolean | undefined = undefined;
    /** Set to `true` to override the default tree data filtering behaviour to instead exclude child nodes from filter results.     */
    @Input() public excludeChildrenWhenTreeDataFiltering: boolean | undefined = undefined;
    /** @deprecated Use floatingFilter on the colDef instead
     */
    @Input() public floatingFilter: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public enableOldSetFilterModel: boolean | undefined = undefined;
    /** Set to `true` to Enable Charts.     */
    @Input() public enableCharts: boolean | undefined = undefined;
    /** The list of chart themes to be used.     */
    @Input() public chartThemes: string[] | undefined = undefined;
    /** A map containing custom chart themes.     */
    @Input() public customChartThemes: { [name: string]: AgChartTheme } | undefined = undefined;
    /** Chart theme overrides applied to all themes.     */
    @Input() public chartThemeOverrides: AgChartThemeOverrides | undefined = undefined;
    /** @deprecated     */
    @Input() public processChartOptions: ((params: ProcessChartOptionsParams) =>  ChartOptions<any>) | undefined = undefined;
    /** @deprecated     */
    @Input() public allowProcessChartOptions: boolean | undefined = undefined;
    /** `cellRenderer` to use when data is loading via a DataSource.     */
    @Input() public loadingCellRenderer: { new(): ICellRenderer; } | string | undefined = undefined;
    /** Framework `cellRenderer` to use when data is loading via a DataSource.     */
    @Input() public loadingCellRendererFramework: any = undefined;
    /** Params to be passed to loading cell renderer component.     */
    @Input() public loadingCellRendererParams: any = undefined;
    /** Callback to select which loading cell renderer to be used when data is loading via a DataSource.     */
    @Input() public loadingCellRendererSelector: LoadingCellRendererSelectorFunc | undefined = undefined;
    /** A map of key->value pairs for localising text within the grid.     */
    @Input() public localeText: { [key: string]: string } | undefined = undefined;
    /** Set to `true` to enable Master Detail.     */
    @Input() public masterDetail: boolean | undefined = undefined;
    /** Set to `true` to keep detail rows for when they are displayed again.     */
    @Input() public keepDetailRows: boolean | undefined = undefined;
    /** Sets the number of details rows to keep.     */
    @Input() public keepDetailRowsCount: number | undefined = undefined;
    /** Provide a custom `detailCellRenderer` to use when a master row is expanded.     */
    @Input() public detailCellRenderer: { new(): ICellRendererComp; } | ICellRendererFunc | string | undefined = undefined;
    /** Framework `detailCellRenderer` to use when a master row is expanded.     */
    @Input() public detailCellRendererFramework: any = undefined;
    /** Specifies the params to be used by the Detail Cell Renderer. Can also be a function that provides the params to enable dynamic definitions of the params.     */
    @Input() public detailCellRendererParams: any = undefined;
    /** Set fixed height in pixels for each detail row.     */
    @Input() public detailRowHeight: number | undefined = undefined;
    /** Set to `true` to have the detail grid dynamically change it's height to fit it's rows.     */
    @Input() public detailRowAutoHeight: boolean | undefined = undefined;
    /** Provides a context object that is provided to different callbacks the grid uses. Used for passing additional information to the callbacks by your application.     */
    @Input() public context: any = undefined;
    /** A list of grids to treat as Aligned Grids. If grids are aligned then the columns and horizontal scrolling will be kept in sync.     */
    @Input() public alignedGrids: GridOptions[] | undefined = undefined;
    /** Change this value to set the tabIndex order of the Grid within your application. Default: `0`     */
    @Input() public tabIndex: number | undefined = undefined;
    /** The number of rows rendered outside the viewable area the grid renders.
     * Having a buffer means the grid will have rows ready to show as the user slowly scrolls vertically.
     * Default: `10`     */
    @Input() public rowBuffer: number | undefined = undefined;
    /** Set to `true` to turn on the value cache.     */
    @Input() public valueCache: boolean | undefined = undefined;
    /** Set to `true` to configure the value cache to not expire after data updates.     */
    @Input() public valueCacheNeverExpires: boolean | undefined = undefined;
    /** Set to `true` to allow cell expressions.     */
    @Input() public enableCellExpressions: boolean | undefined = undefined;
    /** If `true`, row nodes do not have their parents set.
     * The grid doesn't use the parent reference, but it is included to help the client code navigate the node tree if it wants by providing bi-direction navigation up and down the tree.
     * If this is a problem (e.g. if you need to convert the tree to JSON, which does not allow cyclic dependencies) then set this to `true`.     */
    @Input() public suppressParentsInRowNodes: boolean | undefined = undefined;
    /** Disables touch support (but does not remove the browser's efforts to simulate mouse events on touch).     */
    @Input() public suppressTouch: boolean | undefined = undefined;
    /** Set to `true` to not set focus back on the grid after a refresh. This can avoid issues where you want to keep the focus on another part of the browser.     */
    @Input() public suppressFocusAfterRefresh: boolean | undefined = undefined;
    /** Disables the asynchronous nature of the events introduced in v10, and makes them synchronous. This property only exists for the purpose of supporting legacy code which has a dependency on synchronous events from earlier versions (v9 or earlier) of AG Grid.     **It is strongly recommended that you do not change this property unless you have legacy issues.**     */
    @Input() public suppressAsyncEvents: boolean | undefined = undefined;
    /** The grid will check for `ResizeObserver` and use it if it exists in the browser, otherwise it will use the grid's alternative implementation. Some users reported issues with Chrome's `ResizeObserver`. Use this property to always use the grid's alternative implementation should such problems exist.     */
    @Input() public suppressBrowserResizeObserver: boolean | undefined = undefined;
    /** Disables showing a warning message in the console if using a `gridOptions` or `colDef` property that doesn't exist.     */
    @Input() public suppressPropertyNamesCheck: boolean | undefined = undefined;
    /** Disables change detection.     */
    @Input() public suppressChangeDetection: boolean | undefined = undefined;
    /** Set this to `true` to enable debug information from the grid and related components. Will result in additional logging being output, but very useful when investigating problems.     */
    @Input() public debug: boolean | undefined = undefined;
    /** Provide a template for 'loading' overlay.     */
    @Input() public overlayLoadingTemplate: string | undefined = undefined;
    /** Provide a custom loading overlay component.     */
    @Input() public loadingOverlayComponent: { new(): ILoadingOverlayComp; } | string | undefined = undefined;
    /** Same as `loadingOverlayComponent` but for a framework component.     */
    @Input() public loadingOverlayComponentFramework: any = undefined;
    /** Customise the parameters provided to the loading overlay component.     */
    @Input() public loadingOverlayComponentParams: any = undefined;
    /** Disables the 'loading' overlay.     */
    @Input() public suppressLoadingOverlay: boolean | undefined = undefined;
    /** Provide a template for 'no rows' overlay.     */
    @Input() public overlayNoRowsTemplate: string | undefined = undefined;
    /** Provide a custom no rows overlay component     */
    @Input() public noRowsOverlayComponent: { new(): INoRowsOverlayComp; } | string | undefined = undefined;
    /** Same as `noRowsOverlayComponent` but for a framework component.     */
    @Input() public noRowsOverlayComponentFramework: any = undefined;
    /** Customise the parameters provided to the no rows overlay component.     */
    @Input() public noRowsOverlayComponentParams: any = undefined;
    /** Disables the 'no rows' overlay.     */
    @Input() public suppressNoRowsOverlay: boolean | undefined = undefined;
    /** Set whether pagination is enabled.     */
    @Input() public pagination: boolean | undefined = undefined;
    /** How many rows to load per page. If `paginationAutoPageSize` is specified, this property is ignored. Default: `100`     */
    @Input() public paginationPageSize: number | undefined = undefined;
    /** Set to `true` so that the number of rows to load per page is automatically adjusted by the grid so each page shows enough rows to just fill the area designated for the grid. If `false`, `paginationPageSize` is used.     */
    @Input() public paginationAutoPageSize: boolean | undefined = undefined;
    /** Set to `true` to have pages split children of groups when using Row Grouping or detail rows with Master Detail.     */
    @Input() public paginateChildRows: boolean | undefined = undefined;
    /** If `true`, the default grid controls for navigation are hidden.
     * This is useful if `pagination=true` and you want to provide your own pagination controls.
     * Otherwise, when `pagination=true` the grid automatically shows the necessary controls at the bottom so that the user can navigate through the different pages.     */
    @Input() public suppressPaginationPanel: boolean | undefined = undefined;
    /** Set to `true` to enable pivot mode.     */
    @Input() public pivotMode: boolean | undefined = undefined;
    /** When to show the 'pivot panel' (where you drag rows to pivot) at the top. Note that the pivot panel will never show if `pivotMode` is off.     */
    @Input() public pivotPanelShow: string | undefined = undefined;
    /** When set and the grid is in pivot mode, automatically calculated totals will appear within the Pivot Column Groups, in the position specified.     */
    @Input() public pivotColumnGroupTotals: string | undefined = undefined;
    /** When set and the grid is in pivot mode, automatically calculated totals will appear for each value column in the position specified.     */
    @Input() public pivotRowTotals: string | undefined = undefined;
    /** If `true`, the grid will not swap in the grouping column when pivoting. Useful if pivoting using Server Side Row Model or Viewport Row Model and you want full control of all columns including the group column.     */
    @Input() public pivotSuppressAutoColumn: boolean | undefined = undefined;
    /** When enabled, pivot column groups will appear 'fixed', without the ability to expand and collapse the column groups.     */
    @Input() public suppressExpandablePivotGroups: boolean | undefined = undefined;
    /** If `true`, then row group, pivot and value aggregation will be read-only from the GUI. The grid will display what values are used for each, but will not allow the user to change the selection.     */
    @Input() public functionsReadOnly: boolean | undefined = undefined;
    /** A map of 'function name' to 'function' for custom aggregation functions.     */
    @Input() public aggFuncs: { [key: string]: IAggFunc; } | undefined = undefined;
    /** When `true`, column headers won't include the `aggFunc` name, e.g. `'sum(Bank Balance)`' will just be `'Bank Balance'`.     */
    @Input() public suppressAggFuncInHeader: boolean | undefined = undefined;
    /** When `true`, the aggregations won't be computed for the root node of the grid.     */
    @Input() public suppressAggAtRootLevel: boolean | undefined = undefined;
    /** When using change detection, only the updated column will be re-aggregated.     */
    @Input() public aggregateOnlyChangedColumns: boolean | undefined = undefined;
    /** Set to `true` so that aggregations are not impacted by filtering.     */
    @Input() public suppressAggFilteredOnly: boolean | undefined = undefined;
    /** Set to `true` to enable Row Animation.     */
    @Input() public animateRows: boolean | undefined = undefined;
    /** Set to `true` to have cells flash after data changes.     */
    @Input() public enableCellChangeFlash: boolean | undefined = undefined;
    /** To be used in combination with `enableCellChangeFlash`, this configuration will set the delay in milliseconds of how long a cell should remain in its \"flashed\" state.
     * Default: `500`     */
    @Input() public cellFlashDelay: number | undefined = undefined;
    /** To be used in combination with `enableCellChangeFlash`, this configuration will set the delay in milliseconds of how long the \"flashed\" state animation takes to fade away after the timer set by `cellFlashDelay` has completed.
     * Default: `1000`     */
    @Input() public cellFadeDelay: number | undefined = undefined;
    /** Switch between layout options: `normal`, `autoHeight`, `print`.
     * Default: `normal`     */
    @Input() public domLayout: string | undefined = undefined;
    /** When `true`, the order of rows and columns in the DOM are consistent with what is on screen.     */
    @Input() public ensureDomOrder: boolean | undefined = undefined;
    /** Set to `true` to operate the grid in RTL (Right to Left) mode.     */
    @Input() public enableRtl: boolean | undefined = undefined;
    /** Set to `true` so that the grid doesn't virtualise the columns. For example, if you have 100 columns, but only 10 visible due to scrolling, all 100 will always be rendered.     */
    @Input() public suppressColumnVirtualisation: boolean | undefined = undefined;
    /** By default the grid has a limit of rendering a maximum of 500 rows at once (remember the grid only renders rows you can see, so unless your display shows more than 500 rows without vertically scrolling this will never be an issue).
     * <br />**This is only relevant if you are manually setting `rowBuffer` to a high value (rendering more rows than can be seen) or if your grid height is able to display more than 500 rows at once.**     */
    @Input() public suppressMaxRenderedRowRestriction: boolean | undefined = undefined;
    /** Set to `true` to enable Managed Row Dragging.     */
    @Input() public rowDragManaged: boolean | undefined = undefined;
    /** Set to `true` to suppress row dragging.     */
    @Input() public suppressRowDrag: boolean | undefined = undefined;
    /** Set to `true` to suppress moving rows while dragging the `rowDrag` waffle. This option highlights the position where the row will be placed and it will only move the row on mouse up.     */
    @Input() public suppressMoveWhenRowDragging: boolean | undefined = undefined;
    /** Set to `true` to enable clicking and dragging anywhere on the row without the need for a drag handle.     */
    @Input() public rowDragEntireRow: boolean | undefined = undefined;
    /** Set to `true` to enable dragging multiple rows at the same time.     */
    @Input() public rowDragMultiRow: boolean | undefined = undefined;
    /** Sets the Cell Renderer to use for full width rows.     */
    @Input() public fullWidthCellRenderer: { new(): ICellRendererComp; } | ICellRendererFunc | string | undefined = undefined;
    /** Same as `fullWidthCellRenderer` but for a framework component.     */
    @Input() public fullWidthCellRendererFramework: any = undefined;
    /** Customise the parameters provided to the `fullWidthCellRenderer` component.     */
    @Input() public fullWidthCellRendererParams: any = undefined;
    /** Set to `true` to have the detail grid embedded in the master grid's container and so link their horizontal scrolling.     */
    @Input() public embedFullWidthRows: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public deprecatedEmbedFullWidthRows: boolean | undefined = undefined;
    /** Specifies how the results of row grouping should be displayed.
     * 
     *   The options are:
     * 
     *       `'singleColumn'`: single group column automatically added by the grid.
     *       `'multipleColumns'`: a group column per row group is added automatically.
     *       `'groupRows'`: group rows are automatically added instead of group columns.
     *       `'custom'`: informs the grid that group columns will be provided.     */
    @Input() public groupDisplayType: RowGroupingDisplayType | undefined = undefined;
    /** If grouping, set to the number of levels to expand by default, e.g. `0` for none, `1` for first level only, etc. Set to `-1` to expand everything.     */
    @Input() public groupDefaultExpanded: number | undefined = undefined;
    /** Allows specifying the group 'auto column' if you are not happy with the default. If grouping, this column definition is included as the first column in the grid. If not grouping, this column is not included.     */
    @Input() public autoGroupColumnDef: ColDef | undefined = undefined;
    /** When `true`, preserves the current group order when sorting on non-group columns.     */
    @Input() public groupMaintainOrder: boolean | undefined = undefined;
    /** When `true`, if you select a group, the children of the group will also be selected.     */
    @Input() public groupSelectsChildren: boolean | undefined = undefined;
    /** If grouping, this controls whether to show a group footer when the group is expanded.
     * If `true`, then by default, the footer will contain aggregate data (if any) when shown and the header will be blank.
     * When closed, the header will contain the aggregate data regardless of this setting (as the footer is hidden anyway).
     * This is handy for 'total' rows, that are displayed below the data when the group is open, and alongside the group when it is closed.     */
    @Input() public groupIncludeFooter: boolean | undefined = undefined;
    /** Set to `true` to show a 'grand total' group footer across all groups.     */
    @Input() public groupIncludeTotalFooter: boolean | undefined = undefined;
    /** If `true`, and showing footer, aggregate data will always be displayed at both the header and footer levels. This stops the possibly undesirable behaviour of the header details 'jumping' to the footer on expand.     */
    @Input() public groupSuppressBlankHeader: boolean | undefined = undefined;
    /** If using `groupSelectsChildren`, then only the children that pass the current filter will get selected.     */
    @Input() public groupSelectsFiltered: boolean | undefined = undefined;
    /** Shows the open group in the group column for non-group rows.     */
    @Input() public showOpenedGroup: boolean | undefined = undefined;
    /** Set to `true` to collapse groups that only have one child.     */
    @Input() public groupRemoveSingleChildren: boolean | undefined = undefined;
    /** Set to `true` to collapse lowest level groups that only have one child.     */
    @Input() public groupRemoveLowestSingleChildren: boolean | undefined = undefined;
    /** Set to `true` to hide parents that are open. When used with multiple columns for showing groups, it can give a more pleasing user experience.     */
    @Input() public groupHideOpenParents: boolean | undefined = undefined;
    /** When to show the 'row group panel' (where you drag rows to group) at the top.     */
    @Input() public rowGroupPanelShow: string | undefined = undefined;
    /** Sets the Cell Renderer to use when `groupDisplayType = 'groupRows'`.     */
    @Input() public groupRowRenderer: { new(): ICellRendererComp; } | ICellRendererFunc | string | undefined = undefined;
    /** Same as `groupRowRenderer` but for a framework component.     */
    @Input() public groupRowRendererFramework: any = undefined;
    /** Customise the parameters provided to the `groupRowRenderer` component.     */
    @Input() public groupRowRendererParams: any = undefined;
    /** By default, when a column is un-grouped, i.e. using the Row Group Panel, it is made visible in the grid. This property stops the column becoming visible again when un-grouping.     */
    @Input() public suppressMakeColumnVisibleAfterUnGroup: boolean | undefined = undefined;
    /** Set to `true` to enable the Grid to work with Tree Data. You must also implement the `getDataPath(data)` callback.     */
    @Input() public treeData: boolean | undefined = undefined;
    /** @deprecated - this is now groupRowRendererParams.innerRenderer
     */
    @Input() public groupRowInnerRenderer: { new(): ICellRendererComp; } | ICellRendererFunc | string | undefined = undefined;
    /** @deprecated - this is now groupRowRendererParams.innerRendererFramework
     */
    @Input() public groupRowInnerRendererFramework: any = undefined;
    /** @deprecated - Use groupDisplayType = 'multipleColumns' instead
     */
    @Input() public groupMultiAutoColumn: boolean | undefined = undefined;
    /** @deprecated - Use groupDisplayType = 'groupRows' instead
     */
    @Input() public groupUseEntireRow: boolean | undefined = undefined;
    /** @deprecated - Use groupDisplayType = 'custom' instead
     */
    @Input() public groupSuppressAutoColumn: boolean | undefined = undefined;
    /** @deprecated - no longer needed, transaction updates keep group state
     */
    @Input() public rememberGroupStateWhenNewData: boolean | undefined = undefined;
    /** Data to be displayed as pinned top rows in the grid.     */
    @Input() public pinnedTopRowData: any[] | undefined = undefined;
    /** Data to be displayed as pinned bottom rows in the grid.     */
    @Input() public pinnedBottomRowData: any[] | undefined = undefined;
    /** Sets the row model type.     */
    @Input() public rowModelType: string | undefined = undefined;
    /** Set the data to be displayed as rows in the grid.     */
    @Input() public rowData: any[] | null | undefined = undefined;
    /** Enables Immutable Data mode, for compatibility with immutable stores.     */
    @Input() public immutableData: boolean | undefined = undefined;
    /** How many milliseconds to wait before executing a batch of async transactions.     */
    @Input() public asyncTransactionWaitMillis: number | undefined = undefined;
    /** Prevents Transactions changing sort, filter, group or pivot state when transaction only contains updates.     */
    @Input() public suppressModelUpdateAfterUpdateTransaction: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public deltaRowDataMode: boolean | undefined = undefined;
    /** @deprecated use asyncTransactionWaitMillis instead
     */
    @Input() public batchUpdateWaitMillis: number | undefined = undefined;
    /** Provide the datasource for infinite scrolling.     */
    @Input() public datasource: IDatasource | undefined = undefined;
    /** How many extra blank rows to display to the user at the end of the dataset, which sets the vertical scroll and then allows the grid to request viewing more rows of data.
     * Default: `1`     */
    @Input() public cacheOverflowSize: number | undefined = undefined;
    /** How many extra blank rows to display to the user at the end of the dataset, which sets the vertical scroll and then allows the grid to request viewing more rows of data.
     * Default: `1`     */
    @Input() public infiniteInitialRowCount: number | undefined = undefined;
    /** Whether to use Full Store or Partial Store for storing rows.     */
    @Input() public serverSideStoreType: ServerSideStoreType | undefined = undefined;
    /** How many rows for each block in the store, i.e. how many rows returned from the server at a time.
     * Default: `100`     */
    @Input() public cacheBlockSize: number | undefined = undefined;
    /** How many blocks to keep in the store. Default is no limit, so every requested block is kept. Use this if you have memory concerns, and blocks that were least recently viewed will be purged when the limit is hit. The grid will additionally make sure it has all the blocks needed to display what is currently visible, in case this property is set to a low value.     */
    @Input() public maxBlocksInCache: number | undefined = undefined;
    /** How many requests to hit the server with concurrently. If the max is reached, requests are queued.     */
    @Input() public maxConcurrentDatasourceRequests: number | undefined = undefined;
    /** How many milliseconds to wait before loading a block. Useful when scrolling over many rows, spanning many Partial Store blocks, as it prevents blocks loading until scrolling has settled.     */
    @Input() public blockLoadDebounceMillis: number | undefined = undefined;
    /** When enabled, closing group rows will remove children of that row. Next time the row is opened, child rows will be read from the datasource again. This property only applies when there is Row Grouping     */
    @Input() public purgeClosedRowNodes: boolean | undefined = undefined;
    /** Provide the `serverSideDatasource` for server side row model.     */
    @Input() public serverSideDatasource: IServerSideDatasource | undefined = undefined;
    /** When enabled, always refreshes top level groups regardless of which column was sorted. This property only applies when there is Row Grouping.     */
    @Input() public serverSideSortingAlwaysResets: boolean | undefined = undefined;
    /** When enabled, always refreshes stores after filter has changed. Used by Full Store only, to allow Server-Side Filtering.     */
    @Input() public serverSideFilteringAlwaysResets: boolean | undefined = undefined;
    /** @deprecated     */
    @Input() public suppressEnterpriseResetOnNewColumns: boolean | undefined = undefined;
    /** To use the viewport row model you need to provide the grid with a `viewportDatasource`.     */
    @Input() public viewportDatasource: IViewportDatasource | undefined = undefined;
    /** When using viewport row model, sets the page size for the viewport.     */
    @Input() public viewportRowModelPageSize: number | undefined = undefined;
    /** When using viewport row model, sets the buffer size for the viewport.     */
    @Input() public viewportRowModelBufferSize: number | undefined = undefined;
    /** Set to `true` to always show the horizontal scrollbar.     */
    @Input() public alwaysShowHorizontalScroll: boolean | undefined = undefined;
    /** Set to `true` to always show the vertical scrollbar.     */
    @Input() public alwaysShowVerticalScroll: boolean | undefined = undefined;
    /** Set to `true` to debounce the vertical scrollbar. Can provide smoother scrolling on older browsers, e.g. Internet Explorer.     */
    @Input() public debounceVerticalScrollbar: boolean | undefined = undefined;
    /** Set to `true` to never show the horizontal scroll. This is useful if the grid is aligned with another grid and will scroll when the other grid scrolls. (Should not be used in combination with `alwaysShowHorizontalScroll`.)     */
    @Input() public suppressHorizontalScroll: boolean | undefined = undefined;
    /** When `true`, the grid will not scroll to the top when new row data is provided. Use this if you don't want the default behaviour of scrolling to the top every time you load new data.     */
    @Input() public suppressScrollOnNewData: boolean | undefined = undefined;
    /** When `true`, the grid will not use animation frames when drawing rows while scrolling. Use this if the grid is working fast enough that you don't need animation frames and you don't want the grid to flicker.     */
    @Input() public suppressAnimationFrame: boolean | undefined = undefined;
    /** If `true`, middle clicks will result in `click` events for cells and rows. Otherwise the browser will use middle click to scroll the grid.<br />**Note:** Not all browsers fire `click` events with the middle button. Most will fire only `mousedown` and `mouseup` events, which can be used to focus a cell, but will not work to call the `onCellClicked` function.     */
    @Input() public suppressMiddleClickScrolls: boolean | undefined = undefined;
    /** If `true`, mouse wheel events will be passed to the browser. Useful if your grid has no vertical scrolls and you want the mouse to scroll the browser page.     */
    @Input() public suppressPreventDefaultOnMouseWheel: boolean | undefined = undefined;
    /** Tell the grid how wide in pixels the scrollbar is, which is used in grid width calculations. Set only if using non-standard browser-provided scrollbars, so the grid can use the non-standard size in its calculations.     */
    @Input() public scrollbarWidth: number | undefined = undefined;
    /** Type of Row Selection: `single`, `multiple`.     */
    @Input() public rowSelection: string | undefined = undefined;
    /** Set to `true` to allow multiple rows to be selected using single click.     */
    @Input() public rowMultiSelectWithClick: boolean | undefined = undefined;
    /** If `true`, rows will not be deselected if you hold down `Ctrl` and click the row or press `Space`.     */
    @Input() public suppressRowDeselection: boolean | undefined = undefined;
    /** If `true`, row selection won't happen when rows are clicked. Use when you only want checkbox selection.     */
    @Input() public suppressRowClickSelection: boolean | undefined = undefined;
    /** If `true`, cells won't be selectable. This means cells will not get keyboard focus when you click on them.     */
    @Input() public suppressCellSelection: boolean | undefined = undefined;
    /** If `true`, only a single range can be selected.     */
    @Input() public suppressMultiRangeSelection: boolean | undefined = undefined;
    /** Set to `true` to be able to select the text within cells.
     * 
     *     **Note:** When this is set to `true`, the clipboard service is disabled.     */
    @Input() public enableCellTextSelection: boolean | undefined = undefined;
    /** Set to `true` to enable Range Selection.     */
    @Input() public enableRangeSelection: boolean | undefined = undefined;
    /** Set to `true` to enable the Range Handle.     */
    @Input() public enableRangeHandle: boolean | undefined = undefined;
    /** Set to `true` to enable the Fill Handle.     */
    @Input() public enableFillHandle: boolean | undefined = undefined;
    /** Set to `'x'` to force the fill handle direction to horizontal, or set to `'y'` to force the fill handle direction to vertical.     */
    @Input() public fillHandleDirection: string | undefined = undefined;
    /** Set this to `true` to prevent cell values from being cleared when the Range Selection is reduced by the Fill Handle.     */
    @Input() public suppressClearOnFillReduction: boolean | undefined = undefined;
    /** Array defining the order in which sorting occurs (if sorting is enabled). Values can be `'asc'`, `'desc'` or `null`. For example: `sortingOrder: ['asc', 'desc']`.     */
    @Input() public sortingOrder: (string | null)[] | undefined = undefined;
    /** Set to `true` to specify that the sort should take accented characters into account. If this feature is turned on the sort will be slower.     */
    @Input() public accentedSort: boolean | undefined = undefined;
    /** Set to `true` to show the 'no sort' icon.     */
    @Input() public unSortIcon: boolean | undefined = undefined;
    /** Set to `true` to suppress multi-sort when the user shift-clicks a column header.     */
    @Input() public suppressMultiSort: boolean | undefined = undefined;
    /** Set to `'ctrl'` to have multi sorting work using the `Ctrl` (or `Command ⌘` for Mac) key.     */
    @Input() public multiSortKey: string | undefined = undefined;
    /** Set to `true` to suppress sorting of un-sorted data to match original row data.     */
    @Input() public suppressMaintainUnsortedOrder: boolean | undefined = undefined;
    /** Icons to use inside the grid instead of the grid's default icons.     */
    @Input() public icons: { [key: string]: Function | string; } | undefined = undefined;
    /** Default row height in pixels.     */
    @Input() public rowHeight: number | undefined = undefined;
    /** The style properties to apply to all rows. Set to an object of key (style names) and values (style values)     */
    @Input() public rowStyle: { [cssProperty: string]: string } | undefined = undefined;
    /** CSS class(es) for all rows. Provide either a string (class name) or array of strings (array of class names).     */
    @Input() public rowClass: string | string[] | undefined = undefined;
    /** Rules which can be applied to include certain CSS classes.     */
    @Input() public rowClassRules: RowClassRules | undefined = undefined;
    /** Set to `true` to not highlight rows by adding the `ag-row-hover` CSS class.     */
    @Input() public suppressRowHoverHighlight: boolean | undefined = undefined;
    /** Uses CSS `top` instead of CSS `transform` for positioning rows. Useful if the transform function is causing issues such as used in row spanning.     */
    @Input() public suppressRowTransform: boolean | undefined = undefined;
    /** Set to `true` to highlight columns by adding the `ag-column-hover` CSS class.     */
    @Input() public columnHoverHighlight: boolean | undefined = undefined;
    @Input() public deltaSort: boolean | undefined = undefined;
    @Input() public treeDataDisplayType: TreeDataDisplayType | undefined = undefined;
    @Input() public angularCompileRows: boolean | undefined = undefined;
    @Input() public angularCompileFilters: boolean | undefined = undefined;
    @Input() public functionsPassive: boolean | undefined = undefined;
    @Input() public enableGroupEdit: boolean | undefined = undefined;
    @Input() public getContextMenuItems: GetContextMenuItems | undefined = undefined;
    @Input() public getMainMenuItems: GetMainMenuItems | undefined = undefined;
    @Input() public postProcessPopup: ((params: PostProcessPopupParams) => void) | undefined = undefined;
    @Input() public processCellForClipboard: ((params: ProcessCellForExportParams) =>  any) | undefined = undefined;
    @Input() public processHeaderForClipboard: ((params: ProcessHeaderForExportParams) =>  any) | undefined = undefined;
    @Input() public processCellFromClipboard: ((params: ProcessCellForExportParams) =>  any) | undefined = undefined;
    @Input() public sendToClipboard: ((params: SendToClipboardParams) => void) | undefined = undefined;
    @Input() public processDataFromClipboard: ((params: ProcessDataFromClipboardParams) => string[][] | null) | undefined = undefined;
    @Input() public isExternalFilterPresent: (() =>  boolean) | undefined = undefined;
    @Input() public doesExternalFilterPass: ((node: RowNode) =>  boolean) | undefined = undefined;
    @Input() public getChartToolbarItems: GetChartToolbarItems | undefined = undefined;
    @Input() public createChartContainer: ((params: ChartRef) => void) | undefined = undefined;
    @Input() public navigateToNextHeader: ((params: NavigateToNextHeaderParams) => HeaderPosition) | undefined = undefined;
    @Input() public tabToNextHeader: ((params: TabToNextHeaderParams) => HeaderPosition) | undefined = undefined;
    @Input() public navigateToNextCell: ((params: NavigateToNextCellParams) => CellPosition) | undefined = undefined;
    @Input() public tabToNextCell: ((params: TabToNextCellParams) => CellPosition) | undefined = undefined;
    /** Allows user to suppress certain keyboard events     */
    @Input() public suppressKeyboardEvent: ((params: SuppressKeyboardEventParams) => boolean) | undefined = undefined;
    /** A callback for localising text within the grid.     */
    @Input() public localeTextFunc: ((key: string, defaultValue: string) => string) | undefined = undefined;
    @Input() public getDocument: (() => Document) | undefined = undefined;
    @Input() public paginationNumberFormatter: ((params: PaginationNumberFormatterParams) => string) | undefined = undefined;
    @Input() public groupRowAggNodes: ((nodes: RowNode[]) =>  any) | undefined = undefined;
    @Input() public isGroupOpenByDefault: ((params: IsGroupOpenByDefaultParams) => boolean) | undefined = undefined;
    @Input() public defaultGroupOrderComparator: ((nodeA: RowNode, nodeB: RowNode) => number) | undefined = undefined;
    @Input() public processSecondaryColDef: ((colDef: ColDef) =>  void) | undefined = undefined;
    @Input() public processSecondaryColGroupDef: ((colGroupDef: ColGroupDef) =>  void) | undefined = undefined;
    @Input() public getDataPath: GetDataPath | undefined = undefined;
    /** @deprecated - Use defaultGroupOrderComparator instead
     */
    @Input() public defaultGroupSortComparator: ((nodeA: RowNode, nodeB: RowNode) => number) | undefined = undefined;
    @Input() public getChildCount: ((dataItem: any) =>  number) | undefined = undefined;
    @Input() public getServerSideStoreParams: ((params: GetServerSideStoreParamsParams) => ServerSideStoreParams) | undefined = undefined;
    @Input() public isServerSideGroupOpenByDefault: ((params: IsServerSideGroupOpenByDefaultParams) => boolean) | undefined = undefined;
    @Input() public isApplyServerSideTransaction: IsApplyServerSideTransaction | undefined = undefined;
    @Input() public isServerSideGroup: IsServerSideGroup | undefined = undefined;
    @Input() public getServerSideGroupKey: GetServerSideGroupKey | undefined = undefined;
    @Input() public getBusinessKeyForNode: ((node: RowNode) =>  string) | undefined = undefined;
    @Input() public getRowNodeId: GetRowNodeIdFunc | undefined = undefined;
    @Input() public processRowPostCreate: ((params: ProcessRowParams) =>  void) | undefined = undefined;
    @Input() public isRowSelectable: IsRowSelectable | undefined = undefined;
    @Input() public isRowMaster: IsRowMaster | undefined = undefined;
    @Input() public fillOperation: ((params: FillOperationParams) => any) | undefined = undefined;
    @Input() public postSort: ((nodes: RowNode[]) =>  void) | undefined = undefined;
    @Input() public getRowStyle: ((params: RowClassParams) => { [cssProperty: string]: string }) | undefined = undefined;
    @Input() public getRowClass: ((params: RowClassParams) => string | string[] | undefined) | undefined = undefined;
    @Input() public getRowHeight: ((params: RowHeightParams) => number | undefined | null) | undefined = undefined;
    @Input() public isFullWidthCell: ((rowNode: RowNode) =>  boolean) | undefined = undefined;

    @Output() public columnEverythingChanged: EventEmitter<ColumnEverythingChangedEvent> = new EventEmitter<ColumnEverythingChangedEvent>();
    @Output() public newColumnsLoaded: EventEmitter<NewColumnsLoadedEvent> = new EventEmitter<NewColumnsLoadedEvent>();
    @Output() public columnPivotModeChanged: EventEmitter<ColumnPivotModeChangedEvent> = new EventEmitter<ColumnPivotModeChangedEvent>();
    @Output() public columnRowGroupChanged: EventEmitter<ColumnRowGroupChangedEvent> = new EventEmitter<ColumnRowGroupChangedEvent>();
    @Output() public expandOrCollapseAll: EventEmitter<ExpandCollapseAllEvent> = new EventEmitter<ExpandCollapseAllEvent>();
    @Output() public columnPivotChanged: EventEmitter<ColumnPivotChangedEvent> = new EventEmitter<ColumnPivotChangedEvent>();
    @Output() public gridColumnsChanged: EventEmitter<GridColumnsChangedEvent> = new EventEmitter<GridColumnsChangedEvent>();
    @Output() public columnValueChanged: EventEmitter<ColumnValueChangedEvent> = new EventEmitter<ColumnValueChangedEvent>();
    @Output() public columnMoved: EventEmitter<ColumnMovedEvent> = new EventEmitter<ColumnMovedEvent>();
    @Output() public columnVisible: EventEmitter<ColumnVisibleEvent> = new EventEmitter<ColumnVisibleEvent>();
    @Output() public columnPinned: EventEmitter<ColumnPinnedEvent> = new EventEmitter<ColumnPinnedEvent>();
    @Output() public columnGroupOpened: EventEmitter<ColumnGroupOpenedEvent> = new EventEmitter<ColumnGroupOpenedEvent>();
    @Output() public columnResized: EventEmitter<ColumnResizedEvent> = new EventEmitter<ColumnResizedEvent>();
    @Output() public displayedColumnsChanged: EventEmitter<DisplayedColumnsChangedEvent> = new EventEmitter<DisplayedColumnsChangedEvent>();
    @Output() public virtualColumnsChanged: EventEmitter<VirtualColumnsChangedEvent> = new EventEmitter<VirtualColumnsChangedEvent>();
    @Output() public asyncTransactionsFlushed: EventEmitter<AsyncTransactionsFlushed> = new EventEmitter<AsyncTransactionsFlushed>();
    @Output() public rowGroupOpened: EventEmitter<RowGroupOpenedEvent> = new EventEmitter<RowGroupOpenedEvent>();
    @Output() public rowDataChanged: EventEmitter<RowDataChangedEvent> = new EventEmitter<RowDataChangedEvent>();
    @Output() public rowDataUpdated: EventEmitter<RowDataUpdatedEvent> = new EventEmitter<RowDataUpdatedEvent>();
    @Output() public pinnedRowDataChanged: EventEmitter<PinnedRowDataChangedEvent> = new EventEmitter<PinnedRowDataChangedEvent>();
    @Output() public rangeSelectionChanged: EventEmitter<RangeSelectionChangedEvent> = new EventEmitter<RangeSelectionChangedEvent>();
    @Output() public chartCreated: EventEmitter<ChartCreated> = new EventEmitter<ChartCreated>();
    @Output() public chartRangeSelectionChanged: EventEmitter<ChartRangeSelectionChanged> = new EventEmitter<ChartRangeSelectionChanged>();
    @Output() public chartOptionsChanged: EventEmitter<ChartOptionsChanged> = new EventEmitter<ChartOptionsChanged>();
    @Output() public chartDestroyed: EventEmitter<ChartDestroyed> = new EventEmitter<ChartDestroyed>();
    @Output() public toolPanelVisibleChanged: EventEmitter<ToolPanelVisibleChangedEvent> = new EventEmitter<ToolPanelVisibleChangedEvent>();
    @Output() public modelUpdated: EventEmitter<ModelUpdatedEvent> = new EventEmitter<ModelUpdatedEvent>();
    @Output() public pasteStart: EventEmitter<PasteStartEvent> = new EventEmitter<PasteStartEvent>();
    @Output() public pasteEnd: EventEmitter<PasteEndEvent> = new EventEmitter<PasteEndEvent>();
    @Output() public cellClicked: EventEmitter<CellClickedEvent> = new EventEmitter<CellClickedEvent>();
    @Output() public cellDoubleClicked: EventEmitter<CellDoubleClickedEvent> = new EventEmitter<CellDoubleClickedEvent>();
    @Output() public cellMouseDown: EventEmitter<CellMouseDownEvent> = new EventEmitter<CellMouseDownEvent>();
    @Output() public cellContextMenu: EventEmitter<CellContextMenuEvent> = new EventEmitter<CellContextMenuEvent>();
    @Output() public cellValueChanged: EventEmitter<CellValueChangedEvent> = new EventEmitter<CellValueChangedEvent>();
    @Output() public rowValueChanged: EventEmitter<RowValueChangedEvent> = new EventEmitter<RowValueChangedEvent>();
    @Output() public cellFocused: EventEmitter<CellFocusedEvent> = new EventEmitter<CellFocusedEvent>();
    @Output() public rowSelected: EventEmitter<RowSelectedEvent> = new EventEmitter<RowSelectedEvent>();
    @Output() public selectionChanged: EventEmitter<SelectionChangedEvent> = new EventEmitter<SelectionChangedEvent>();
    @Output() public cellKeyDown: EventEmitter<CellKeyDownEvent | FullWidthCellKeyDownEvent> = new EventEmitter<CellKeyDownEvent | FullWidthCellKeyDownEvent>();
    @Output() public cellKeyPress: EventEmitter<CellKeyPressEvent | FullWidthCellKeyPressEvent> = new EventEmitter<CellKeyPressEvent | FullWidthCellKeyPressEvent>();
    @Output() public cellMouseOver: EventEmitter<CellMouseOverEvent> = new EventEmitter<CellMouseOverEvent>();
    @Output() public cellMouseOut: EventEmitter<CellMouseOutEvent> = new EventEmitter<CellMouseOutEvent>();
    @Output() public filterChanged: EventEmitter<FilterChangedEvent> = new EventEmitter<FilterChangedEvent>();
    @Output() public filterModified: EventEmitter<FilterModifiedEvent> = new EventEmitter<FilterModifiedEvent>();
    @Output() public filterOpened: EventEmitter<FilterOpenedEvent> = new EventEmitter<FilterOpenedEvent>();
    @Output() public sortChanged: EventEmitter<SortChangedEvent> = new EventEmitter<SortChangedEvent>();
    @Output() public virtualRowRemoved: EventEmitter<VirtualRowRemovedEvent> = new EventEmitter<VirtualRowRemovedEvent>();
    @Output() public rowClicked: EventEmitter<RowClickedEvent> = new EventEmitter<RowClickedEvent>();
    @Output() public rowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();
    @Output() public gridReady: EventEmitter<GridReadyEvent> = new EventEmitter<GridReadyEvent>();
    @Output() public gridSizeChanged: EventEmitter<GridSizeChangedEvent> = new EventEmitter<GridSizeChangedEvent>();
    @Output() public viewportChanged: EventEmitter<ViewportChangedEvent> = new EventEmitter<ViewportChangedEvent>();
    @Output() public firstDataRendered: EventEmitter<FirstDataRenderedEvent> = new EventEmitter<FirstDataRenderedEvent>();
    @Output() public dragStarted: EventEmitter<DragStartedEvent> = new EventEmitter<DragStartedEvent>();
    @Output() public dragStopped: EventEmitter<DragStoppedEvent> = new EventEmitter<DragStoppedEvent>();
    @Output() public rowEditingStarted: EventEmitter<RowEditingStartedEvent> = new EventEmitter<RowEditingStartedEvent>();
    @Output() public rowEditingStopped: EventEmitter<RowEditingStoppedEvent> = new EventEmitter<RowEditingStoppedEvent>();
    @Output() public cellEditingStarted: EventEmitter<CellEditingStartedEvent> = new EventEmitter<CellEditingStartedEvent>();
    @Output() public cellEditingStopped: EventEmitter<CellEditingStoppedEvent> = new EventEmitter<CellEditingStoppedEvent>();
    @Output() public bodyScroll: EventEmitter<BodyScrollEvent> = new EventEmitter<BodyScrollEvent>();
    @Output() public paginationChanged: EventEmitter<PaginationChangedEvent> = new EventEmitter<PaginationChangedEvent>();
    @Output() public componentStateChanged: EventEmitter<ComponentStateChangedEvent> = new EventEmitter<ComponentStateChangedEvent>();
    @Output() public rowDragEnter: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>();
    @Output() public rowDragMove: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>();
    @Output() public rowDragLeave: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>();
    @Output() public rowDragEnd: EventEmitter<RowDragEvent> = new EventEmitter<RowDragEvent>();
    @Output() public columnRowGroupChangeRequest: EventEmitter<ColumnRowGroupChangeRequestEvent> = new EventEmitter<ColumnRowGroupChangeRequestEvent>();
    @Output() public columnPivotChangeRequest: EventEmitter<ColumnPivotChangeRequestEvent> = new EventEmitter<ColumnPivotChangeRequestEvent>();
    @Output() public columnValueChangeRequest: EventEmitter<ColumnValueChangeRequestEvent> = new EventEmitter<ColumnValueChangeRequestEvent>();
    @Output() public columnAggFuncChangeRequest: EventEmitter<ColumnAggFuncChangeRequestEvent> = new EventEmitter<ColumnAggFuncChangeRequestEvent>();

    // Enable type coercion for boolean Inputs to support use like 'enableCharts' instead of forcing '[enableCharts]="true"' 
    // https://angular.io/guide/template-typecheck#input-setter-coercion 
    static ngAcceptInputType_suppressMakeColumnVisibleAfterUnGroup: boolean | null | '';
    static ngAcceptInputType_suppressRowClickSelection: boolean | null | '';
    static ngAcceptInputType_suppressCellSelection: boolean | null | '';
    static ngAcceptInputType_suppressHorizontalScroll: boolean | null | '';
    static ngAcceptInputType_alwaysShowHorizontalScroll: boolean | null | '';
    static ngAcceptInputType_alwaysShowVerticalScroll: boolean | null | '';
    static ngAcceptInputType_debug: boolean | null | '';
    static ngAcceptInputType_enableBrowserTooltips: boolean | null | '';
    static ngAcceptInputType_enableCellExpressions: boolean | null | '';
    static ngAcceptInputType_angularCompileRows: boolean | null | '';
    static ngAcceptInputType_angularCompileFilters: boolean | null | '';
    static ngAcceptInputType_groupSuppressAutoColumn: boolean | null | '';
    static ngAcceptInputType_groupSelectsChildren: boolean | null | '';
    static ngAcceptInputType_groupIncludeFooter: boolean | null | '';
    static ngAcceptInputType_groupIncludeTotalFooter: boolean | null | '';
    static ngAcceptInputType_groupUseEntireRow: boolean | null | '';
    static ngAcceptInputType_groupSuppressBlankHeader: boolean | null | '';
    static ngAcceptInputType_suppressMenuHide: boolean | null | '';
    static ngAcceptInputType_suppressRowDeselection: boolean | null | '';
    static ngAcceptInputType_unSortIcon: boolean | null | '';
    static ngAcceptInputType_suppressMultiSort: boolean | null | '';
    static ngAcceptInputType_singleClickEdit: boolean | null | '';
    static ngAcceptInputType_suppressLoadingOverlay: boolean | null | '';
    static ngAcceptInputType_suppressNoRowsOverlay: boolean | null | '';
    static ngAcceptInputType_suppressAutoSize: boolean | null | '';
    static ngAcceptInputType_skipHeaderOnAutoSize: boolean | null | '';
    static ngAcceptInputType_suppressParentsInRowNodes: boolean | null | '';
    static ngAcceptInputType_suppressColumnMoveAnimation: boolean | null | '';
    static ngAcceptInputType_suppressMovableColumns: boolean | null | '';
    static ngAcceptInputType_suppressFieldDotNotation: boolean | null | '';
    static ngAcceptInputType_enableRangeSelection: boolean | null | '';
    static ngAcceptInputType_enableRangeHandle: boolean | null | '';
    static ngAcceptInputType_enableFillHandle: boolean | null | '';
    static ngAcceptInputType_suppressClearOnFillReduction: boolean | null | '';
    static ngAcceptInputType_deltaSort: boolean | null | '';
    static ngAcceptInputType_suppressTouch: boolean | null | '';
    static ngAcceptInputType_suppressAsyncEvents: boolean | null | '';
    static ngAcceptInputType_allowContextMenuWithControlKey: boolean | null | '';
    static ngAcceptInputType_suppressContextMenu: boolean | null | '';
    static ngAcceptInputType_rememberGroupStateWhenNewData: boolean | null | '';
    static ngAcceptInputType_enableCellChangeFlash: boolean | null | '';
    static ngAcceptInputType_suppressDragLeaveHidesColumns: boolean | null | '';
    static ngAcceptInputType_suppressMiddleClickScrolls: boolean | null | '';
    static ngAcceptInputType_suppressPreventDefaultOnMouseWheel: boolean | null | '';
    static ngAcceptInputType_suppressCopyRowsToClipboard: boolean | null | '';
    static ngAcceptInputType_copyHeadersToClipboard: boolean | null | '';
    static ngAcceptInputType_pivotMode: boolean | null | '';
    static ngAcceptInputType_suppressAggFuncInHeader: boolean | null | '';
    static ngAcceptInputType_suppressColumnVirtualisation: boolean | null | '';
    static ngAcceptInputType_suppressAggAtRootLevel: boolean | null | '';
    static ngAcceptInputType_suppressFocusAfterRefresh: boolean | null | '';
    static ngAcceptInputType_functionsPassive: boolean | null | '';
    static ngAcceptInputType_functionsReadOnly: boolean | null | '';
    static ngAcceptInputType_animateRows: boolean | null | '';
    static ngAcceptInputType_groupSelectsFiltered: boolean | null | '';
    static ngAcceptInputType_groupRemoveSingleChildren: boolean | null | '';
    static ngAcceptInputType_groupRemoveLowestSingleChildren: boolean | null | '';
    static ngAcceptInputType_enableRtl: boolean | null | '';
    static ngAcceptInputType_suppressClickEdit: boolean | null | '';
    static ngAcceptInputType_rowDragEntireRow: boolean | null | '';
    static ngAcceptInputType_rowDragManaged: boolean | null | '';
    static ngAcceptInputType_suppressRowDrag: boolean | null | '';
    static ngAcceptInputType_suppressMoveWhenRowDragging: boolean | null | '';
    static ngAcceptInputType_rowDragMultiRow: boolean | null | '';
    static ngAcceptInputType_enableGroupEdit: boolean | null | '';
    static ngAcceptInputType_embedFullWidthRows: boolean | null | '';
    static ngAcceptInputType_deprecatedEmbedFullWidthRows: boolean | null | '';
    static ngAcceptInputType_suppressPaginationPanel: boolean | null | '';
    static ngAcceptInputType_floatingFilter: boolean | null | '';
    static ngAcceptInputType_groupHideOpenParents: boolean | null | '';
    static ngAcceptInputType_groupMultiAutoColumn: boolean | null | '';
    static ngAcceptInputType_pagination: boolean | null | '';
    static ngAcceptInputType_stopEditingWhenGridLosesFocus: boolean | null | '';
    static ngAcceptInputType_paginationAutoPageSize: boolean | null | '';
    static ngAcceptInputType_suppressScrollOnNewData: boolean | null | '';
    static ngAcceptInputType_purgeClosedRowNodes: boolean | null | '';
    static ngAcceptInputType_cacheQuickFilter: boolean | null | '';
    static ngAcceptInputType_deltaRowDataMode: boolean | null | '';
    static ngAcceptInputType_ensureDomOrder: boolean | null | '';
    static ngAcceptInputType_accentedSort: boolean | null | '';
    static ngAcceptInputType_suppressChangeDetection: boolean | null | '';
    static ngAcceptInputType_valueCache: boolean | null | '';
    static ngAcceptInputType_valueCacheNeverExpires: boolean | null | '';
    static ngAcceptInputType_aggregateOnlyChangedColumns: boolean | null | '';
    static ngAcceptInputType_suppressAnimationFrame: boolean | null | '';
    static ngAcceptInputType_suppressExcelExport: boolean | null | '';
    static ngAcceptInputType_suppressCsvExport: boolean | null | '';
    static ngAcceptInputType_treeData: boolean | null | '';
    static ngAcceptInputType_masterDetail: boolean | null | '';
    static ngAcceptInputType_suppressMultiRangeSelection: boolean | null | '';
    static ngAcceptInputType_enterMovesDownAfterEdit: boolean | null | '';
    static ngAcceptInputType_enterMovesDown: boolean | null | '';
    static ngAcceptInputType_suppressPropertyNamesCheck: boolean | null | '';
    static ngAcceptInputType_rowMultiSelectWithClick: boolean | null | '';
    static ngAcceptInputType_suppressEnterpriseResetOnNewColumns: boolean | null | '';
    static ngAcceptInputType_enableOldSetFilterModel: boolean | null | '';
    static ngAcceptInputType_suppressRowHoverHighlight: boolean | null | '';
    static ngAcceptInputType_suppressRowTransform: boolean | null | '';
    static ngAcceptInputType_suppressClipboardPaste: boolean | null | '';
    static ngAcceptInputType_suppressLastEmptyLineOnPaste: boolean | null | '';
    static ngAcceptInputType_serverSideSortingAlwaysResets: boolean | null | '';
    static ngAcceptInputType_suppressSetColumnStateEvents: boolean | null | '';
    static ngAcceptInputType_suppressColumnStateEvents: boolean | null | '';
    static ngAcceptInputType_enableCharts: boolean | null | '';
    static ngAcceptInputType_deltaColumnMode: boolean | null | '';
    static ngAcceptInputType_suppressMaintainUnsortedOrder: boolean | null | '';
    static ngAcceptInputType_enableCellTextSelection: boolean | null | '';
    static ngAcceptInputType_suppressBrowserResizeObserver: boolean | null | '';
    static ngAcceptInputType_suppressMaxRenderedRowRestriction: boolean | null | '';
    static ngAcceptInputType_excludeChildrenWhenTreeDataFiltering: boolean | null | '';
    static ngAcceptInputType_tooltipMouseTrack: boolean | null | '';
    static ngAcceptInputType_keepDetailRows: boolean | null | '';
    static ngAcceptInputType_paginateChildRows: boolean | null | '';
    static ngAcceptInputType_preventDefaultOnContextMenu: boolean | null | '';
    static ngAcceptInputType_undoRedoCellEditing: boolean | null | '';
    static ngAcceptInputType_allowDragFromColumnsToolPanel: boolean | null | '';
    static ngAcceptInputType_immutableData: boolean | null | '';
    static ngAcceptInputType_immutableColumns: boolean | null | '';
    static ngAcceptInputType_pivotSuppressAutoColumn: boolean | null | '';
    static ngAcceptInputType_suppressExpandablePivotGroups: boolean | null | '';
    static ngAcceptInputType_applyColumnDefOrder: boolean | null | '';
    static ngAcceptInputType_debounceVerticalScrollbar: boolean | null | '';
    static ngAcceptInputType_detailRowAutoHeight: boolean | null | '';
    static ngAcceptInputType_serverSideFilteringAlwaysResets: boolean | null | '';
    static ngAcceptInputType_suppressAggFilteredOnly: boolean | null | '';
    static ngAcceptInputType_showOpenedGroup: boolean | null | '';
    static ngAcceptInputType_suppressClipboardApi: boolean | null | '';
    static ngAcceptInputType_suppressModelUpdateAfterUpdateTransaction: boolean | null | '';
    static ngAcceptInputType_stopEditingWhenCellsLoseFocus: boolean | null | '';
    static ngAcceptInputType_maintainColumnOrder: boolean | null | '';
    static ngAcceptInputType_groupMaintainOrder: boolean | null | '';
    static ngAcceptInputType_columnHoverHighlight: boolean | null | '';
    static ngAcceptInputType_allowProcessChartOptions: boolean | null | '';
    // @END@
}

