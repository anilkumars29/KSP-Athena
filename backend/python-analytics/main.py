# backend/python-analytics/main.py
from fastapi import FastAPI
import networkx as nx
from sklearn.cluster import DBSCAN
import numpy as np

app = FastAPI(title="KSP-Athena ML Microservices")

@app.get("/api/ml/graph/{case_master_id}")
def generate_criminal_network(case_master_id: int):
    """
    Entity Resolution Graph: Maps Accused, Victims, and related cases.
    In production, this queries the CriminalNetworkEdge table.
    """
    # Synthetic Graph Data for Neo-Brutalist Frontend
    nodes = [
        {"id": "Case-1001", "group": 1, "label": "FIR 1001", "type": "case"},
        {"id": "Accused-101", "group": 2, "label": "Rahul Kumar", "type": "accused"},
        {"id": "Accused-102", "group": 2, "label": "Arjun Desai", "type": "accused"},
        {"id": "Case-905", "group": 1, "label": "FIR 905 (Past)", "type": "case"}
    ]
    
    edges = [
        {"source": "Case-1001", "target": "Accused-101", "value": 1},
        {"source": "Case-1001", "target": "Accused-102", "value": 1},
        {"source": "Accused-101", "target": "Case-905", "value": 2} # Repeat offender link
    ]
    
    return {"nodes": nodes, "links": edges}

@app.get("/api/ml/forecast/{division_id}")
def generate_spatial_hotspots(division_id: str):
    """
    DBSCAN clustering on latitude/longitude for hotspot prediction.
    """
    # Mock coordinates for Bengaluru West
    coords = np.array([
        [12.9716, 77.5946], [12.9720, 77.5950], [12.9711, 77.5941],
        [13.0388, 77.6823], [13.0390, 77.6825]
    ])
    
    # eps in radians (approx 500 meters), min_samples=2
    kms_per_radian = 6371.0088
    epsilon = 0.5 / kms_per_radian
    
    db = DBSCAN(eps=epsilon, min_samples=2, algorithm='ball_tree', metric='haversine').fit(np.radians(coords))
    
    clusters = []
    for i, label in enumerate(db.labels_):
        clusters.append({
            "lat": coords[i][0],
            "lng": coords[i][1],
            "cluster_id": int(label),
            "risk_weight": 0.8 if label != -1 else 0.2
        })
        
    return {"status": "success", "hotspots": clusters}