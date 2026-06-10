const NODE_RADIUS = 24;

function findCycleEdges(nodes, edges) {
  const cycleEdges = new Set();
  const color = {};

  function dfs(node) {
    if (color[node] === 1) return true;
    if (color[node] === 2) return false;

    color[node] = 1;

    for (const edge of edges) {
      if (edge.from !== node) continue;

      if (color[edge.to] === 1) {
        cycleEdges.add(`${edge.from}->${edge.to}`);
        return true;
      }

      if (!color[edge.to] && dfs(edge.to)) {
        cycleEdges.add(`${edge.from}->${edge.to}`);
        return true;
      }
    }

    color[node] = 2;
    return false;
  }

  for (const node of nodes) {
    if (!color[node]) dfs(node);
  }

  return cycleEdges;
}

function forceDirectedLayout(nodes, edges, root) {
  const n = nodes.length;
  const padding = 60;
  const idealLength = 110;
  const iterations = 150;

  let width = Math.max(320, n * 80);
  let height = Math.max(280, n * 70);
  const centerX = width / 2;
  const centerY = height / 2;
  const initRadius = Math.max(70, n * 26);

  const positions = {};

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions[node] = {
      x: centerX + initRadius * Math.cos(angle),
      y: centerY + initRadius * Math.sin(angle),
    };
  });

  if (root && positions[root]) {
    positions[root].y -= 30;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const disp = Object.fromEntries(nodes.map((node) => [node, { x: 0, y: 0 }]));
    const cooling = 1 - iter / iterations;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = positions[a].x - positions[b].x;
        let dy = positions[a].y - positions[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulse = (3500 * cooling) / (dist * dist);

        disp[a].x += (dx / dist) * repulse;
        disp[a].y += (dy / dist) * repulse;
        disp[b].x -= (dx / dist) * repulse;
        disp[b].y -= (dy / dist) * repulse;
      }
    }

    for (const edge of edges) {
      const a = edge.from;
      const b = edge.to;
      let dx = positions[b].x - positions[a].x;
      let dy = positions[b].y - positions[a].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const attract = (dist - idealLength) * 0.08 * cooling;

      disp[a].x += (dx / dist) * attract;
      disp[a].y += (dy / dist) * attract;
      disp[b].x -= (dx / dist) * attract;
      disp[b].y -= (dy / dist) * attract;
    }

    for (const node of nodes) {
      positions[node].x += disp[node].x * 0.12;
      positions[node].y += disp[node].y * 0.12;
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, positions[node].x);
    minY = Math.min(minY, positions[node].y);
    maxX = Math.max(maxX, positions[node].x);
    maxY = Math.max(maxY, positions[node].y);
  }

  const offsetX = padding - minX + NODE_RADIUS;
  const offsetY = padding - minY + NODE_RADIUS;

  for (const node of nodes) {
    positions[node].x += offsetX;
    positions[node].y += offsetY;
  }

  width = maxX - minX + padding * 2 + NODE_RADIUS * 2;
  height = maxY - minY + padding * 2 + NODE_RADIUS * 2;

  return { positions, width, height };
}

function getArrowPoints(from, to, positions) {
  const x1 = positions[from].x;
  const y1 = positions[from].y;
  const x2 = positions[to].x;
  const y2 = positions[to].y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    x1: x1 + (dx / len) * NODE_RADIUS,
    y1: y1 + (dy / len) * NODE_RADIUS,
    x2: x2 - (dx / len) * (NODE_RADIUS + 10),
    y2: y2 - (dy / len) * (NODE_RADIUS + 10),
  };
}

function GraphView({ hierarchy, graphId = 0 }) {
  const { nodes = [], edges = [], root, has_cycle: hasCycle } = hierarchy;
  const markerId = `arrow-${graphId}`;
  const cycleMarkerId = `arrow-cycle-${graphId}`;

  if (!nodes.length) return null;

  const cycleEdges = findCycleEdges(nodes, edges);
  const showCycleStyle = hasCycle || cycleEdges.size > 0;

  const { positions, width, height } = forceDirectedLayout(nodes, edges, root);

  return (
    <div className="graph-wrapper">
      {showCycleStyle && (
        <div className="cycle-badge">Cycle detected — root {root}</div>
      )}

      <svg
        className="graph-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#a8b5ad" />
          </marker>
          <marker
            id={cycleMarkerId}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#b84a4a" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const { x1, y1, x2, y2 } = getArrowPoints(
            edge.from,
            edge.to,
            positions,
          );
          const edgeKey = `${edge.from}->${edge.to}`;
          const isCycleEdge = cycleEdges.has(edgeKey);

          return (
            <line
              key={`${edgeKey}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={isCycleEdge ? "graph-edge cycle-edge" : "graph-edge"}
              markerEnd={`url(#${isCycleEdge ? cycleMarkerId : markerId})`}
            />
          );
        })}

        {nodes.map((node) => (
          <g
            key={node}
            transform={`translate(${positions[node].x}, ${positions[node].y})`}
          >
            <circle
              r={NODE_RADIUS}
              className={
                node === root
                  ? showCycleStyle
                    ? "graph-node root-node cycle-node"
                    : "graph-node root-node"
                  : "graph-node"
              }
            />
            <text className="graph-label" textAnchor="middle" dy="5">
              {node}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default GraphView;
