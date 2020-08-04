import { Autowired, Bean } from "./context/context";
import { BeanStub } from "./context/beanStub";
import { Constants } from "./constants/constants";
import { ColumnController } from "./columnController/columnController";
import { IRowModel } from "./interfaces/iRowModel";
import { CellPosition } from "./entities/cellPosition";
import { GridOptionsWrapper } from "./gridOptionsWrapper";
import { RowNode } from "./entities/rowNode";
import { Column } from "./entities/column";
import { RowPosition } from "./entities/rowPosition";
import { PinnedRowModel } from "./pinnedRowModel/pinnedRowModel";
import { missing } from "./utils/generic";
import { last } from "./utils/array";
import { KeyCode } from './constants/keyCode';
import { PaginationProxy } from "./pagination/paginationProxy";

@Bean('cellNavigationService')
export class CellNavigationService extends BeanStub {

    @Autowired('columnController') private columnController: ColumnController;
    @Autowired('rowModel') private rowModel: IRowModel;
    @Autowired('pinnedRowModel') private pinnedRowModel: PinnedRowModel;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired('paginationProxy') private paginationProxy: PaginationProxy;

    // returns null if no cell to focus on, ie at the end of the grid
    public getNextCellToFocus(key: any, lastCellToFocus: CellPosition): CellPosition | null {

        // starting with the provided cell, we keep moving until we find a cell we can
        // focus on.
        let pointer: CellPosition | null = lastCellToFocus;
        let finished = false;

        // finished will be true when either:
        // a) cell found that we can focus on
        // b) run out of cells (ie the method returns null)
        while (!finished) {

            switch (key) {
                case KeyCode.UP:
                    pointer = this.getCellAbove(pointer);
                    break;
                case KeyCode.DOWN:
                    pointer = this.getCellBelow(pointer);
                    break;
                case KeyCode.RIGHT:
                    if (this.gridOptionsWrapper.isEnableRtl()) {
                        pointer = this.getCellToLeft(pointer);
                    } else {
                        pointer = this.getCellToRight(pointer);
                    }
                    break;
                case KeyCode.LEFT:
                    if (this.gridOptionsWrapper.isEnableRtl()) {
                        pointer = this.getCellToRight(pointer);
                    } else {
                        pointer = this.getCellToLeft(pointer);
                    }
                    break;
                default:
                    pointer = null;
                    console.warn('ag-Grid: unknown key for navigation ' + key);
                    break;
            }

            if (pointer) {
                finished = this.isCellGoodToFocusOn(pointer);
            } else {
                finished = true;
            }
        }

        return pointer;
    }

    private isCellGoodToFocusOn(gridCell: CellPosition): boolean {
        const column: Column = gridCell.column;
        let rowNode: RowNode;

        switch (gridCell.rowPinned) {
            case Constants.PINNED_TOP:
                rowNode = this.pinnedRowModel.getPinnedTopRow(gridCell.rowIndex);
                break;
            case Constants.PINNED_BOTTOM:
                rowNode = this.pinnedRowModel.getPinnedBottomRow(gridCell.rowIndex);
                break;
            default:
                rowNode = this.rowModel.getRow(gridCell.rowIndex);
                break;
        }

        const suppressNavigable = column.isSuppressNavigable(rowNode);
        return !suppressNavigable;
    }

    private getCellToLeft(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) { return null; }

        const colToLeft = this.columnController.getDisplayedColBefore(lastCell.column);
        if (!colToLeft) { return null; }

        return {
            rowIndex: lastCell.rowIndex,
            column: colToLeft,
            rowPinned: lastCell.rowPinned
        } as CellPosition;
    }

    private getCellToRight(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) { return null; }

        const colToRight = this.columnController.getDisplayedColAfter(lastCell.column);
        // if already on right, do nothing
        if (!colToRight) { return null; }

        return {
            rowIndex: lastCell.rowIndex,
            column: colToRight,
            rowPinned: lastCell.rowPinned
        } as CellPosition;
    }

    public getRowBelow(rowPosition: RowPosition): RowPosition | null {
        // if already on top row, do nothing
        const index = rowPosition.rowIndex;
        const pinned = rowPosition.rowPinned;
        if (this.isLastRowInContainer(rowPosition)) {
            switch (pinned) {
                case Constants.PINNED_BOTTOM:
                    // never any rows after pinned bottom
                    return null;
                case Constants.PINNED_TOP:
                    // if on last row of pinned top, then next row is main body (if rows exist),
                    // otherwise it's the pinned bottom
                    if (this.rowModel.isRowsToRender()) {
                        return { rowIndex: 0, rowPinned: null } as RowPosition;
                    }

                    if (this.pinnedRowModel.isRowsToRender(Constants.PINNED_BOTTOM)) {
                        return { rowIndex: 0, rowPinned: Constants.PINNED_BOTTOM } as RowPosition;
                    }

                    return null;
                default:
                    // if in the main body, then try pinned bottom, otherwise return nothing
                    if (this.pinnedRowModel.isRowsToRender(Constants.PINNED_BOTTOM)) {
                        return { rowIndex: 0, rowPinned: Constants.PINNED_BOTTOM } as RowPosition;
                    }
                    return null;
            }
        }

        return { rowIndex: index + 1, rowPinned: pinned } as RowPosition;
    }

    private getCellBelow(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) { return null; }

        const rowBelow = this.getRowBelow(lastCell);
        if (rowBelow) {
            return {
                rowIndex: rowBelow.rowIndex,
                column: lastCell.column,
                rowPinned: rowBelow.rowPinned
            } as CellPosition;
        }

        return null;
    }

    private isLastRowInContainer(rowPosition: RowPosition): boolean {
        const pinned = rowPosition.rowPinned;
        const index = rowPosition.rowIndex;

        if (pinned === Constants.PINNED_TOP) {
            const lastTopIndex = this.pinnedRowModel.getPinnedTopRowData().length - 1;
            return lastTopIndex <= index;
        }

        if (pinned === Constants.PINNED_BOTTOM) {
            const lastBottomIndex = this.pinnedRowModel.getPinnedBottomRowData().length - 1;
            return lastBottomIndex <= index;
        }

        const lastBodyIndex = this.paginationProxy.getPageLastRow();
        return lastBodyIndex <= index;
    }

    public getRowAbove(rowPosition: RowPosition): RowPosition | null {
        // if already on top row, do nothing
        const index = rowPosition.rowIndex;
        const pinned = rowPosition.rowPinned;
        const isFirstRow = index === 0 || !pinned && index === this.paginationProxy.getPageFirstRow();

        // if already on top row, do nothing
        if (isFirstRow) {
            if (pinned === Constants.PINNED_TOP) { return null; }

            if (!pinned) {
                if (this.pinnedRowModel.isRowsToRender(Constants.PINNED_TOP)) {
                    return this.getLastFloatingTopRow();
                }
                return null;
            }

            // last floating bottom
            if (this.rowModel.isRowsToRender()) {
                return this.getLastBodyCell();
            }

            if (this.pinnedRowModel.isRowsToRender(Constants.PINNED_TOP)) {
                return this.getLastFloatingTopRow();
            }

            return null;
        }

        return { rowIndex: index - 1, rowPinned: pinned } as RowPosition;
    }

    private getCellAbove(lastCell: CellPosition | null): CellPosition | null {
        if (!lastCell) { return null; }

        const rowAbove = this.getRowAbove({ rowIndex: lastCell.rowIndex, rowPinned: lastCell.rowPinned });

        if (rowAbove) {
            return {
                rowIndex: rowAbove.rowIndex,
                column: lastCell.column,
                rowPinned: rowAbove.rowPinned
            } as CellPosition;
        }

        return null;
    }

    private getLastBodyCell(): RowPosition {
        const lastBodyRow = this.paginationProxy.getPageLastRow();

        return { rowIndex: lastBodyRow, rowPinned: null } as RowPosition;
    }

    private getLastFloatingTopRow(): RowPosition {
        const lastFloatingRow = this.pinnedRowModel.getPinnedTopRowData().length - 1;

        return { rowIndex: lastFloatingRow, rowPinned: Constants.PINNED_TOP } as RowPosition;
    }

    public getNextTabbedCell(gridCell: CellPosition, backwards: boolean): CellPosition | null {
        if (backwards) {
            return this.getNextTabbedCellBackwards(gridCell);
        }

        return this.getNextTabbedCellForwards(gridCell);
    }

    public getNextTabbedCellForwards(gridCell: CellPosition): CellPosition | null {
        const displayedColumns = this.columnController.getAllDisplayedColumns();

        let newRowIndex: number | null = gridCell.rowIndex;
        let newFloating: string | null = gridCell.rowPinned;

        // move along to the next cell
        let newColumn = this.columnController.getDisplayedColAfter(gridCell.column);

        // check if end of the row, and if so, go forward a row
        if (!newColumn) {
            newColumn = displayedColumns[0];

            const rowBelow = this.getRowBelow(gridCell);
            if (missing(rowBelow)) { return null; }

            // If we are tabbing and there is a paging panel present, tabbing should go
            // to the paging panel instead of loading the next page.
            if (
                !this.paginationProxy.isNextRowInTheCurrentPage(rowBelow, gridCell) &&
                !this.gridOptionsWrapper.isSuppressPaginationPanel()
            ) {
                return null;
            }

            newRowIndex = rowBelow ? rowBelow.rowIndex : null;
            newFloating = rowBelow ? rowBelow.rowPinned : null;
        }

        return { rowIndex: newRowIndex, column: newColumn, rowPinned: newFloating } as CellPosition;
    }

    public getNextTabbedCellBackwards(gridCell: CellPosition): CellPosition | null {

        const displayedColumns = this.columnController.getAllDisplayedColumns();

        let newRowIndex: number | null = gridCell.rowIndex;
        let newFloating: string | null = gridCell.rowPinned;

        // move along to the next cell
        let newColumn = this.columnController.getDisplayedColBefore(gridCell.column);

        // check if end of the row, and if so, go forward a row
        if (!newColumn) {
            newColumn = last(displayedColumns);

            const rowAbove = this.getRowAbove({ rowIndex: gridCell.rowIndex, rowPinned: gridCell.rowPinned });

            if (missing(rowAbove)) { return null; }

            // If we are tabbing and there is a paging panel present, tabbing should go
            // to the paging panel instead of loading the next page.
            if (
                !this.paginationProxy.isNextRowInTheCurrentPage(rowAbove, gridCell) &&
                !this.gridOptionsWrapper.isSuppressPaginationPanel()
            ) {
                return null;
            }

            newRowIndex = rowAbove ? rowAbove.rowIndex : null;
            newFloating = rowAbove ? rowAbove.rowPinned : null;
        }

        return { rowIndex: newRowIndex, column: newColumn, rowPinned: newFloating } as CellPosition;
    }

}
