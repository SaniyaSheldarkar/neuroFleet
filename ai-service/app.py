from flask import Flask, request, jsonify
from flask_cors import CORS
import heapq
import random
import math

app = Flask(__name__)
CORS(app)

# ─── Simulated City Graph ───────────────────────────────────────────────────
# Nodes represent key locations in a simulated city (Aurangabad-like)
CITY_NODES = {
    "Airport":          (19.8672, 75.3975),
    "Railway Station":  (19.8762, 75.3433),
    "Bus Stand":        (19.8790, 75.3450),
    "City Center":      (19.8951, 75.3240),
    "IT Park":          (19.9100, 75.3580),
    "University":       (19.9200, 75.3700),
    "Hospital":         (19.8850, 75.3200),
    "Market":           (19.8700, 75.3300),
    "Mall":             (19.9000, 75.3100),
    "Industrial Area":  (19.8500, 75.3800),
    "Residential Zone": (19.9300, 75.3400),
    "Sports Complex":   (19.9050, 75.3900),
}

# Graph edges: (node_a, node_b, base_distance_km)
BASE_EDGES = [
    ("Airport", "Industrial Area", 4.2),
    ("Airport", "IT Park", 6.1),
    ("Railway Station", "Bus Stand", 0.5),
    ("Railway Station", "City Center", 3.8),
    ("Railway Station", "Market", 2.1),
    ("Bus Stand", "City Center", 3.5),
    ("Bus Stand", "Hospital", 3.0),
    ("City Center", "Mall", 2.8),
    ("City Center", "Hospital", 2.2),
    ("City Center", "Market", 1.9),
    ("IT Park", "University", 2.4),
    ("IT Park", "Sports Complex", 3.1),
    ("IT Park", "Residential Zone", 2.7),
    ("University", "Residential Zone", 1.8),
    ("University", "Sports Complex", 2.0),
    ("Mall", "Hospital", 1.5),
    ("Mall", "Residential Zone", 3.2),
    ("Market", "Industrial Area", 5.0),
    ("Market", "Bus Stand", 2.3),
    ("Hospital", "City Center", 2.2),
    ("Residential Zone", "Sports Complex", 1.6),
    ("Industrial Area", "IT Park", 7.5),
]

def get_traffic_multiplier():
    """Simulate traffic conditions (1.0 = free flow, 2.5 = heavy traffic)"""
    return random.uniform(1.0, 2.5)

def build_graph(traffic_seed=None):
    """Build weighted adjacency list with simulated traffic"""
    if traffic_seed:
        random.seed(traffic_seed)
    graph = {node: [] for node in CITY_NODES}
    for a, b, dist in BASE_EDGES:
        traffic = get_traffic_multiplier()
        weighted = round(dist * traffic, 2)
        graph[a].append((weighted, b, dist, traffic))
        graph[b].append((weighted, a, dist, traffic))
    return graph

def dijkstra(graph, source, destination):
    """Dijkstra's shortest path algorithm"""
    dist = {node: float('inf') for node in graph}
    dist[source] = 0
    prev = {node: None for node in graph}
    pq = [(0, source)]

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_dist > dist[curr_node]:
            continue
        for weight, neighbor, _, _ in graph.get(curr_node, []):
            new_dist = curr_dist + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                prev[neighbor] = curr_node
                heapq.heappush(pq, (new_dist, neighbor))

    # Reconstruct path
    path = []
    node = destination
    while node:
        path.append(node)
        node = prev[node]
    path.reverse()

    if path[0] != source:
        return None, float('inf')
    return path, dist[destination]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def find_nearest_node(location_name):
    """Fuzzy match location to nearest city node"""
    location_name = location_name.lower().strip()
    for node in CITY_NODES:
        if location_name in node.lower() or node.lower() in location_name:
            return node
    # Default fallback mapping
    fallback = {
        "home": "Residential Zone", "office": "IT Park", "hospital": "Hospital",
        "station": "Railway Station", "airport": "Airport", "college": "University",
        "market": "Market", "mall": "Mall", "bus": "Bus Stand",
    }
    for key, val in fallback.items():
        if key in location_name:
            return val
    return random.choice(list(CITY_NODES.keys()))

@app.route('/optimize-route', methods=['POST'])
def optimize_route():
    data = request.json or {}
    source_input = data.get('source', 'Railway Station')
    dest_input = data.get('destination', 'Airport')
    vehicle_type = data.get('vehicleType', 'SEDAN')

    source = find_nearest_node(source_input)
    destination = find_nearest_node(dest_input)

    if source == destination:
        return jsonify({"error": "Source and destination are the same"}), 400

    # Best route
    graph1 = build_graph(traffic_seed=42)
    best_path, best_dist = dijkstra(graph1, source, destination)

    # Alternate route (different traffic)
    graph2 = build_graph(traffic_seed=99)
    alt_path, alt_dist = dijkstra(graph2, source, destination)

    # Calculate ETA based on vehicle type
    speed_map = {"SEDAN": 45, "SUV": 50, "VAN": 38, "TRUCK": 35, "EV_BUS": 40, "BIKE": 55}
    avg_speed = speed_map.get(vehicle_type, 45)

    best_eta_min = round((best_dist / avg_speed) * 60)
    alt_eta_min = round((alt_dist / avg_speed) * 60)

    # Get coordinates for path
    def path_coords(path):
        return [{"lat": CITY_NODES[n][0], "lng": CITY_NODES[n][1], "name": n} for n in path if n in CITY_NODES]

    # Traffic condition assessment
    def traffic_label(multiplier):
        if multiplier < 1.4: return "Light"
        if multiplier < 1.9: return "Moderate"
        return "Heavy"

    avg_traffic = sum(w for w, _, _, _ in graph1.get(source, [(1.5, None, None, None)])) / max(1, len(graph1.get(source, [1])))
    traffic_condition = traffic_label(avg_traffic / max(1, len(BASE_EDGES)))

    # AI recommendation
    def ai_recommendation(path, dist, eta):
        tips = []
        if eta < 20: tips.append("Quick route — minimal stops recommended.")
        if eta > 40: tips.append("Long journey — consider a fuel/charge stop.")
        if len(path) > 4: tips.append("Multi-stop route — traffic diversions possible.")
        if vehicle_type == "EV_BUS": tips.append("Verify charging stations along route.")
        return tips if tips else ["Route looks optimal for current conditions."]

    return jsonify({
        "source": source,
        "destination": destination,
        "bestRoute": {
            "path": best_path,
            "coordinates": path_coords(best_path),
            "distanceKm": round(best_dist, 2),
            "etaMinutes": best_eta_min,
            "trafficCondition": traffic_condition,
            "label": "Fastest Route"
        },
        "alternateRoute": {
            "path": alt_path,
            "coordinates": path_coords(alt_path),
            "distanceKm": round(alt_dist, 2),
            "etaMinutes": alt_eta_min,
            "trafficCondition": traffic_label(1.8),
            "label": "Alternate Route"
        },
        "aiRecommendations": ai_recommendation(best_path, best_dist, best_eta_min),
        "vehicleType": vehicle_type,
        "avgSpeed": avg_speed,
    })

@app.route('/recommend-vehicle', methods=['POST'])
def recommend_vehicle():
    """AI vehicle recommendation based on trip parameters"""
    data = request.json or {}
    passengers = int(data.get('passengers', 1))
    distance = float(data.get('distanceKm', 10))
    prefer_ev = data.get('preferEV', False)
    luggage = data.get('luggage', False)

    score = {}

    if prefer_ev:
        score['EV_BUS'] = 90 if passengers > 6 else 75
        score['SEDAN'] = 85 if passengers <= 4 else 50
    else:
        score['SEDAN'] = 80 if passengers <= 4 else 40
        score['SUV'] = 85 if passengers <= 7 else 60
        score['VAN'] = 70 if passengers > 7 or luggage else 45
        score['TRUCK'] = 50 if luggage else 20

    if distance > 100:
        score['SUV'] = score.get('SUV', 0) + 10
        score['VAN'] = score.get('VAN', 0) + 5

    best = max(score, key=score.get)
    sorted_recs = sorted(score.items(), key=lambda x: -x[1])

    return jsonify({
        "recommended": best,
        "score": score[best],
        "rankings": [{"type": t, "score": s} for t, s in sorted_recs],
        "reason": f"Best match for {passengers} passengers, {distance}km trip" + (" (EV preferred)" if prefer_ev else ""),
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "NeuroFleetX AI Service"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
