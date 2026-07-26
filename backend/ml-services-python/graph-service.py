# backend/ml-services-python/graph-service.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import networkx as nx
import community as community_louvain
from typing import List, Dict, Any
from datetime import datetime

app = FastAPI(title="KSP-Athena Graph Analytics Service")

class EntityNode(BaseModel):
    id: str
    type: str  # e.g., 'ACCUSED', 'VICTIM', 'ACCOUNT', 'LOCATION'
    name: str

class RelationshipEdge(BaseModel):
    source: str
    target: str
    relationship_type: str  # e.g., 'CO_ACCUSED', 'TRANSACTED_WITH', 'SCENE_OF_CRIME'
    weight: float = 1.0

class GraphBuildRequest(BaseModel):
    nodes: List[EntityNode]
    edges: List[RelationshipEdge]

@app.post("/api/graph/analyze")
async def analyze_network(data: GraphBuildRequest):
    try:
        # 1. Initialize NetworkX Undirected Graph
        G = nx.Graph()

        # 2. Add Nodes with Metadata
        for node in data.nodes:
            G.add_node(node.id, type=node.type, name=node.name)

        # 3. Add Edges with Weights
        for edge in data.edges:
            G.add_edge(
                edge.source, 
                edge.target, 
                weight=edge.weight, 
                relationship=edge.relationship_type
            )

        if len(G.nodes) == 0:
            return {"communities": {}, "centrality": {}}

        # 4. Louvain Community Detection (Detect Organized Crime Modules)
        partition = community_louvain.best_partition(G)

        # 5. Degree Centrality (Identify Kingpins / Key Hubs)
        centrality = nx.degree_centrality(G)

        # 6. Materialize Results
        community_groups: Dict[int, List[str]] = {}
        for node_id, comm_id in partition.items():
            community_groups.setdefault(comm_id, []).append(node_id)

        return {
            "status": "success",
            "total_nodes": len(G.nodes),
            "total_edges": len(G.edges),
            "communities": community_groups,
            "centrality_scores": centrality,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AppSail Python Graph Engine"}