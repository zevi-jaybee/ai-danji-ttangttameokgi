const storageKey = 'danji-student-v1';
const emptyState = () => ({ step: 0, done: [], notes: {} });
let state = emptyState();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') {
    state.step = Number.isInteger(saved.step) && saved.step >= 0 && saved.step < 6 ? saved.step : 0;
    state.done = Array.isArray(saved.done) ? [...new Set(saved.done.filter(n => Number.isInteger(n) && n >= 0 && n < 6))] : [];
    state.notes = saved.notes && typeof saved.notes === 'object' ? saved.notes : {};
  }
} catch { /* A blocked storage area must not block the lesson. */ }

const lessons = [
  {
    title: '실습 환경 준비', heading: '설치 점검은 Codex에게.',
    lead: '로컬 Codex에서 실습 폴더를 열고 아래 요청문을 보냅니다. QGIS나 uv가 이미 있다면 설치 상태부터 확인하게 합니다.',
    actions: ['Codex를 실행하고 본인 계정으로 로그인합니다. 계정에서 로컬 작업을 사용할 수 있는지 확인합니다.', '배포 ZIP을 내 PC의 실습 폴더에 풀고, 그 폴더를 Codex 프로젝트로 추가해 로컬 작업을 엽니다. 현재 폴더 경로와 파일 목록을 요청해 실제 배포 파일이 보이는지 확인합니다.', '아래 요청문으로 설치를 마친 뒤 QGIS를 켜고 실습 QGZ를 엽니다. QGIS MCP 서버가 실행된 상태에서 다음 단계의 연결 점검을 진행합니다.'],
    prompt: `이 Windows PC를 QGIS 단지계획 실습 환경으로 준비해 줘. 설치와 명령 실행은 네가 진행하고, 내가 직접 해야 하는 조작만 짧게 알려 줘.

1. 먼저 OS, QGIS 설치 경로와 버전, 활성 QGIS 사용자 프로필, uv·uvx 실행 가능 여부, 로컬 Codex의 QGIS MCP 등록 상태를 확인해. 이미 있는 것은 재설치하지 마.
2. 필요한 도구는 공식 배포처에서 설치해. 이 수업은 QGIS 4.2.1 또는 4.2.2 중 어느 버전이든 사용할 수 있어. 둘 중 하나가 이미 있으면 유지하고, 없으면 공식 배포처에서 해당 버전을 확인해 설치해. 다른 버전이 이미 있으면 임의로 교체하지 말고 차이를 먼저 알려 줘.
3. QGIS MCP 플러그인은 반드시 필요해. 공식 QGIS 플러그인 저장소와 제작자 Nicolas Karasiak을 확인하고 활성 사용자 프로필에 설치·활성화까지 처리해. 자동 처리가 불가능한 경우에만 학생에게 플러그인 관리 및 설치 → QGIS MCP 검색 → 설치·활성화 순서를 안내해. 이미 처리됐다면 학생에게 중복 설치를 시키지 마. 활성 프로필을 식별할 수 없다면 추측하지 말고 필요한 질문만 해. QGIS MCP 플러그인과 외부 MCP 서버의 버전을 맞춰. 실제 연결 확인 사례는 QGIS 4.2.1 / 양쪽 MCP 0.14.1이며 4.2.2에서의 실제 연결은 해당 PC에서 검사해.
4. 기존 Codex 설정을 백업하고 다른 항목을 보존한 채 QGIS MCP를 등록해. uvx의 실제 경로를 확인하고 서버 패키지 버전을 플러그인과 맞춰 고정해. main 브랜치를 무조건 최신으로 설치하지 마. 현재 Codex에 설정 화면 또는 CLI가 있는지 확인해서 사용하고, CLI가 없다는 이유만으로 추가 개발도구를 일괄 설치하지 마.
5. 필요한 다운로드·설정 쓰기 권한은 해당 작업에 한해 요청해. 관리자 승인, 로그인, 약관 동의, 앱 재시작처럼 내가 해야 하는 조작은 그 시점에 알려 줘.
6. QGIS MCP Setup & Configurator에서는 Client codex, 최신 서버 무조건 받기 해제, QGIS 시작 시 서버 자동 시작을 확인해. 연결 프로그램은 설치된 플러그인과 맞는 버전으로 지정해. 이미 등록된 설정은 중복 추가하지 마. 연결 도구가 현재 작업에서 보이면 ping과 diagnose를 실행해. 재시작이 필요하면 다음 작업에서 쓸 연결 확인 요청문을 남겨. 실행하지 못한 검사는 성공으로 기록하지 마.

마지막에 설치·변경한 항목, 실제 버전, 검사 결과, 아직 내가 할 일을 짧게 정리해. 설계 데이터는 편집하지 마.`,
    success: 'QGIS가 실행되고, uvx 경로와 MCP 등록 상태가 확인됩니다. 재시작 요청이 있다면 마친 뒤 다음 단계에서 연결을 확인합니다.',
    note: '설치 도중 관리자 승인이나 재시작이 필요하면 Codex의 안내를 따르세요. 학교 PC의 설치 제한은 담당자에게 확인합니다.'
  },
  {
    title: '연결 확인', heading: '“연결됐어요”를 확인하기.',
    lead: 'QGIS와 실습 프로젝트를 먼저 열고 MCP 서버를 켠 뒤, QGIS를 켜둔 상태에서 Codex로 연결을 확인합니다.',
    actions: ['QGIS를 먼저 실행하고 실습 폴더의 QGZ를 엽니다. 로딩이 끝날 때까지 기다리고, 여러 창이 열려 있다면 저장 후 실습할 창만 남깁니다.', 'QGIS MCP 아이콘에서 서버가 실행 중인지 확인합니다. QGIS와 프로젝트는 열린 상태로 둡니다.', 'Codex에서 같은 실습 폴더의 로컬 작업을 열고 아래 요청문을 보냅니다. 자료가 없다면 빈 프로젝트로 연결부터 확인하고 자료 확인은 나중에 합니다.'],
    prompt: `QGIS를 켜두었어. 현재 Codex 작업 폴더와 QGIS에서 열린 프로젝트가 같은 실습 자료를 가리키는지 확인하고, QGIS MCP 연결을 점검해 줘. 문제가 있으면 원인을 찾아 연결 설정을 고쳐 줘.
ping → diagnose → 현재 프로젝트 정보 → 전체 레이어 목록 순서로 확인해.
서버와 플러그인 버전, 다른 클라이언트의 버전 불일치도 구분해 보고해.
레이어 목록은 응답의 total_count와 받은 개수를 비교하고, 잘렸으면 다음 페이지까지 읽어.
열린 프로젝트가 내가 작업하려는 배포본인지 파일명과 레이어명으로 확인하게 해 줘.
레이어가 비어 있다면 연결 실패로 단정하지 말고, 프로젝트가 아직 안 열린 것인지 구분해.
도구가 없거나 호출하지 못했다면 실제 검사에 성공했다고 말하지 마. 수정한 설정과 다시 검사한 결과를 알려 줘.`,
    success: '실제 ping 응답, 진단 결과, 열어둔 프로젝트의 레이어 이름이 확인됩니다. 비어 있는 프로젝트라면 자료를 연 뒤 다시 읽습니다.',
    note: '현재 제작 PC에서는 이 연결의 서버·플러그인 0.14.1 일치와 레이어 읽기를 확인했습니다. 학생 PC에서는 별도로 확인해야 합니다.'
  },
  {
    title: '대상지 읽기', heading: '그리기 전에, 무엇을 아는가.',
    lead: '경계와 자료의 의미를 먼저 읽습니다. 아직 확정되지 않은 설계조건은 그대로 남겨둡니다.',
    actions: ['배포자료에서 대상 경계와 자료 버전을 확인합니다.', '지도에서 기존 길, 취락, 물길과 주변 도로를 살펴봅니다.', '계획 노트에 알게 된 점을 간단히 적어봅니다. 연습이므로 부담 없이 작성하세요.'],
    prompt: `열린 QGIS 자료를 읽고 대상지 조건표를 만들어 줘. 먼저 레이어 이름, 자료 출처와 날짜, 좌표계, 도형과 속성의 의미, 누락 여부를 정리해.
사용한 경계 레이어명을 밝혀. 기존 예시의 B안이나 면적을 수업 확정 조건으로 쓰지 마. 사용할 경계가 식별되지 않으면 면적 산정은 보류해.
선택한 경계의 면적은 EPSG:5186으로 변환한 도형에서 측정하고, 포함·제외 범위와 측정 방식을 함께 적어. 속성의 면적과 다르면 이유를 확인해.
확인된 사실 / 자료 부족 / 설계자가 결정할 사항으로 나눠. 기존 길, 취락, 구거, 주변 도로와 유산 구역의 관계를 지도에서 설명하되 자료에 없는 현황은 만들지 마.
아직 도로·획지·건물을 생성하지 마.`,
    success: '사용할 경계와 자료가 식별되고, 근거가 있는 사실과 미확인 사항이 구분된 조건표가 나옵니다.',
    note: '화면에서 선이 닿는 것, 실제 통행이 가능한 것, 법적으로 접속할 수 있는 것은 서로 다른 질문입니다.'
  },
  {
    title: '계획 방향 정하기', heading: '마을에 대한 나의 선택.',
    lead: '참고자료에서 읽은 원칙을 대상지에 어떻게 적용할지 생각합니다. AI가 제안한 숫자를 그대로 과제 기준으로 삼지 않습니다.',
    actions: ['설계 조건을 계획 노트에 옮깁니다.', '중요하게 생각하는 공간과 생활, 그 이유를 적습니다.', '서로 다른 방향을 비교하고 하나를 선택하거나 수정합니다.'],
    prompt: `내 계획 노트와 제공된 학습자료를 먼저 읽어 줘. 읽은 파일과 실제 사용한 절을 밝혀 줘.
자료의 주장 → 내 대상지에 대한 해석 → 가능한 공간적 적용을 연결해. 연구의 권장값, 현행 법규, 과제 조건, 내 설계 가정을 구분해.
내가 원하는 생활과 공간을 바탕으로 서로 다른 계획 방향을 제시하고 각 방향의 장점, 포기하는 것, 추가 조사가 필요한 것을 비교해.
주거 목표, 도로 폭, 획지 크기, 보존 범위처럼 미정인 조건은 임의로 확정하지 마. 그림을 만드는 데 가정이 필요하면 그 이유와 대안을 설명하고 내 선택을 받아.
선택한 방향을 설계 원칙과 검토 질문으로 정리해.`,
    success: '각 설계 원칙에 근거나 선택 이유가 있고, 확정 조건과 임시 가정이 구분됩니다.',
    note: '내 계획 노트의 “Codex 요청문 복사”를 사용하면 적어둔 내용까지 함께 전달할 수 있습니다.'
  },
  {
    title: '초안 만들기', heading: '그리드로 가볍게 시작하기.',
    lead: '첫 실습은 단순한 그리드 패턴으로 길·가구·획지의 큰 틀만 만듭니다. 한옥과 마당, 조경의 세부 표현은 다음으로 미룹니다.',
    actions: ['작업 전에 원본 자료와 별도인 계획용 파일을 만듭니다.', '실제 경계와 보존할 공간을 바탕으로 단순한 그리드 초초안을 만듭니다.', '지도에서 길과 획지의 배치를 보고, 바꿀 부분만 골라 수정합니다.'],
    prompt: `선택한 경계와 설계 원칙을 바탕으로 QGIS에 단순한 그리드 패턴의 초초안 하나를 만들어 줘.
원본은 보존하고 별도 계획 GPKG와 QGZ를 만들어. 기존 출력이 있으면 새 버전으로 저장해.
확인된 보존구역은 제외하고 기존 길·물길·취락을 고려해 그리드 방향을 잡아. 보존 범위가 불명확한 곳은 미정 구역으로 남겨. 부지 전체를 무조건 격자로 채우지 마.
길·가구·획지만 단순 도형으로 생성해. 길 면적과 획지 면적은 겹치지 않게 하고, 가구는 획지를 묶는 상위 범위로 구분해 면적에 중복 합산하지 마. 한옥·마당·담장·수목의 상세 도형은 아직 만들지 마.
그리드 간격·도로 폭·획지 크기가 미정이면 이번 테스트의 임시값으로 명시하고 선택 이유를 짧게 남겨. 임시값을 설계 조건이나 법규 적합값으로 취급하지 마.
공통 생성 규칙을 코드로 반복 적용하고, 이미 확인한 자료는 변경이 없으면 다시 읽지 마. 전체 좌표나 WKT는 채팅에 나열하지 말고 파일에 저장해.
도형 유효성·중복·경계 이탈과 획지의 길 접면을 검사해. 경계에서 잘려 생긴 자투리 획지는 검토 대상으로 표시해. 아직 만들지 않은 항목은 검사 대상에서 제외해.
지도 한 장과 핵심 면적표, 사용한 임시값, 다음에 수정할 점만 짧게 보여 줘. 이후에는 요청한 부분만 수정해.`,
    success: '별도 계획 파일에서 길·가구·획지의 큰 틀이 보이고, 임시값과 자투리 획지 등 수정할 부분을 확인할 수 있습니다.',
    note: '그리드는 빠르게 배치를 시험하는 출발점이지 최종 설계의 정답은 아닙니다. 세부 도형·반복 설명·전체 재생성을 줄이는 방식이며, 실제 토큰 사용량의 감소를 보장하지는 않습니다.'
  },
  {
    title: '검토와 저장', heading: '그림과 설명이 같은가.',
    lead: '도형의 오류와 설계 판단의 문제를 나누어 검토합니다. 해결되지 않은 내용도 제출 기록에 남깁니다.',
    actions: ['면적표와 지도를 비교합니다. 각 표가 어떤 범위를 세는지 확인합니다.', '목표 달성 여부와 미검증 사항을 별도로 기록합니다.', '저장한 프로젝트를 재열어 자료 연결을 확인하고 제출물을 정리합니다.'],
    prompt: `현재 계획을 검토해 줘. 먼저 확정 경계, 면적 좌표계, 포함·제외 범위를 다시 적어.
토지이용의 중복·누락·부지 밖 돌출, 무효 도형, 획지 중복, 건물의 획지 이탈을 검사해. 도로 접면과 외부 도로까지의 도형 연결도 별도로 확인해. 허용오차와 측정 방법을 밝혀.
토지이용표는 분모와 합계 차이를 표시해. 획지 수를 곧바로 세대수로 바꾸지 말고 주호 가정을 명시해. 기존 세대수가 모르면 전체 주거 밀도를 확정하지 마.
설계 조건과 내가 정한 목표에 대한 달성·미달·미확인을 구분하고 수정안을 제안해. 아직 생성하지 않은 항목은 검사 대상에서 제외해. 법규, 지형, 배수, 일조, 소방 등 실제로 검증하지 않은 것은 미검증으로 남겨.
지도, 면적표, 설계 근거, 가정, 남은 질문을 함께 저장하고 파일 목록을 만들어. QGZ와 데이터의 연결 및 임시 폴더 의존성을 확인해. 현재 작업을 잃지 않는 방식으로 저장본 재열기 검증을 해.`,
    success: '지도·표·설명서가 같은 버전을 가리키며 저장본이 다시 열립니다. 미달 항목과 미검증 항목이 명시됩니다.',
    note: '각 조서의 합계를 모두 부지 면적과 같게 만들지는 않습니다. 예를 들어 주거 획지표의 합계는 해당 주거용지와 비교합니다.'
  }
];

const issues = {
  connection: ['QGIS 실행 여부, 플러그인 서버 상태, 포트, Codex 등록 순으로 확인합니다.', 'QGIS MCP 연결 실패를 진단해 줘. QGIS 프로세스와 활성 프로필, 플러그인 설치·활성 상태, 서버 포트, uvx 실행 경로, Codex MCP 등록을 순서대로 확인해. 원인을 좁힌 뒤 필요한 항목만 수정해. 진단 없이 전체 재설치나 다른 프로세스 강제 종료를 하지 마.'],
  version: ['현재 연결과 다른 클라이언트의 불일치를 구분합니다. 캐시 삭제부터 시작하지 않습니다.', 'diagnose 결과에서 이 연결의 서버·플러그인 버전과 다른 클라이언트의 버전 불일치를 구분해 줘. 현재 실행 경로와 등록된 패키지 버전을 확인하고, 필요한 쪽만 버전을 맞춰. 다른 작업 중인 클라이언트를 임의로 종료하지 마.'],
  tool: ['설정 등록 뒤에는 서버 또는 앱을 다시 시작해야 할 수 있습니다.', '이 로컬 Codex 작업에서 QGIS MCP 도구가 보이지 않아. 실제로 읽는 설정 파일, 중복 등록, uvx 경로, 서버 시작 오류를 확인해 줘. 필요한 재시작 범위와 다음에 사용할 연결 확인 요청문을 알려 줘. 도구를 호출하지 못한 상태에서 QGIS 연결 성공이라고 답하지 마.'],
  data: ['프로젝트가 비어 있는지, 자료 경로가 끊겼는지, 단지 화면 밖에 있는지 나눠 확인합니다.', '열린 QGIS 프로젝트와 전체 레이어 목록을 읽고 지도 미표시 원인을 확인해 줘. 데이터 경로와 유효성, 표시 여부, 범위, 좌표계를 점검해. 실제 좌표를 확인하지 않은 채 CRS를 덮어 지정하지 마. QGZ와 GPKG의 상대경로 관계도 확인해.'],
  permission: ['Codex 작업 권한, Windows 관리자 승인, 학교 PC 정책은 서로 다릅니다.', '방금 차단된 작업의 오류를 읽고 필요한 권한이 다운로드, 특정 폴더 쓰기, Windows 관리자 승인, 기관 정책 중 무엇인지 구분해 줘. 필요한 작업 범위로만 권한을 요청하고 사용자 영역에서 가능한 방법을 검토해. 실제 차단된 항목과 내가 해야 할 조작만 알려 줘.'],
  design: ['AI가 넣은 숫자나 공간 결정을 자료의 사실과 분리합니다.', '방금 제안한 계획에서 설계 조건, 자료의 사실, 내가 선택한 사항, 네가 임의로 넣은 가정을 나눠 줘. 임의의 호수·폭원·획지 크기·진입 방향·보존 범위를 확정 조건으로 쓰지 마. 각 가정의 이유와 대안을 제시하고 내 선택을 받아 수정해.']
};
const $ = selector => document.querySelector(selector);
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); $('#save-state').textContent = '이 브라우저에 저장되었습니다.'; }
  catch { $('#save-state').textContent = '자동 저장이 제한되어 있습니다. 계획 노트를 내려받으세요.'; }
}
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('복사했습니다. 로컬 Codex에 붙여넣으세요.'); }
  catch { $('#copy-fallback').value = text; $('#copy-dialog').showModal(); $('#copy-fallback').focus(); $('#copy-fallback').select(); }
}
// Lucide Copy icon, ISC license: https://lucide.dev/license
const copyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
function renderLesson() {
  const lesson = lessons[state.step];
  $('#steps').innerHTML = lessons.map((item, index) => `<button class="step" data-step="${index}" ${index === state.step ? 'aria-current="step"' : ''}><span class="step-number">0${index + 1}</span><span>${item.title}</span><span class="step-check" aria-label="${state.done.includes(index) ? '완료' : '미완료'}">${state.done.includes(index) ? '✓' : ''}</span></button>`).join('');
  $('#lesson').innerHTML = `<span class="lesson-kicker">STEP 0${state.step + 1} / ${lesson.title}</span><h3>${lesson.heading}</h3><p class="lead">${lesson.lead}</p><ol class="actions-list">${lesson.actions.map(action => `<li>${action}</li>`).join('')}</ol><div class="prompt-box"><div class="prompt-head"><span>로컬 Codex에 보낼 요청문</span><button class="copy-icon" id="copy-lesson" aria-label="실습 요청문 복사" title="실습 요청문 복사">${copyIcon}</button></div><pre id="lesson-prompt"></pre></div><div class="success"><strong>완료 확인</strong><p>${lesson.success}</p></div><p class="lesson-note">${lesson.note}</p><div class="lesson-bottom"><label class="done"><input id="lesson-done" type="checkbox" ${state.done.includes(state.step) ? 'checked' : ''}>결과를 확인했어요</label><div class="lesson-nav"><button id="prev-step" aria-label="이전 단계" title="이전 단계" ${state.step === 0 ? 'disabled' : ''}>←</button><button id="next-step" aria-label="다음 단계" title="다음 단계" ${state.step === 5 ? 'disabled' : ''}>→</button></div></div>`;
  $('#lesson-prompt').textContent = lesson.prompt;
  $('#copy-lesson').onclick = () => copy(lesson.prompt);
  $('#lesson-done').onchange = event => {
    state.done = state.done.filter(index => index !== state.step);
    if (event.target.checked) state.done.push(state.step);
    save(); updateProgress();
    const mark = $(`[data-step="${state.step}"] .step-check`);
    mark.textContent = event.target.checked ? '✓' : '';
    mark.setAttribute('aria-label', event.target.checked ? '완료' : '미완료');
  };
  $('#prev-step').onclick = () => selectStep(state.step - 1);
  $('#next-step').onclick = () => selectStep(state.step + 1);
  document.querySelectorAll('[data-step]').forEach(button => button.onclick = () => selectStep(Number(button.dataset.step)));
  updateProgress();
}
function selectStep(index) {
  if (index < 0 || index >= lessons.length) return;
  state.step = index; save(); renderLesson();
  $('#lesson').setAttribute('tabindex', '-1');
  $('#lesson').focus({ preventScroll: true });
  $('#lesson').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
function updateProgress() {
  $('#progress').value = state.done.length;
  $('#progress-label').textContent = `완료 ${state.done.length} / 6`;
}
const fields = ['conditions', 'boundary', 'intent', 'unknowns'];
const fieldNames = ['과제에서 확인된 조건', '사용할 자료와 경계', '내가 중요하게 생각하는 것', '추가로 알아야 할 것'];
fields.forEach(key => {
  $(`#${key}`).value = typeof state.notes[key] === 'string' ? state.notes[key] : '';
  $(`#${key}`).addEventListener('input', event => { state.notes[key] = event.target.value; save(); });
});
function brief() {
  return '# 내 단지계획 노트\n\n' + fields.map((key, index) => `## ${fieldNames[index]}\n${$(`#${key}`).value.trim() || '미정'}\n`).join('\n');
}
$('#copy-brief').onclick = () => copy(brief() + '\n위 노트를 읽고 확정 조건·내 의도·미확인 사항을 구분해 줘. 미정 항목을 임의의 숫자로 채우지 말고, 다음에 필요한 질문과 자료를 정리해. 도형 생성은 내 방향 선택 후에 진행해.');
$('#download-notes').onclick = () => {
  const blob = new Blob(['\ufeff' + brief()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = '내_단지계획_노트.md'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('계획 노트 내려받기를 시작했습니다.');
};
$('#brief-form').onsubmit = event => event.preventDefault();
$('#reset').onclick = () => {
  if (!confirm('이 브라우저에 저장한 계획 노트와 진행 기록을 지울까요? 내려받은 파일은 유지됩니다.')) return;
  state = emptyState(); fields.forEach(key => { $(`#${key}`).value = ''; }); save(); renderLesson(); toast('이 페이지의 기록을 초기화했습니다.');
};
function renderIssue() {
  const issue = issues[$('#issue').value];
  $('#issue-advice').textContent = issue[0];
  $('#issue-prompt').textContent = issue[1] + '\n\n오류 원문은 이 요청 뒤에 붙이겠습니다. 계정 정보·토큰 등 비밀값은 제외합니다.';
}
$('#issue').onchange = renderIssue;
$('#copy-issue').onclick = () => copy($('#issue-prompt').textContent);
$('#close-dialog').onclick = () => $('#copy-dialog').close();
document.querySelectorAll('[data-map]').forEach(button => button.onclick = () => {
  const isPlan = button.dataset.map === 'plan';
  document.querySelectorAll('[data-map]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('#case-map').src = `assets/${button.dataset.map}.png`;
  $('#map-link').href = $('#case-map').src;
  $('#case-map').alt = isPlan ? '취락과 물길 보존을 우선한 한옥마을 계획 사례. 학생 과제의 확정안이 아님.' : 'B안 경계, 주변 도시계획도로와 유산 구역, 기존 대지·도로 필지';
  $('#map-caption').textContent = isPlan ? '설계 사례 · 물길과 마당을 잇는 한옥마을. 가정에 따른 제안이며 수업 정답이나 확정 설계조건이 아닙니다. 클릭하면 원본 지도를 봅니다.' : '자료 화면 · B안 경계, 주변 도시계획도로·유산 구역, 기존 대지·도로 필지. 현재 이용 현황 전체를 조사한 지도는 아닙니다.';
});
const connectionLink = $('#mcp-icon a');
connectionLink.href = '#connect';
connectionLink.onclick = event => { event.preventDefault(); location.hash = 'connect'; selectStep(1); };
window.addEventListener('hashchange', () => { if (location.hash === '#connect') selectStep(1); });
renderLesson(); renderIssue();
if (location.hash === '#connect') selectStep(1);
