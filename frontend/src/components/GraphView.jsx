const NODE_RADIUS = 24;
const LEVEL_HEIGHT = 90;
const NODE_SPACING = 90;

function computeLayout(nodes, edges, root, hasCycle) {
  const positions = {};

  if (hasCycle || nodes.length <= 1) {
    const radius = Math.max(90, nodes.length * 28);
    const centerX = radius + 60;
    const centerY = radius + 60;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      positions[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return {
      positions,
      width: centerX * 2,
      height: centerY * 2,
    };
  }

  const levels = {};
  const visited = new Set();
  const queue = [[root, 0]];
  visited.add(root);

  while (queue.length) {
    const [node, level] = queue.shift();
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);

    for (const edge of edges) {
      if (edge.from === node && !visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push([edge.to, level + 1]);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const nextLevel = Math.max(...Object.keys(levels).map(Number), -1) + 1;
      if (!levels[nextLevel]) levels[nextLevel] = [];
      levels[nextLevel].push(node);
    }
  }

  const levelKeys = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b);

  let maxLevelWidth = 1;
  for (const level of levelKeys) {
    maxLevelWidth = Math.max(maxLevelWidth, levels[level].length);
  }

  const canvasWidth = Math.max(280, maxLevelWidth * NODE_SPACING + 80);
  const canvasHeight = Math.max(160, levelKeys.length * LEVEL_HEIGHT + 80);

  for (const level of levelKeys) {
    const nodesAtLevel = levels[level];
    nodesAtLevel.forEach((node, i) => {
      positions[node] = {
        x:
          (i - (nodesAtLevel.length - 1) / 2) * NODE_SPACING +
          canvasWidth / 2,
        y: level * LEVEL_HEIGHT + 50,
      };
    });
  }

  return { positions, width: canvasWidth, height: canvasHeight };
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

  const { positions, width, height } = computeLayout(
    nodes,
    edges,
    root,
    hasCycle,
  );

  return (
    <div className="graph-wrapper">
      {hasCycle && (
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
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          {hasCycle && (
            <marker
              id={cycleMarkerId}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#f87171" />
            </marker>
          )}
        </defs>

        {edges.map((edge, i) => {
          const { x1, y1, x2, y2 } = getArrowPoints(
            edge.from,
            edge.to,
            positions,
          );

          return (
            <line
              key={`${edge.from}-${edge.to}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={hasCycle ? "graph-edge cycle-edge" : "graph-edge"}
              markerEnd={`url(#${hasCycle ? cycleMarkerId : markerId})`}
            />
          );
        })}

        {nodes.map((node) => (
          <g key={node} transform={`translate(${positions[node].x}, ${positions[node].y})`}>
            <circle
              r={NODE_RADIUS}
              className={
                node === root
                  ? hasCycle
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
