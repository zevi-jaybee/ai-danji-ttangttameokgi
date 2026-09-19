# AI와 함께하는 단지계획 땅따먹기

QGIS 4.2에 Claude Code를 붙여(QGIS MCP 플러그인) 부여 군수리 대상지의 **도로·가구·획지를 문장으로 그리고, 조서와 제원표를 자동으로 내는** 학생 매뉴얼입니다.
한국전통문화대학교 전통건축학과 설계스튜디오 III (2026-2).

- 매뉴얼: `index.html` (GitHub Pages로 열면 그대로 웹페이지)
- 데모 파일: `demo/` — A1 부지에서 실제로 돌린 결과

## 데모 파일 쓰는 법

1. LMS에서 받은 `buyeo_3km_studio3.zip`을 푼 폴더(`buyeo_3km/`)에 `demo/` 안의 파일을 그대로 복사합니다.
2. `buyeo_3km_A1_demo.qgz`를 QGIS로 엽니다. 배포 레이어 위에 「A1 계획 (데모)」 그룹(도로중심선·도로면·가구·획지·용지)이 올라옵니다.
3. `조서/`의 CSV 4종과 `A1_계획_데모_A3.pdf`가 그 결과입니다. `plan_A1_demo_cad.dxf`는 AutoCAD에서 열리는 것을 확인한 판입니다.
4. `tools/demo_setup.py`(스타일·레이아웃)와 `tools/demo_pipeline.py`(도로면→가구→획지→용지→조서)는 Claude가 대화 중에 만든 코드를 정리한 것입니다. QGIS MCP의 `execute_code`에서 `exec(open(경로, encoding="utf-8").read())`로 실행합니다. 프로젝트(qgz)와 같은 폴더의 `plan_A1_demo.gpkg`를 읽고 씁니다.

## 확인 환경

2026-09-19 · QGIS 4.2.1 (Qt 6.11, Python 3.12) · QGIS MCP 플러그인 0.14.1 · 서버 v0.14.1 · Claude Code.
대상지 데이터(연속지적도·도시계획·용도지역지구)는 국토교통부 브이월드, 사적·매장문화재는 국가유산청 자료입니다. 배포 데이터 자체는 이 저장소에 없습니다(LMS 배포).

데모 계획안은 절차를 보이기 위한 것이지 제안이 아닙니다.
