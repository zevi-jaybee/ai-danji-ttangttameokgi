# A1 계획 데모 레이어를 프로젝트에 올리고 스타일·레이아웃을 만든다 (execute_code 에서 exec 로 실행)
from qgis.core import (QgsProject, QgsVectorLayer, QgsFillSymbol, QgsLineSymbol, QgsSingleSymbolRenderer,
                       QgsCategorizedSymbolRenderer, QgsRendererCategory, QgsPalLayerSettings,
                       QgsVectorLayerSimpleLabeling, QgsTextFormat, QgsPrintLayout, QgsLayoutItemMap,
                       QgsLayoutItemLabel, QgsLayoutItemLegend, QgsLayoutItemScaleBar, QgsLayoutSize,
                       QgsLayoutPoint, QgsUnitTypes, QgsRectangle, QgsLayerTree)
from qgis.PyQt.QtGui import QColor, QFont
from qgis.utils import iface

import os
GPKG = os.path.join(QgsProject.instance().homePath(), "plan_A1_demo.gpkg")   # 열려 있는 프로젝트(qgz) 폴더의 파일
NAMES = ["01_도로중심선", "03_가구", "04_획지", "02_도로면", "05_용지"]   # 위→아래 표시 순서
proj = QgsProject.instance()
root = proj.layerTreeRoot()
grp = root.findGroup("A1 계획 (데모)")
if grp is None:
    grp = root.insertGroup(0, "A1 계획 (데모)")
L = {}
for n in NAMES:
    ex = proj.mapLayersByName(n)
    if ex:
        L[n] = ex[0]
    else:
        v = QgsVectorLayer(f"{GPKG}|layername={n}", n, "ogr")
        proj.addMapLayer(v, False); grp.addLayer(v); L[n] = v

def label(layer, field, size, color="#333333", bold=False):
    st = QgsPalLayerSettings(); st.fieldName = field
    tf = QgsTextFormat(); f = QFont("Malgun Gothic"); f.setBold(bold); tf.setFont(f); tf.setSize(size); tf.setColor(QColor(color))
    st.setFormat(tf); layer.setLabeling(QgsVectorLayerSimpleLabeling(st)); layer.setLabelsEnabled(True)

cats = []
for v, col, w in [("1 어귀길", "#b30000", "1.2"), ("2 안길", "#e6550d", "1.0"), ("3 샛길", "#3182bd", "0.8"), ("4 골목", "#31a354", "0.6")]:
    cats.append(QgsRendererCategory(v, QgsLineSymbol.createSimple({'color': col, 'width': w}), v))
L["01_도로중심선"].setRenderer(QgsCategorizedSymbolRenderer("위계", cats))
L["02_도로면"].setRenderer(QgsSingleSymbolRenderer(QgsFillSymbol.createSimple({'color': '#d9d9d9', 'outline_color': '#969696', 'outline_width': '0.2'})))
L["03_가구"].setRenderer(QgsSingleSymbolRenderer(QgsFillSymbol.createSimple({'color': '0,0,0,0', 'outline_color': '#7f2704', 'outline_width': '0.7'})))
label(L["03_가구"], "가구", 9, "#000000", True)
cats = []
for v, col in [("소", "255,247,188,160"), ("중", "254,196,79,160"), ("대", "236,112,20,160"), ("기준 미달", "222,45,38,200"), ("기준 초과", "117,107,177,160")]:
    cats.append(QgsRendererCategory(v, QgsFillSymbol.createSimple({'color': col, 'outline_color': '#7f2704', 'outline_width': '0.2'}), v))
L["04_획지"].setRenderer(QgsCategorizedSymbolRenderer("획지유형", cats))
label(L["04_획지"], "번호", 5.5)
cats = []
for v, col in [("주거", "#fff5d6"), ("상업", "#f4a582"), ("공원", "#a6dba0"), ("공용·커뮤니티", "#92c5de"), ("도로", "#d9d9d9"), ("완충녹지", "#74c476")]:
    cats.append(QgsRendererCategory(v, QgsFillSymbol.createSimple({'color': col, 'outline_style': 'no'}), v))
L["05_용지"].setRenderer(QgsCategorizedSymbolRenderer("용지", cats))
for l in L.values():
    l.triggerRepaint()
# 표시 순서 정리
for n in reversed(NAMES):
    node = grp.findLayer(L[n].id())
    if node is not None:
        clone = node.clone(); grp.insertChildNode(0, clone); grp.removeChildNode(node)
# 배경 정리: 지적·편입필지·변경안은 끈다
for n in ["02_편입필지", "03_연속지적도", "01A_부지경계_변경안A_사선", "01B_부지경계_변경안B_수평"]:
    for l in proj.mapLayersByName(n):
        node = root.findLayer(l.id())
        if node: node.setItemVisibilityChecked(False)

# 레이아웃 A3
lm = proj.layoutManager(); name = "A1 계획 데모 A3"
for l in lm.printLayouts():
    if l.name() == name: lm.removeLayout(l)
lay = QgsPrintLayout(proj); lay.initializeDefaults(); lay.setName(name); lm.addLayout(lay)
lay.pageCollection().page(0).setPageSize(QgsLayoutSize(420, 297, QgsUnitTypes.LayoutMillimeters))
m = QgsLayoutItemMap(lay); m.attemptMove(QgsLayoutPoint(10, 22, QgsUnitTypes.LayoutMillimeters)); m.attemptResize(QgsLayoutSize(300, 265, QgsUnitTypes.LayoutMillimeters))
m.setExtent(QgsRectangle(946520, 1808240, 946910, 1808560)); m.setScale(1500); lay.addLayoutItem(m)
t = QgsLayoutItemLabel(lay); t.setText("A1 토지이용·가구·획지 계획 (데모) — 축척 1:1,500 · EPSG:5179 · 면적은 EPSG:5186"); t.setFont(QFont("Malgun Gothic", 16))
t.attemptMove(QgsLayoutPoint(10, 8, QgsUnitTypes.LayoutMillimeters)); t.attemptResize(QgsLayoutSize(300, 12, QgsUnitTypes.LayoutMillimeters)); lay.addLayoutItem(t)
lg = QgsLayoutItemLegend(lay); lg.setTitle("범례"); lg.setLinkedMap(m); lg.setAutoUpdateModel(False)
tree = QgsLayerTree()
for n in ["01_도로중심선", "04_획지", "03_가구", "05_용지"]:
    tree.addLayer(L[n])
lg.model().setRootGroup(tree)
lg.attemptMove(QgsLayoutPoint(320, 22, QgsUnitTypes.LayoutMillimeters)); lg.attemptResize(QgsLayoutSize(90, 200, QgsUnitTypes.LayoutMillimeters)); lay.addLayoutItem(lg)
sb = QgsLayoutItemScaleBar(lay); sb.setLinkedMap(m); sb.applyDefaultSettings(); sb.setStyle('Single Box'); sb.setUnits(QgsUnitTypes.DistanceMeters)
sb.setUnitsPerSegment(40); sb.setNumberOfSegments(3); sb.setNumberOfSegmentsLeft(0); sb.setUnitLabel('m')
sb.attemptMove(QgsLayoutPoint(318, 262, QgsUnitTypes.LayoutMillimeters)); lay.addLayoutItem(sb)
iface.mapCanvas().setExtent(QgsRectangle(946520, 1808248, 946904, 1808546)); iface.mapCanvas().refresh()
print("demo layers:", [c.name() for c in grp.children()], "| layout:", name)
