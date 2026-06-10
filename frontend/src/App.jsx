import { useState } from "react";
import axios from "axios";
import "./App.css";
import GraphView from "./components/GraphView";


function App() {
    const [edges, setEdges] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const processGraph = async () => {
        try {
            setLoading(true);
            setError("");

            const edgeArray = edges
                .split("\n")
                .map((e) => e.trim())
                .filter(Boolean);

            const response = await axios.post(
                "http://localhost:3000/api/graph",
                {
                    edges: edgeArray,
                },
            );

            setResult(response.data);
        } catch {
            setError("Failed to process graph");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Graph Hierarchy Analyzer</h1>

            <textarea
                placeholder={`A->B
A->C
B->D`}
                value={edges}
                onChange={(e) => setEdges(e.target.value)}
            />

            <button onClick={processGraph}>
                {loading ? "Processing..." : "Analyze Graph"}
            </button>

            {error && <div className="error">{error}</div>}

            {result && (
                <>
                    {(result.invalid_entries?.length > 0 ||
                        result.duplicate_edges?.length > 0) && (
                        <div className="card">
                            <h2>Validation Issues</h2>
                            {result.invalid_entries?.length > 0 && (
                                <div>
                                    <strong>Invalid entries:</strong>{" "}
                                    {result.invalid_entries.join(", ")}
                                </div>
                            )}
                            {result.duplicate_edges?.length > 0 && (
                                <div>
                                    <strong>Duplicate edges:</strong>{" "}
                                    {result.duplicate_edges.join(", ")}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card">
                        <h2>Graph Visualization</h2>

                        {result.hierarchies.map((hierarchy, i) => (
                            <GraphView key={i} graphId={i} hierarchy={hierarchy} />
                        ))}
                    </div>

                    <div className="card">
                        <h2>Hierarchy Details</h2>
                        {result.hierarchies.map((h, index) => (
                            <div key={index} className="hierarchy-card">
                                <h3>Hierarchy {index + 1}</h3>

                                <p>
                                    <strong>Root:</strong> {h.root}
                                </p>

                                {h.has_cycle ? (
                                    <p>Cycle Detected</p>
                                ) : (
                                    <p>
                                        <strong>Depth:</strong> {h.depth}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h2>Summary</h2>
                        <div className="summary-grid">
                            <div>Trees: {result.summary.total_trees}</div>
                            <div>Cycles: {result.summary.total_cycles}</div>
                            <div>
                                Largest Root:{" "}
                                {result.summary.largest_tree_root || "N/A"}
                            </div>
                        </div>
                    </div>
                </>
            )}
            
                
        </div>
    );
}

export default App;
