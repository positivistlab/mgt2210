const width = 960;
const height = 680;

const networkFiles = {
  start: "data/edgelist_start.csv",
  end: "data/edgelist_end.csv"
};

const svg = d3.select("#network")
  .append("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", "100%")
  .attr("height", "100%");

const container = svg.append("g");

const zoom = d3.zoom()
  .scaleExtent([0.2, 6])
  .on("zoom", (event) => {
    container.attr("transform", event.transform);
  });

svg.call(zoom);

const color = d3.scaleOrdinal(d3.schemeTableau10);

let allNodes = [];
let currentLinks = [];
let simulation;

Promise.all([
  d3.csv("data/node.csv", d3.autoType),
  d3.csv(networkFiles.start, d3.autoType)
]).then(([nodes, links]) => {
  allNodes = nodes.map(d => ({
    id: String(d.node_id),
    title: d.title
  }));

  populateTitleFilter(allNodes);
  drawNetwork(allNodes, normalizeLinks(links));

  d3.select("#networkSelect").on("change", async function() {
    const selected = this.value;
    const newLinks = await d3.csv(networkFiles[selected], d3.autoType);
    drawNetwork(allNodes, normalizeLinks(newLinks));
  });

  d3.select("#titleSelect").on("change", function() {
    applyTitleFilter(this.value);
  });

  d3.select("#resetButton").on("click", resetView);
});

function normalizeLinks(links) {
  return links.map(d => ({
    source: String(d.from),
    target: String(d.to),
    weight: +d.weight || 1
  }));
}

function populateTitleFilter(nodes) {
  const titles = Array.from(new Set(nodes.map(d => d.title))).sort();

  const select = d3.select("#titleSelect");
  titles.forEach(title => {
    select.append("option")
      .attr("value", title)
      .text(title);
  });
}

function drawNetwork(nodes, links) {
  currentLinks = links;

  container.selectAll("*").remove();

  const nodeDegree = calculateDegree(nodes, links);

  const link = container.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", d => Math.sqrt(d.weight));

  const node = container.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", d => 4 + Math.sqrt(nodeDegree[d.id]?.total || 0))
    .attr("fill", d => color(d.title))
    .call(drag())
    .on("click", (event, d) => showNodeDetails(d, nodeDegree[d.id] || {in: 0, out: 0, total: 0}));

  node.append("title")
    .text(d => `${d.title}\nNode ID: ${d.id}`);

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(45).strength(0.08))
    .force("charge", d3.forceManyBody().strength(-28))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => 5 + Math.sqrt(nodeDegree[d.id]?.total || 0)))
    .on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

  applyTitleFilter(d3.select("#titleSelect").property("value"));
}

function calculateDegree(nodes, links) {
  const degree = {};
  nodes.forEach(n => {
    degree[n.id] = { in: 0, out: 0, total: 0 };
  });

  links.forEach(l => {
    const source = typeof l.source === "object" ? l.source.id : String(l.source);
    const target = typeof l.target === "object" ? l.target.id : String(l.target);

    if (degree[source]) {
      degree[source].out += 1;
      degree[source].total += 1;
    }

    if (degree[target]) {
      degree[target].in += 1;
      degree[target].total += 1;
    }
  });

  return degree;
}

function showNodeDetails(node, degree) {
  const connectedTitles = getConnectedTitles(node.id);

  d3.select("#nodeDetails").html(`
    <p><strong>Node ID:</strong> ${node.id}</p>
    <p><strong>Title:</strong> ${node.title}</p>
    <p><strong>In-degree:</strong> ${degree.in}</p>
    <p><strong>Out-degree:</strong> ${degree.out}</p>
    <p><strong>Total degree:</strong> ${degree.total}</p>
    <hr />
    <p><strong>Main connected titles:</strong></p>
    <ul>
      ${connectedTitles.map(d => `<li>${d.title}: ${d.count}</li>`).join("")}
    </ul>
  `);

  highlightNode(node.id);
}

function getConnectedTitles(nodeId) {
  const counts = {};

  currentLinks.forEach(l => {
    const source = typeof l.source === "object" ? l.source.id : String(l.source);
    const target = typeof l.target === "object" ? l.target.id : String(l.target);

    let otherId = null;
    if (source === nodeId) otherId = target;
    if (target === nodeId) otherId = source;

    if (otherId) {
      const otherNode = allNodes.find(n => n.id === otherId);
      if (otherNode) {
        counts[otherNode.title] = (counts[otherNode.title] || 0) + 1;
      }
    }
  });

  return Object.entries(counts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function highlightNode(nodeId) {
  container.selectAll(".node")
    .classed("dimmed", d => d.id !== nodeId);

  container.selectAll(".link")
    .classed("highlighted", d => {
      const source = typeof d.source === "object" ? d.source.id : String(d.source);
      const target = typeof d.target === "object" ? d.target.id : String(d.target);
      return source === nodeId || target === nodeId;
    });
}

function applyTitleFilter(selectedTitle) {
  container.selectAll(".node")
    .style("display", d => selectedTitle === "all" || d.title === selectedTitle ? null : "none");

  container.selectAll(".link")
    .style("display", d => {
      if (selectedTitle === "all") return null;

      const sourceTitle = typeof d.source === "object" ? d.source.title : null;
      const targetTitle = typeof d.target === "object" ? d.target.title : null;

      return sourceTitle === selectedTitle || targetTitle === selectedTitle ? null : "none";
    });
}

function resetView() {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  container.selectAll(".node").classed("dimmed", false);
  container.selectAll(".link").classed("highlighted", false);
  d3.select("#nodeDetails").html("");
}

function drag() {
  return d3.drag()
    .on("start", (event, d) => {
      if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active && simulation) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
