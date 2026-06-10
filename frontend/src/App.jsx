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
                { edges: edgeArray },
            );

            setResult(response.data);
        } catch {
            setError("Failed to process graph. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <header className="hero">
                <span className="hero-eyebrow">Directed Graph Tool</span>
                <h1>Graph Hierarchy Analyzer</h1>
                <p>
                    Paste parent→child edges to visualize trees, detect cycles,
                    and explore graph structure.
                </p>
            </header>

            <section className="input-panel">
                <label className="input-label" htmlFor="edges-input">
                    Edge list
                </label>
                <textarea
                    id="edges-input"
                    placeholder={`A->B\nA->C\nB->D`}
                    value={edges}
                    onChange={(e) => setEdges(e.target.value)}
                />
                <div className="input-actions">
                    <button onClick={processGraph} disabled={loading}>
                        {loading ? "Analyzing…" : "Analyze Graph"}
                    </button>
                    <span className="input-hint">Format: X-&gt;Y, one edge per line</span>
                </div>
                {error && <div className="error">{error}</div>}
            </section>

            {result && (
                <div className="results">
                    {(result.invalid_entries?.length > 0 ||
                        result.duplicate_edges?.length > 0) && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-icon card-icon--warn">⚠</div>
                                <h2>Validation Issues</h2>
                            </div>
                            <div className="validation-list">
                                {result.invalid_entries?.length > 0 && (
                                    <div className="validation-item validation-item--invalid">
                                        <strong>Invalid entries:</strong>{" "}
                                        {result.invalid_entries.join(", ")}
                                    </div>
                                )}
                                {result.duplicate_edges?.length > 0 && (
                                    <div className="validation-item validation-item--duplicate">
                                        <strong>Duplicate edges:</strong>{" "}
                                        {result.duplicate_edges.join(", ")}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon card-icon--viz">◎</div>
                            <h2>Graph Visualization</h2>
                        </div>
                        {result.hierarchies.map((hierarchy, i) => (
                            <GraphView key={i} graphId={i} hierarchy={hierarchy} />
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon card-icon--details">⌗</div>
                            <h2>Hierarchy Details</h2>
                        </div>
                        <div className="hierarchy-grid">
                            {result.hierarchies.map((h, index) => (
                                <div
                                    key={index}
                                    className={`hierarchy-card${h.has_cycle ? " hierarchy-card--cycle" : ""}`}
                                >
                                    <span
                                        className={`hierarchy-tag${h.has_cycle ? " hierarchy-tag--cycle" : ""}`}
                                    >
                                        {h.has_cycle ? "Cycle" : "Tree"}
                                    </span>
                                    <h3>Hierarchy {index + 1}</h3>
                                    <p>
                                        <strong>Root:</strong> {h.root}
                                    </p>
                                    {h.has_cycle ? (
                                        <p>Contains a directed cycle</p>
                                    ) : (
                                        <p>
                                            <strong>Depth:</strong> {h.depth}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon card-icon--summary">◈</div>
                            <h2>Summary</h2>
                        </div>
                        <div className="summary-grid">
                            <div className="stat-card stat-card--trees">
                                <span className="stat-value">
                                    {result.summary.total_trees}
                                </span>
                                <span className="stat-label">Trees</span>
                            </div>
                            <div className="stat-card stat-card--cycles">
                                <span className="stat-value">
                                    {result.summary.total_cycles}
                                </span>
                                <span className="stat-label">Cycles</span>
                            </div>
                            <div className="stat-card stat-card--root">
                                <span className="stat-value">
                                    {result.summary.largest_tree_root || "—"}
                                </span>
                                <span className="stat-label">Largest Root</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
