# 매장 QR Analytics 운영 안내

수집 버전: 2 / GA4 측정 ID: G-H4GJZ6ZSWX

## 개선 사항

- 출처가 확인되지 않은 방문은 `entry_source=unclassified`, 매장이 확인되지 않으면 `store=unknown`으로 기록합니다. 고객이 이전에 방문한 매장을 이번 방문의 매장으로 단정하지 않습니다.
- 아래 태그 QR 주소를 쓰면 매장·품목·QR별 유입과 이후 행동을 연결합니다. `qr_tagged`는 해당 태그 주소로 들어왔다는 뜻입니다. 공유된 링크로도 들어올 수 있으므로 물리적인 스캔 횟수라는 뜻은 아닙니다.
- 방문 연결은 같은 탭에서 마지막 행동 이후 30분간 유지됩니다. 새 외부 유입과 다른 QR 태그는 새 경로로 취급합니다.
- 기본 페이지 조회는 Google 태그가 한 번만 전송합니다. 700ms 안에 같은 사용자 이벤트가 중복 실행되면 한 번으로 합칩니다.
- 언어 선택 이벤트의 선택 언어를 즉시 반영합니다. 언어 전환 UI는 `interaction_source`에 기록하여 GA 유입 경로 `source`를 덮어쓰지 않습니다.
- 질문 원문, 자유 입력, URL의 임의 쿼리 값은 사용자 이벤트로 보내지 않습니다. 챗봇 질문은 질문 ID와 분류로 분석합니다.
- 커스텀 요약의 금액은 `estimated_value`입니다. 실제 주문/매출이 아닙니다. 외부 쇼핑몰로 이동한 이후 구매 완료 여부는 이 사이트만으로 확인할 수 없습니다.

## 새 QR 주소

[QR_LINKS.csv](QR_LINKS.csv)에 본점/연방점 × 홈/모루/반지/귀걸이/이어커프의 10개 주소가 있습니다. 해당 주소로 QR을 제작하면 됩니다. 기존의 태그 없는 QR도 계속 열리지만 스캔과 직접 접속을 구분할 수 없습니다.

예: 본점 홈 `https://givingtreenujeahmik-hub.github.io/qr-landing-home/?qr=main_home`
예: 연방점 모루 `https://givingtreenujeahmik-hub.github.io/qr-landing-home/?qr=yeonbang_moru`

품목 QR은 언어 선택 후 해당 품목 화면으로 이동합니다. 태그 없는 기존 주소의 화면 흐름은 유지합니다.

## 테스트 접속 제외

본인 테스트는 주소 끝에 `?nj_test=1`을 붙여 시작합니다. 이 브라우저의 모든 페이지에서 Analytics 전송을 중단합니다. 원복은 `?nj_test=0`입니다. 저장소 사용이 제한된 브라우저에서는 다른 페이지로 이동했을 때 설정이 유지되지 않을 수 있습니다.

실제 GA 수신을 검증할 때만 `?ga_debug=1&nj_test=0`을 사용합니다. 같은 탭에서 `traffic_role=developer`, `debug_mode=true`로 보냅니다. `?ga_debug=0`으로 종료합니다. DebugView 검증 이벤트는 자동 제외가 아니므로 일반 분석에서 `traffic_role=visitor` 조건으로 제외하세요. 영구 데이터 제외 필터는 적용하지 않았습니다.

## GA4 맞춤 측정기준 (범위: 이벤트)

| 표시 이름 | 이벤트 매개변수 |
|---|---|
| 매장 | store |
| 선택 언어 | site_lang |
| QR 품목 | qr_entry |
| QR 식별자 | qr_id |
| 입장 경로 | entry_source |
| 페이지 구분 | page_name |
| 접속 유형 | traffic_role |
| 상품 분류 | category |
| 챗봇 질문 ID | question_id |
| 챗봇 질문 분류 | question_cat |
| 외부 이동 대상 | link |
| 언어 선택 위치 | interaction_source |
| 이동 목적지 | destination |
| 이동 전 단계 | journey_stage |
| 커스텀 인형 | doll |
| 커스텀 선택 품목 | item |

등록 이후 보고서에 표시되기까지 최대 48시간이 걸릴 수 있습니다. 새 항목으로 과거 기록을 소급 재분류할 수 없습니다.

## 외부 버튼 클릭

스마트스토어(`smartstore`)·인스타그램(`instagram`)·누제믹 홈페이지(`official_website`) 링크 클릭은 `outbound_click`으로 기록하며 `destination`으로 구분합니다. 동적으로 생성되는 커스텀 요약의 링크도 포함합니다. 기존 버튼 이벤트와 전체 링크 감지가 같은 클릭을 이중 기록하지 않도록 합칩니다.

커스텀 요약 후 스마트스토어 이동은 `custom_shop_click`에 `destination=smartstore`, `journey_stage=custom_summary`, 인형/선택 품목/품목 수/예상 금액을 함께 기록합니다. 같은 클릭의 일반 `outbound_click`에도 `journey_stage=custom_summary`가 붙습니다. 두 이벤트는 서로 다른 분석 목적이므로 합산해서 클릭 수로 쓰지 마세요. 외부 사이트에서 실제로 페이지가 로드되거나 구매가 완료됐다는 의미는 아닙니다.

2026-10-05: 위 16개 이벤트 범위 맞춤 측정기준을 실제 GA4 속성에 등록했습니다.

## 행동 분석

- `qr_landing`: 태그 주소 입장, 같은 경로에서 새로고침은 중복 기록하지 않음
- `select_language`: 언어 선택 (`interaction_source=entry/switcher`)
- `select_category`, `view_category`: 상품 선택과 실제 품목 화면 열람
- `scroll_depth`: 상품 페이지 25/50/75/90% 도달, 각 단계는 페이지당 한 번
- `engaged_read`: 상품 화면이 보이고 포커스가 있는 시간 30초 이상 + 50% 이상 스크롤
- `chatbot_open`, `chatbot_close`, `chatbot_question`, `chatbot_no_answer`: 챗봇 사용과 답변 공백
- `custom_view`, `custom_doll`, `custom_item`, `custom_summary`: 커스텀 체험
- `custom_shop_click`, `outbound_click`, `view_store_map`: 쇼핑/지도 이동 의향

추천 탐색: `traffic_role=visitor` 비교를 만들고 QR별로 입장 → 언어 선택 → 상품 열람 → 커스텀 요약 → 쇼핑 사이트 이동을 비교합니다. `custom_shop_click`은 구매 의향 지표로 사용하고 구매 완료로 표시하지 않습니다.

## 검증

`node tests/analytics.test.cjs`

수신은 GA 실시간 보고서/DebugView에서 확인해야 합니다. 자동 테스트는 QR 출처 연결, 중복 억제, 테스트 제외, 저장소 차단 대응, 개인정보성 값 제거, 언어 반영, 스크롤/체류 조건을 확인합니다.
