import json, struct, os

MODELS_DIR = r"C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"

def read_glb_json(path):
    with open(path, "rb") as f:
        data = f.read(20)
        magic, version, total_len, chunk_len, chunk_type = struct.unpack("<4sIIII", data)
        if magic != b"glTF":
            return None
        json_bytes = f.read(chunk_len)
        return json.loads(json_bytes)

def bbox_for(gltf):
    accessors = gltf.get("accessors", [])
    mn = [float("inf")] * 3
    mx = [float("-inf")] * 3
    found = False
    for acc in accessors:
        if acc.get("type") == "VEC3" and "min" in acc and "max" in acc:
            found = True
            for i in range(3):
                mn[i] = min(mn[i], acc["min"][i])
                mx[i] = max(mx[i], acc["max"][i])
    if not found:
        return None
    return [mx[i] - mn[i] for i in range(3)], mn

results = []
for fn in sorted(os.listdir(MODELS_DIR)):
    if not fn.lower().endswith(".glb"):
        continue
    path = os.path.join(MODELS_DIR, fn)
    try:
        gltf = read_glb_json(path)
        if gltf is None:
            results.append((fn, "NOT_GLB", None, None))
            continue
        r = bbox_for(gltf)
        if r is None:
            results.append((fn, "NO_BOUNDS", None, None))
            continue
        size, mn = r
        results.append((fn, "OK", size, mn))
    except Exception as e:
        results.append((fn, f"ERROR:{e}", None, None))

for fn, status, size, mn in results:
    if status == "OK":
        dx, dy, dz = size
        largest_axis = ["X","Y","Z"][size.index(max(size))]
        print(f"{fn}\t{status}\tX={dx:.4f}\tY={dy:.4f}\tZ={dz:.4f}\tLARGEST={largest_axis}\tMINY={mn[1]:.4f}")
    else:
        print(f"{fn}\t{status}")
