function processGraph(edges) {
  const invalid_entries = [];
  const duplicate_edges = [];

  const seenEdges = new Set();
  const childParent = new Map();

  const adj = {};
  const nodes = new Set();
  const childNodes = new Set();

  for (let edge of edges) {
    edge = edge.trim();

    if (
      !/^[A-Z]->[A-Z]$/.test(edge) ||
      edge[0] === edge[3]
    ) {
      invalid_entries.push(edge);
      continue;
    }

    if (seenEdges.has(edge)) {
      if (!duplicate_edges.includes(edge))
        duplicate_edges.push(edge);
      continue;
    }

    seenEdges.add(edge);

    const [parent, child] = edge.split("->");

    if (!childParent.has(child)) {
      childParent.set(child, parent);
    }

    if (!adj[parent]) adj[parent] = [];

    if (!adj[parent].includes(child)) {
      adj[parent].push(child);
    }

    nodes.add(parent);
    nodes.add(child);

    childNodes.add(child);
  }

  const visited = new Set();
  const hierarchies = [];

  const allNodes = [...nodes];

  const undirected = {};

  for (const node of allNodes) {
    undirected[node] = [];
  }

  for (const parent in adj) {
    for (const child of adj[parent]) {
      undirected[parent].push(child);
      undirected[child].push(parent);
    }
  }

  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;

    const stack = [node];
    const comp = [];

    visited.add(node);

    while (stack.length) {
      const curr = stack.pop();

      comp.push(curr);

      for (const next of undirected[curr]) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }

    components.push(comp);
  }

  let total_trees = 0;
  let total_cycles = 0;

  let largestDepth = -1;
  let largest_tree_root = "";

  for (const comp of components) {
    const componentEdges = [];

    for (const parent in adj) {
      if (!comp.includes(parent)) continue;

      for (const child of adj[parent] || []) {
        if (comp.includes(child)) {
          componentEdges.push({ from: parent, to: child });
        }
      }
    }

    const rootCandidates = comp.filter(
      node => !childNodes.has(node)
    );

    let root;

    if (rootCandidates.length) {
      root = rootCandidates.sort()[0];
    } else {
      root = [...comp].sort()[0];
    }

    let hasCycle = false;

    const color = {};

    function detectCycle(node) {
      if (color[node] === 1) {
        hasCycle = true;
        return;
      }
      if (color[node] === 2) return;

      color[node] = 1;

      for (const child of adj[node] || []) {
        if (!comp.includes(child)) continue;
        detectCycle(child);
      }

      color[node] = 2;
    }

    for (const node of comp) {
      if (!color[node]) detectCycle(node);
      if (hasCycle) break;
    }

    if (hasCycle) {
      total_cycles++;

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
        nodes: [...comp].sort(),
        edges: componentEdges,
      });

      continue;
    }

    total_trees++;

    function buildTree(node) {
      const obj = {};

      for (const child of (adj[node] || [])) {
        obj[child] = buildTree(child);
      }

      return obj;
    }

    function depth(node) {
      const children = adj[node] || [];

      if (!children.length) return 1;

      let maxDepth = 0;

      for (const child of children) {
        maxDepth = Math.max(maxDepth, depth(child));
      }

      return maxDepth + 1;
    }

    const treeObj = {};
    treeObj[root] = buildTree(root);

    const d = depth(root);

    if (
      d > largestDepth ||
      (d === largestDepth &&
        root < largest_tree_root)
    ) {
      largestDepth = d;
      largest_tree_root = root;
    }

    hierarchies.push({
      root,
      tree: treeObj,
      depth: d,
      nodes: [...comp].sort(),
      edges: componentEdges,
    });
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  };
}

module.exports = processGraph;