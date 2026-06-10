function TreeNode({ name, childrenObj }) {
  return (
    <div style={{ marginLeft: "20px" }}>
      <div className="node">{name}</div>

      {Object.entries(childrenObj).map(
        ([childName, childChildren]) => (
          <TreeNode
            key={childName}
            name={childName}
            childrenObj={childChildren}
          />
        )
      )}
    </div>
  );
}

export default TreeNode;