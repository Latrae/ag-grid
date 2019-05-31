// ag-grid-enterprise v21.0.0
import { DropShadow } from "../../scene/dropShadow";
import { Series, SeriesNodeDatum } from "./series";
import { LegendDatum } from "../legend";
import { PolarChart } from "../polarChart";
interface GroupSelectionDatum extends SeriesNodeDatum {
    radius: number;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    midCos: number;
    midSin: number;
    label?: {
        text: string;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
}
export interface PieTooltipRendererParams {
    datum: any;
    angleField: string;
    radiusField?: string;
    labelField?: string;
}
export declare class PieSeries extends Series<PolarChart> {
    private titleNode;
    private radiusScale;
    private groupSelection;
    /**
     * The processed data that gets visualized.
     */
    private groupSelectionData;
    readonly enabled: boolean[];
    private angleScale;
    constructor();
    data: any[];
    protected _title: string;
    title: string;
    private _titleEnabled;
    titleEnabled: boolean;
    private _titleFont;
    titleFont: string;
    /**
     * `null` means make the callout color the same as {@link strokeStyle}.
     */
    private _calloutColors;
    calloutColors: string[];
    private _calloutStrokeWidth;
    calloutStrokeWidth: number;
    private _calloutLength;
    calloutLength: number;
    private _calloutPadding;
    calloutPadding: number;
    private _labelFont;
    labelFont: string;
    private _labelColor;
    labelColor: string;
    private _labelMinAngle;
    labelMinAngle: number;
    chart: PolarChart | null;
    /**
     * The name of the numeric field to use to determine the angle (for example,
     * a pie slice angle).
     */
    private _angleField;
    angleField: string;
    /**
     * The name of the numeric field to use to determine the radii of pie slices.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii. To prevent confusing visuals, this config only works
     * if {@link innerRadiusOffset} is zero.
     */
    private _radiusField;
    radiusField: string;
    /**
     * The value of the label field is supposed to be a string.
     * If it isn't, it will be coerced to a string value.
     */
    private _labelField;
    labelField: string;
    private _labelEnabled;
    labelEnabled: boolean;
    private _fills;
    fills: string[];
    private _strokes;
    strokes: string[];
    /**
     * The series rotation in degrees.
     */
    private _rotation;
    rotation: number;
    private _outerRadiusOffset;
    outerRadiusOffset: number;
    private _innerRadiusOffset;
    innerRadiusOffset: number;
    private _strokeWidth;
    strokeWidth: number;
    private _shadow;
    shadow: DropShadow | undefined;
    getDomainX(): [number, number];
    getDomainY(): [number, number];
    processData(): boolean;
    update(): void;
    getTooltipHtml(nodeDatum: GroupSelectionDatum): string;
    tooltipRenderer?: (params: PieTooltipRendererParams) => string;
    listSeriesItems(data: LegendDatum[]): void;
    toggleSeriesItem(itemId: number, enabled: boolean): void;
}
export {};
