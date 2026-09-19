# -*- coding: utf-8 -*-
"""
A1 계획 데모 파이프라인 — QGIS MCP execute_code 안에서 exec 로 실행한다.
  01_도로중심선(직접 그린 선, 위계·노선·폭원) →
  02_도로면(폭원/2 평탄 버퍼 ∪, 부지로 자름, 완충녹지 제외) →
  03_가구(부지 − 도로면 − 완충녹지, 번호·면적·장변·단변) →
  04_획지(전면=도로에 닿는 가장 긴 변, 전면폭 14 m, 반대편도 도로면 두 줄) →
  05_용지(용도별 합) → 조서 4종 + 토지이용제원표 CSV
면적은 전부 EPSG:5186 에서 잰다. 이 스크립트는 Claude 가 대화 중에 만든 코드를 정리한 것이다.
"""
from qgis.core import (QgsProject, QgsGeometry, QgsFeature, QgsPointXY, QgsCoordinateReferenceSystem,
                       QgsCoordinateTransform, Qgis)
import math, csv, io, os

SITE_NAME = "A1"
SITE_AREA = 55514.0                    # 학기 분모 (㎡)
GREEN_BUFFER = 10.0                    # 대로1류 변 완충녹지 폭 (m)
W_TARGET, A_TARGET, D_MIN = 14.0, 350.0, 20.0
BLOCK_USE = {"B08": "상업", "B05": "공원", "B09": "공용·커뮤니티"}   # 나머지는 주거
NON_RES = set(BLOCK_USE.values())
OUT_DIR = os.path.join(QgsProject.instance().homePath(), "조서_A1_demo")   # 프로젝트 폴더 아래에 CSV 를 쓴다

from qgis.utils import iface
proj = QgsProject.instance()
# 캔버스가 그리는 중에 같은 레이어를 편집하면 QGIS 가 죽는다(access violation). 편집 동안 화면을 멈춘다.
iface.mapCanvas().stopRendering(); iface.mapCanvas().freeze(True)
L = {n: proj.mapLayersByName(n)[0] for n in ["01_도로중심선", "02_도로면", "03_가구", "04_획지", "05_용지"]}
site_l = proj.mapLayersByName("01_부지경계")[0]; roads04 = proj.mapLayersByName("04_도시계획도로")[0]
site = [f for f in site_l.getFeatures() if f['부지'] == SITE_NAME][0].geometry()
c5186 = QgsCoordinateReferenceSystem("EPSG:5186"); tr = QgsCoordinateTransform(site_l.crs(), c5186, proj)

def g86(g):
    g2 = QgsGeometry(g); g2.transform(tr); return g2
def a86(g): return g86(g).area()
def clear(layer):
    layer.startEditing(); layer.deleteFeatures([f.id() for f in layer.getFeatures()])
def segments(geom):
    if geom.isEmpty(): return []
    parts = geom.asGeometryCollection() if geom.isMultipart() else [geom]
    return [QgsGeometry(p) for p in parts if p.length() > 0.5]

# ── 1. 중심선을 부지로 자른다 ─────────────────────────────────────────
cl = L["01_도로중심선"]; cl.startEditing()
for f in cl.getFeatures():
    cl.changeGeometry(f.id(), f.geometry().intersection(site))
cl.commitChanges()

# ── 2. 도로면 · 완충녹지 ───────────────────────────────────────────────
bufs = [f.geometry().buffer(float(f['폭원'])/2, 8, Qgis.EndCapStyle.Flat, Qgis.JoinStyle.Miter, 2.0) for f in cl.getFeatures()]
road = QgsGeometry.unaryUnion(bufs).intersection(site)
big = QgsGeometry.unaryUnion([f.geometry() for f in roads04.getFeatures() if f['등급'] == '대로1류' and f.geometry().distance(site) < 0.5])
green = big.buffer(GREEN_BUFFER, 8).intersection(site).difference(road)
road = road.difference(green)
clear(L["02_도로면"]); ft = QgsFeature(L["02_도로면"].fields()); ft.setGeometry(road); ft['용도'] = '도로'; ft['면적'] = round(a86(road), 1)
L["02_도로면"].addFeature(ft); L["02_도로면"].commitChanges()

# ── 3. 가구 ────────────────────────────────────────────────────────────
blocks = site.difference(road).difference(green)
parts = [QgsGeometry(p) for p in blocks.asGeometryCollection()] if blocks.isMultipart() else [blocks]
dropped = [round(p.area(), 1) for p in parts if p.area() <= 50]
parts = [p for p in parts if p.area() > 50]
parts.sort(key=lambda g: (-round(g.centroid().asPoint().y()/40), g.centroid().asPoint().x()))
clear(L["03_가구"])
for i, g in enumerate(parts, 1):
    bb = g.orientedMinimumBoundingBox(); w, h = sorted([bb[3], bb[4]], reverse=True)
    ft = QgsFeature(L["03_가구"].fields()); ft.setGeometry(g)
    code = f"B{i:02d}"; ft['가구'] = code; ft['용도'] = BLOCK_USE.get(code, '주거')
    ft['면적'] = round(a86(g), 1); ft['장변'] = round(w, 1); ft['단변'] = round(h, 1); ft['획지수'] = 0
    L["03_가구"].addFeature(ft)
L["03_가구"].commitChanges()

# ── 4. 획지 ────────────────────────────────────────────────────────────
bl, lt = L["03_가구"], L["04_획지"]
outer = QgsGeometry.unaryUnion([f.geometry() for f in roads04.getFeatures()])
roadzone = QgsGeometry.unaryUnion([road.buffer(0.05, 4), outer.buffer(0.3, 4)])
clear(lt); bl.startEditing(); report = []
for bf in bl.getFeatures():
    g = bf.geometry()
    if bf['용도'] in NON_RES:
        bl.changeAttributeValue(bf.id(), bl.fields().indexOf('획지수'), 0); continue
    touch = QgsGeometry(g.constGet().boundary()).intersection(roadzone)
    edges = []
    for s in segments(touch):
        pts = s.asPolyline() if not s.isMultipart() else s.asMultiPolyline()[0]
        for a, b in zip(pts[:-1], pts[1:]):
            if math.hypot(b.x()-a.x(), b.y()-a.y()) >= 8: edges.append((a, b))
    if not edges:
        report.append((bf['가구'], "도로에 닿는 변이 없음 — 나누지 않음")); continue
    verts = [QgsPointXY(v) for v in g.vertices()]; c = g.centroid().asPoint()
    cands = []
    for p0, p1 in edges:                       # 전면 후보마다 깊이와 두 줄 가능 여부를 본다
        ux, uy = p1.x()-p0.x(), p1.y()-p0.y(); Ln = math.hypot(ux, uy); ux, uy = ux/Ln, uy/Ln
        vx, vy = -uy, ux
        if (c.x()-p0.x())*vx + (c.y()-p0.y())*vy < 0: vx, vy = -vx, -vy
        us = [(q.x()-p0.x())*ux + (q.y()-p0.y())*uy for q in verts]; vs = [(q.x()-p0.x())*vx + (q.y()-p0.y())*vy for q in verts]
        u0, u1, v0, D = min(us), max(us), min(vs), max(vs)-min(vs)
        far = QgsPointXY(p0.x() + ux*(u0+u1)/2 + vx*(v0+D-0.3), p0.y() + uy*(u0+u1)/2 + vy*(v0+D-0.3))
        two = (D >= 2*D_MIN) and roadzone.distance(QgsGeometry.fromPointXY(far)) < 1.0
        cands.append((two, Ln, p0, ux, uy, vx, vy, u0, u1, v0, D))
    # 획지 깊이가 목표(A_TARGET/W_TARGET ≈ 25 m)에 가장 가까워지는 전면을 고른다. 같으면 긴 변.
    D_GOAL = A_TARGET / W_TARGET
    two, Ln, p0, ux, uy, vx, vy, u0, u1, v0, D = min(cands, key=lambda t: (abs((t[10]/2 if t[0] else t[10]) - D_GOAL), -t[1]))
    depth = D/2 if two else D
    w = W_TARGET if two else max(W_TARGET, A_TARGET/depth)
    n = max(1, round((u1-u0)/w)); w = (u1-u0)/n
    lines = [QgsGeometry.fromPolylineXY([QgsPointXY(p0.x()+ux*(u0+w*i)+vx*(v0-5), p0.y()+uy*(u0+w*i)+vy*(v0-5)),
                                        QgsPointXY(p0.x()+ux*(u0+w*i)+vx*(v0+D+5), p0.y()+uy*(u0+w*i)+vy*(v0+D+5))]) for i in range(1, n)]
    if two:
        m = v0 + D/2
        lines.append(QgsGeometry.fromPolylineXY([QgsPointXY(p0.x()+ux*(u0-5)+vx*m, p0.y()+uy*(u0-5)+vy*m), QgsPointXY(p0.x()+ux*(u1+5)+vx*m, p0.y()+uy*(u1+5)+vy*m)]))
    noded = QgsGeometry.unaryUnion([QgsGeometry(g.constGet().boundary())] + lines)   # 선을 노드 처리해야 polygonize 가 나눈다
    lots = [QgsGeometry(p) for p in QgsGeometry.polygonize([noded]).asGeometryCollection() if g.contains(QgsGeometry(p).pointOnSurface())]
    lots.sort(key=lambda q: ((q.centroid().asPoint().x()-p0.x())*vx + (q.centroid().asPoint().y()-p0.y())*vy > v0 + D/2,
                             (q.centroid().asPoint().x()-p0.x())*ux + (q.centroid().asPoint().y()-p0.y())*uy))
    k = 0
    for q in lots:
        area = a86(q)
        if area < 20: report.append((bf['가구'], f"20㎡ 미만 조각 {area:.1f}㎡ 버림")); continue
        k += 1
        touch_q = segments(QgsGeometry(q.constGet().boundary()).intersection(roadzone))
        jeopdo = sum(s.length() for s in touch_q)                       # 접도연장 = 도로에 닿는 길이 전부
        straight = []                                                     # 전면폭 = 도로에 닿는 가장 긴 '직선' 변 (모퉁이 획지는 두 변이 이어지므로)
        for s in touch_q:
            pts = s.asPolyline() if not s.isMultipart() else s.asMultiPolyline()[0]
            straight += [math.hypot(b.x()-a.x(), b.y()-a.y()) for a, b in zip(pts[:-1], pts[1:])]
        fr = max(straight) if straight else 0.0; dp = area/fr if fr > 0.5 else depth
        ft = QgsFeature(lt.fields()); ft.setGeometry(q)
        ft['번호'] = f"{bf['가구']}-{k:02d}"; ft['가구'] = bf['가구']; ft['면적'] = round(area, 1)
        ft['전면폭'] = round(fr, 1); ft['깊이'] = round(dp, 1); ft['세장비'] = round(dp/fr, 2) if fr > 0.5 else None
        ft['접도연장'] = round(jeopdo, 1); ft['맹지'] = bool(jeopdo < 1.0)
        ft['획지유형'] = '기준 미달' if area < 140 else ('기준 초과' if area >= 660 else ('소' if area < 250 else ('중' if area < 400 else '대')))
        lt.addFeature(ft)
    bl.changeAttributeValue(bf.id(), bl.fields().indexOf('획지수'), k)
    report.append((bf['가구'], f"{'두 줄' if two else '한 줄'} · 전면폭 {w:.1f} m · 깊이 {depth:.1f} m · {k}필지"))
lt.commitChanges(); bl.commitChanges()

# ── 5. 용지 ────────────────────────────────────────────────────────────
lu = L["05_용지"]; clear(lu)
groups = {}
for f in bl.getFeatures(): groups.setdefault(f['용도'], []).append(f.geometry())
groups['도로'] = [road]; groups['완충녹지'] = [green]
for k, gs in groups.items():
    g = QgsGeometry.unaryUnion(gs); ft = QgsFeature(lu.fields()); ft.setGeometry(g); ft['용지'] = k; ft['면적'] = round(a86(g), 1); lu.addFeature(ft)
lu.commitChanges()

# ── 6. 조서 · 제원표 CSV (UTF-8 BOM) ───────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
def wcsv(name, header, rows):
    with io.open(os.path.join(OUT_DIR, name), "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh); w.writerow(header); w.writerows(rows)
rows, s_len, s_wl = [], 0.0, 0.0
for f in cl.getFeatures():
    ln = g86(f.geometry()).length(); wl = ln*float(f['폭원']); s_len += ln; s_wl += wl
    rows.append([f['노선'], f['위계'], f['폭원'], round(ln, 1), round(wl, 1)])
rows.sort()
rows += [["합계", "", "", round(s_len, 1), round(s_wl, 1)], ["도로면 도형 실측", "", "", "", round(a86(road), 1)], ["차이(교차부 중복·녹지 절단)", "", "", "", round(s_wl-a86(road), 1)]]
wcsv("도로조서.csv", ["노선", "위계", "폭원_m", "연장_m", "폭원×연장_㎡"], rows)
wcsv("가구조서.csv", ["가구", "용도", "면적_㎡", "장변_m", "단변_m", "획지수"], [[f['가구'], f['용도'], f['면적'], f['장변'], f['단변'], f['획지수']] for f in sorted(bl.getFeatures(), key=lambda x: x['가구'])])
wcsv("획지조서.csv", ["번호", "가구", "획지유형", "면적_㎡", "전면폭_m", "깊이_m", "세장비", "접도연장_m", "맹지"],
     [[f['번호'], f['가구'], f['획지유형'], f['면적'], f['전면폭'], f['깊이'], f['세장비'], f['접도연장'], '예' if f['맹지'] else ''] for f in sorted(lt.getFeatures(), key=lambda x: x['번호'])])
order = ["주거", "상업", "공용·커뮤니티", "공원", "완충녹지", "도로"]
name = {"주거": "주택건설용지", "상업": "상업·업무용지", "공용·커뮤니티": "공공·커뮤니티시설용지", "공원": "공원", "완충녹지": "녹지(완충)", "도로": "도로"}
areas = {f['용지']: f['면적'] for f in lu.getFeatures()}
rows, tot = [], 0.0
for k in order:
    a = areas.get(k, 0.0); tot += a; rows.append([name[k], round(a, 1), round(100*a/SITE_AREA, 1)])
rows += [["미배분", round(SITE_AREA-tot, 1), round(100*(SITE_AREA-tot)/SITE_AREA, 2)], [f"합계(분모 {SITE_AREA:,.0f})", SITE_AREA, 100.0]]
wcsv("토지이용제원표_A1.csv", ["용지", "면적_㎡", "비율_%"], rows)

iface.mapCanvas().freeze(False); iface.mapCanvas().refresh()

# ── 7. 요약 출력 ───────────────────────────────────────────────────────
print(f"도로 연장 {s_len:,.1f} m ({s_len/(SITE_AREA/10000):.0f} m/ha) · 폭원×연장 {s_wl:,.1f} ㎡ · 도로면 {a86(road):,.1f} ㎡ ({100*a86(road)/SITE_AREA:.1f}%) · 완충녹지 {a86(green):,.1f} ㎡")
print(f"가구 {bl.featureCount()}개 (버린 조각 {dropped}) · 획지 {lt.featureCount()}개")
for r in report: print("   ", r[0], r[1])
for r in rows: print("   ", r)
n = lt.featureCount(); res = areas.get('주거', 0)
print(f"호수 {n} · 총밀도 {n/(SITE_AREA/10000):.1f} 호/ha (분모 전체) · 순밀도 {n/(res/10000):.1f} 호/ha (분모 주거용지 {res/10000:.3f} ha)")
