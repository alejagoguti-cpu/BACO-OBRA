# -*- coding: utf-8 -*-
# Exporta las redes MEP del Piso 2 (1001_Hotel_la_fotona_redes.rvt) a JSON. SOLO LECTURA.
# Coordenadas convertidas al marco de HLF_P2-P6.rvt: el vinculo arquitectonico esta desplazado
# (-60, -330000) mm dentro del modelo de redes, asi que arq = redes + (0.06, 330.0) m.
# Salida: C:\Users\aleja\Documents\BACO-OBRA\build\mep_p2.json
#   { grupos: { af:{V,T,n}, acs:..., san:..., rci:..., conduit:..., aparatos:..., luminarias:..., sanitarios:..., ductos:... } }
from Autodesk.Revit.DB import *
import json, io, os
OUT = r"C:\Users\aleja\Documents\BACO-OBRA\build"
if not os.path.isdir(OUT): os.makedirs(OUT)
F = 0.3048
DX, DY = 0.06, 330.0
opt = Options(); opt.DetailLevel = ViewDetailLevel.Medium; opt.ComputeReferences = False; opt.IncludeNonVisibleObjects = False

def sistema(e):
    for bip in (BuiltInParameter.RBS_SYSTEM_CLASSIFICATION_PARAM, BuiltInParameter.RBS_SYSTEM_NAME_PARAM, BuiltInParameter.RBS_PIPING_SYSTEM_TYPE_PARAM):
        try:
            p = e.get_Parameter(bip)
            if p is not None:
                s = p.AsString() or p.AsValueString() or ""
                if s: return s.lower()
        except Exception:
            pass
    return ""

def grupo_tuberia(e):
    s = sistema(e)
    if any(k in s for k in ("fire", "incend", "rci", "sprink", "rociad")): return "rci"
    if any(k in s for k in ("hot", "calient", "acs")): return "acs"
    if any(k in s for k in ("cold", "fria", "fr\xeda", "af ", "potable")): return "af"
    if any(k in s for k in ("sanit", "vent", "desag", "aguas negras", "aguas lluvia", "storm")): return "san"
    return "otras"

CATS = [
    (BuiltInCategory.OST_PipeCurves, None), (BuiltInCategory.OST_PipeFitting, None), (BuiltInCategory.OST_PipeAccessory, None),
    (BuiltInCategory.OST_FlexPipeCurves, None),
    (BuiltInCategory.OST_Sprinklers, "rci"), (BuiltInCategory.OST_PlumbingFixtures, "sanitarios"),
    (BuiltInCategory.OST_Conduit, "conduit"), (BuiltInCategory.OST_ConduitFitting, "conduit"),
    (BuiltInCategory.OST_ElectricalFixtures, "aparatos"), (BuiltInCategory.OST_LightingDevices, "aparatos"),
    (BuiltInCategory.OST_ElectricalEquipment, "aparatos"), (BuiltInCategory.OST_DataDevices, "aparatos"),
    (BuiltInCategory.OST_LightingFixtures, "luminarias"),
    (BuiltInCategory.OST_DuctCurves, "ductos"), (BuiltInCategory.OST_DuctFitting, "ductos"), (BuiltInCategory.OST_DuctTerminal, "ductos"),
    (BuiltInCategory.OST_FlexDuctCurves, "ductos"), (BuiltInCategory.OST_CableTray, "conduit"), (BuiltInCategory.OST_CableTrayFitting, "conduit"),
]
G = {}
def buf(g):
    if g not in G: G[g] = {"V": [], "T": [], "n": 0}
    return G[g]

def volcar(geo, V, T):
    for g in geo:
        if isinstance(g, Solid):
            if g.Faces.Size == 0: continue
            for f in g.Faces:
                m = f.Triangulate(0.0)
                if m is None: continue
                base = len(V) // 3
                for p in m.Vertices: V.extend((round(p.X * F + DX, 3), round(p.Y * F + DY, 3), round(p.Z * F, 3)))
                for i in range(m.NumTriangles):
                    t = m.get_Triangle(i)
                    T.extend((base + int(t.get_Index(0)), base + int(t.get_Index(1)), base + int(t.get_Index(2))))
        elif isinstance(g, GeometryInstance):
            volcar(g.GetInstanceGeometry(), V, T)
        elif isinstance(g, Mesh):
            base = len(V) // 3
            for p in g.Vertices: V.extend((round(p.X * F + DX, 3), round(p.Y * F + DY, 3), round(p.Z * F, 3)))
            for i in range(g.NumTriangles):
                t = g.get_Triangle(i)
                T.extend((base + int(t.get_Index(0)), base + int(t.get_Index(1)), base + int(t.get_Index(2))))

fallos = 0; fuera = 0; zs = []; SIS = {}
for c, fijo in CATS:
    for e in FilteredElementCollector(doc).OfCategory(c).WhereElementIsNotElementType().ToElements():
        bb = e.get_BoundingBox(None)
        if bb is None: continue
        z0 = bb.Min.Z * F
        if z0 < 1.0 or z0 > 8.5:  # solo el Piso 2 (elev 3,0 m, cielo hasta ~7 m)
            fuera += 1; continue
        if fijo is None:
            k = sistema(e); SIS[k] = SIS.get(k, 0) + 1
        g = fijo or grupo_tuberia(e)
        if fijo == "rci": g = "rci"
        b = buf(g)
        try:
            geo = e.get_Geometry(opt)
            if geo is not None:
                volcar(geo, b["V"], b["T"]); b["n"] += 1
        except Exception:
            fallos += 1
res = {"fuente": doc.Title, "marco": "HLF_P2-P6 (m, Z arriba)", "grupos": G}
with io.open(OUT + r"\mep_p2.json", "w", encoding="utf-8") as fh:
    fh.write(json.dumps(res, separators=(",", ":")))
__output__ = {"grupos": dict((k, [v["n"], len(v["T"]) // 3]) for k, v in G.items()), "fuera_de_piso2": fuera, "fallos": fallos, "sistemas": SIS}
