"use strict";

try {
  const params = new URLSearchParams(window.location.search);

  document.getElementById("params").innerText = window.location.search;

  const directed = params.get("directed") === "true";

  const graph = params.get("graph").split(";");

  const nodes = new Set();
  const edges = [];

  graph.forEach((line) => {
    const args = line.split(",");
    nodes.add(args[0]);
    if (args.length > 1) {
      nodes.add(args[1]);
      edges.push({
        source: args[0],
        target: args[1],
        directed,
        displayWeight: args[2],
      });
    }
  });

  greuler({
    target: "#app",
    data: {
      nodes: Array.from(nodes).map((x) => {
        return { id: x };
      }),
      edges,
    },
  }).update();
} catch (error) {
  console.log(error);
}
