import json, struct, os

MODELS_DIR = r"C:\Users\Default.L-HCG-9FVVGS3\OneDrive\Desktop\MolecularSandbox\public\models"

def read_glb(path):
    with open(path, "rb") as f:
        header = f.read(12)
        magic, version, total_len = struct.unpack("<4sII", header)
        if magic != b"glTF": return None, None
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

def png_dims(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    w, h = struct.unpack(">II", data[16:24])
    return w, h
results = []
for fn in sorted(os.listdir(MODELS_DIR)):
    if not fn.lower().endswith(".glb"):
        continue
    path = os.path.join(MODELS_DIR, fn)
    try:
        gltf, bin_data = read_glb(path)
        if gltf is None:
            continue
        images = gltf.get("images", [])
        buffer_views = gltf.get("bufferViews", [])
        total_img_bytes = 0
        dims_list = []
        for img in images:
            bv_idx = img.get("bufferView")
            if bv_idx is not None and bin_data is not None:
                bv = buffer_views[bv_idx]
                off = bv.get("byteOffset", 0)
                length = bv["byteLength"]
                total_img_bytes += length
                chunk = bin_data[off:off+length]
                d = png_dims(chunk)
                if d:
                    dims_list.append(d)
        maxd = max([max(w,h) for w,h in dims_list], default=0)
        results.append((fn, len(images), total_img_bytes, maxd, dims_list[:3]))
    except Exception as e:
        results.append((fn, -1, -1, -1, str(e)))

results.sort(key=lambda r: -r[2])
total_all = sum(r[2] for r in results if r[2] > 0)
print(f"TOTAL_EMBEDDED_IMAGE_BYTES_ACROSS_ALL_MODELS={total_all/1024/1024:.1f}MB")
print(f"MODEL_COUNT={len(results)}")
print("--- top 25 by embedded image size ---")
for fn, cnt, sz, maxd, dims in results[:25]:
    if cnt == -1:
        print(f"{fn}\tERROR")
    else:
        print(f"{fn}\timages={cnt}\tbytes={sz/1024/1024:.2f}MB\tmax_res_seen={maxd}\tsample={dims}")
