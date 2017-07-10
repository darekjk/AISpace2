import * as d3 from "d3-force";
import { IGraph, IGraphEdge } from "./Graph";

export interface ILayoutParams {
    width: number;
    height: number;
}

/**
 * Layouts a graph by giving nodes x and y properties.
 */
export interface IGraphLayoutEngine {
    /**
     * Performs one-time setup before layout.
     *
     * This function is only called once before the graph is drawn for the first time.
     * If your graph layout algorithm never requires relayout when the graph is updated,
     * perhaps because nodes will be created at mouse position, you may assign
     * x and y positions as properties to each node datum right here.
     */
    setup(graph: IGraph, layoutParams: ILayoutParams): void;

    /**
     * Re-layouts the graph as a result of graph changes.
     *
     * This function is not called initially for the first render.
     * You may call this function from the setup function if necessary.
     *
     * You should update the x and y properties of each node datum.
     */
    relayout(graph: IGraph, layoutParams: ILayoutParams): void;
}

/**
 * Layouts a graph using the results of D3's force layout.
 */
export const d3ForceLayoutEngine: IGraphLayoutEngine = {
    relayout: (graph: IGraph, layoutParams: ILayoutParams) => { return; },
    setup: (graph: IGraph, layoutParams: ILayoutParams) => {
        /**
         * We will work with a copy of the graph to prevent D3 from adding
         * various additional properties, such as `vx` and `fy`, to our nodes.
         * Later, we'll copy over only the final x and y properties that we're interested in.
         */
        const graphCopy: IGraph = JSON.parse(JSON.stringify(graph));
        const nodes = Object.values(graphCopy.nodes);
        const links = [];
        for (const edge of Object.values(graphCopy.edges)) {
            links.push({ source: edge.source, target: edge.dest });
        }

        const forceSimulation = d3.forceSimulation(graphCopy.nodes)
            .force("link", d3.forceLink()
                .id((node: IGraphEdge) => node.id)
                .links(graphCopy.edges)
                .distance(35)
                .strength(0.6))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(layoutParams.width / 2, layoutParams.height / 2))
            .force("collision", d3.forceCollide(75))
            .stop();

        // Run simulation synchronously the default number of times (300)
        for (let i = 0, ticksToSimulate = 300; i < ticksToSimulate; i++) {
            forceSimulation.tick();

            // Bound nodes to SVG
            nodes.forEach((node) => {
                node.x = Math.max(30, Math.min(layoutParams.width - 30, node.x!));
                node.y = Math.max(30, Math.min(layoutParams.height - 30, node.y!));
            });
        }

        // Copy over x and y positions onto original graph once simulation is finished
        graphCopy.nodes.forEach((node, i) => {
            graph.nodes[i].x = node.x;
            graph.nodes[i].y = node.y;
        });
    },
};
