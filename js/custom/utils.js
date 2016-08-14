function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function flatten(root) {
    var nodes = [],
        i = 0; 

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        nodes.push(node);
    }

    recurse(root);
    return nodes; 
}