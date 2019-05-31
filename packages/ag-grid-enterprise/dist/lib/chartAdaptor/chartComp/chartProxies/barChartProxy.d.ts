// ag-grid-enterprise v21.0.0
import { ChartProxy, ChartProxyParams, UpdateChartParams } from "./chartProxy";
export declare class BarChartProxy extends ChartProxy {
    constructor(params: ChartProxyParams);
    update(params: UpdateChartParams): void;
    private defaultOptions;
}
