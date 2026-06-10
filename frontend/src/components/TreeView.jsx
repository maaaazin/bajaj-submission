import TreeNode from "./TreeNode";

function TreeView({ hierarchy }) {
  const root = Object.keys(hierarchy.tree)[0];

  return (
    <div className="tree-container">
      <TreeNode
        name={root}
        childrenObj={hierarchy.tree[root]}
      />
    </div>
  );
}

export default TreeView;