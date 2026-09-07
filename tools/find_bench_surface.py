import json, struct, os

MODEL = r"C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models\lab_bench.glb"
SCALE = 2.5 / 4.84  # current RealLabBench scale factor (target 2.5m / raw largest axis 4.84)

def read_glb(path):
    with open(path, "rb") as f:
        header = f.read(12)
        magic, version, total_len = struct.unpack("<4sII", header)
        ch = f.read(8)
        clen, ctype = struct.unpack("<II", ch)
        json_bytes = f.read(clen)
        gltf = json.loads(json_bytes)
        bin_data = None
        rest = f.read(8)
        if len(rest) == 8:
            blen, btype = struct.unpack("<II", rest)
            bin_data = f.read(blen)
        return gltf, bin_data

gltf, bin_data = read_glb(MODEL)
accessors = gltf["accessors"]
buffer_views = gltf["bufferViews"]

all_y = []
position_accessor_indices = set()
for mesh in gltf.get("meshes", []):
    for prim in mesh.get("primitives", []):
        attrs = prim.get("attributes", {})
        if "POSITION" in attrs:
            position_accessor_indices.add(attrs["POSITION"])

for acc_idx in position_accessor_indices:
    acc = accessors[acc_idx]
    bv = buffer_views[acc["bufferView"]]
    byte_offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    count = acc["count"]
    for i in range(count):
        off = byte_offset + i * 12
        x, y, z = struct.unpack_from("<fff", bin_data, off)
        all_y.append(y)

if all_y:
    min_y, max_y = min(all_y), max(all_y)
    bucket_count = 60
    bucket_size = (max_y - min_y) / bucket_count if max_y > min_y else 1
    hist = [0] * (bucket_count + 1)
    for y in all_y:
        b = int((y - min_y) / bucket_size) if bucket_size > 0 else 0
        b = min(b, bucket_count)
        hist[b] += 1
    indexed = sorted(range(len(hist)), key=lambda i: -hist[i])
    print(f"Total vertices: {len(all_y)}")
    print(f"Raw Y range: {min_y:.4f} to {max_y:.4f}")
    print("--- top 8 Y-height peaks (raw units -> real meters, vertex count) ---")
    for idx in indexed[:8]:
        raw_y = min_y + idx * bucket_size
        real_y = raw_y * SCALE
        print(f"raw_y={raw_y:.4f}  real_y={real_y:.4f}m  vertex_count={hist[idx]}")
else:
    print("No POSITION vertices found")
