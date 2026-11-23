/**
 * 바이브 카페 주문서 및 주문 내역 스크립트 (script.js)
 * - 탭 전환 (주문하기 / 주문 내역)
 * - 실시간 금액 계산 (calculateTotal 함수)
 * - 폼 유효성 검사 및 주문 접수 처리 (orders 배열 추가)
 * - 주문 목록 렌더링 (renderOrders 함수)
 * - 개별 주문 취소 및 전체 내역 삭제
 * - 폼 초기화 (다시 작성 버튼)
 */

// ==========================================================================
// 1. HTML 요소 가져오기 (DOM 선택)
// ==========================================================================
// 탭 관련 요소
const tabOrderBtn = document.getElementById('tab-order');
const tabHistoryBtn = document.getElementById('tab-history');
const orderTabPanel = document.getElementById('order-tab-panel');
const historyTabPanel = document.getElementById('history-tab-panel');
const orderCountBadge = document.getElementById('order-count-badge');

// 주문서(폼) 관련 요소
const orderForm = document.getElementById('order-form');
const userNameInput = document.getElementById('user-name');
const beverageSelect = document.getElementById('beverage-select');
const quantityInput = document.getElementById('order-quantity');
const requestsTextarea = document.getElementById('order-requests');
const totalPriceEl = document.getElementById('total-price');
const orderConfirmation = document.getElementById('order-confirmation');

// 주문 내역 탭 관련 요소
const ordersList = document.getElementById('orders-list');
const emptyHistory = document.getElementById('empty-history');
const historySummary = document.getElementById('history-summary');
const historyTotalPrice = document.getElementById('history-total-price');
const clearAllOrdersBtn = document.getElementById('clear-all-orders-btn');

// ==========================================================================
// 2. 주문 데이터 관리 변수
// ==========================================================================
let orders = [];       // 주문 객체들을 저장할 배열
let orderIdCounter = 1; // 주문 번호 자동 증가용 카운터 (1부터 시작)


// ==========================================================================
// 3. 탭 전환 기능
// ==========================================================================
// "☕ 주문하기" 탭 클릭 시
tabOrderBtn.addEventListener('click', function () {
    tabOrderBtn.classList.add('active');
    tabHistoryBtn.classList.remove('active');
    orderTabPanel.classList.remove('hidden');
    historyTabPanel.classList.add('hidden');
});

// "📋 주문 내역" 탭 클릭 시
tabHistoryBtn.addEventListener('click', function () {
    tabHistoryBtn.classList.add('active');
    tabOrderBtn.classList.remove('active');
    historyTabPanel.classList.remove('hidden');
    orderTabPanel.classList.add('hidden');
});


// ==========================================================================
// 4. 금액 계산 함수 (calculateTotal)
// ==========================================================================
function calculateTotal() {
    // 1) 음료 선택 여부 및 기본 가격 확인
    const selectedOption = beverageSelect.options[beverageSelect.selectedIndex];
    const drinkPrice = parseInt(selectedOption.dataset.price, 10) || 0;

    // 음료를 아직 선택하지 않은 경우 무조건 0원으로 표시
    if (!beverageSelect.value || drinkPrice === 0) {
        totalPriceEl.textContent = '0';
        return 0;
    }

    // 2) 선택된 사이즈 추가 금액 (라디오)
    const checkedSize = document.querySelector('input[name="size"]:checked');
    const sizePrice = checkedSize ? (parseInt(checkedSize.dataset.price, 10) || 0) : 0;

    // 3) 선택된 추가 옵션 합산 (체크박스)
    const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
    let optionsPrice = 0;
    checkedOptions.forEach(option => {
        optionsPrice += parseInt(option.dataset.price, 10) || 0;
    });

    // 4) 수량 확인
    let quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
    }

    // 5) 총 금액 계산: (음료 + 사이즈 + 옵션) * 수량
    const total = (drinkPrice + sizePrice + optionsPrice) * quantity;

    // 6) 천 단위 콤마 적용 후 화면 반영
    totalPriceEl.textContent = total.toLocaleString();

    return total;
}

// 폼 입력값 변경 시 실시간 금액 계산 연결
orderForm.addEventListener('change', calculateTotal);
quantityInput.addEventListener('input', calculateTotal);


// ==========================================================================
// 5. 주문 내역 화면 그리기 (renderOrders) - 단일 함수로 목록 렌더링
// ==========================================================================
function renderOrders() {
    // 1) 탭 옆 주문 건수 배지 갱신
    orderCountBadge.textContent = orders.length;

    // 2) 기존 목록 카드들을 화면에서 깨끗이 비우기
    ordersList.textContent = '';

    // 3) 주문이 없는 경우: 안내 문구 표시 및 요약 영역 숨김
    if (orders.length === 0) {
        emptyHistory.classList.remove('hidden');
        historySummary.classList.add('hidden');
        return;
    }

    // 4) 주문이 있는 경우: 안내 문구 숨기고 요약 영역 표시
    emptyHistory.classList.add('hidden');
    historySummary.classList.remove('hidden');

    // 총 주문 금액 합산 및 텍스트 갱신
    const totalAmount = orders.reduce((sum, item) => sum + item.total, 0);
    historyTotalPrice.textContent = `총 주문 금액: ${totalAmount.toLocaleString()}원 (${orders.length}건)`;

    // 5) 주문 카드들을 하나씩 생성하여 목록에 추가
    // ※ 보안(XSS)을 위해 손님이 입력한 글자는 innerHTML 대신 textContent로 안전하게 삽입
    orders.forEach((order, index) => {
        // 주문 카드 박스
        const card = document.createElement('div');
        card.className = 'order-card';

        // 카드 상단 헤더 (1줄: 제목 + 취소 버튼)
        const header = document.createElement('div');
        header.className = 'order-card-header';

        // 1줄: "#1 홍길동님 · 5,000원"
        const title = document.createElement('div');
        title.className = 'order-card-title';
        title.textContent = `#${order.id} ${order.name}님 · ${order.total.toLocaleString()}원`;

        // 카드 오른쪽 위 "취소" 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'order-card-cancel';
        cancelBtn.textContent = '취소';

        // 취소 버튼 클릭 이벤트 (confirm으로 한 번 더 확인 후 삭제)
        cancelBtn.addEventListener('click', function () {
            const confirmed = confirm(`주문 #${order.id}번을 취소하시겠습니까?`);
            if (confirmed) {
                // 배열에서 해당 주문 삭제
                orders.splice(index, 1);
                // 화면 목록 다시 그리기
                renderOrders();
            }
        });

        header.appendChild(title);
        header.appendChild(cancelBtn);

        // 2줄: "카페라떼 M사이즈 (샷 추가) 1잔"
        const details = document.createElement('div');
        details.className = 'order-card-details';
        const optionStr = order.options.length > 0 ? ` (${order.options.join(', ')})` : '';
        details.textContent = `${order.beverage} ${order.size}사이즈${optionStr} ${order.quantity}잔`;

        // 3줄: "요청사항(있을 때만) · 주문 시간"
        const meta = document.createElement('div');
        meta.className = 'order-card-meta';
        if (order.requests) {
            meta.textContent = `${order.requests} · ${order.time}`;
        } else {
            meta.textContent = order.time;
        }

        // 요소들을 카드에 조립 후 목록에 추가
        card.appendChild(header);
        card.appendChild(details);
        card.appendChild(meta);
        ordersList.appendChild(card);
    });
}


// ==========================================================================
// 6. 주문하기 버튼 클릭 처리 (submit 이벤트)
// ==========================================================================
orderForm.addEventListener('submit', function (event) {
    event.preventDefault(); // 기본 새로고침 방지

    // 1) 이름 유효성 검사
    const userName = userNameInput.value.trim();
    if (!userName) {
        alert('이름을 입력해주세요');
        userNameInput.focus();
        return;
    }

    // 2) 음료 선택 유효성 검사
    if (!beverageSelect.value) {
        alert('음료를 선택해주세요');
        beverageSelect.focus();
        return;
    }

    // 3) 주문 정보 추출
    const selectedDrinkOption = beverageSelect.options[beverageSelect.selectedIndex];
    const drinkName = selectedDrinkOption.text.split(' (')[0].trim();

    const checkedSize = document.querySelector('input[name="size"]:checked');
    const sizeName = checkedSize ? checkedSize.value : 'M';

    const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
    const optionNames = [];
    checkedOptions.forEach(opt => {
        const label = document.querySelector(`label[for="${opt.id}"]`);
        if (label) {
            optionNames.push(label.textContent.split(' (')[0].trim());
        }
    });

    const quantity = parseInt(quantityInput.value, 10) || 1;
    const finalTotal = calculateTotal();
    const requests = requestsTextarea.value.trim();

    // 현재 시간 구하기 (예: "오후 2:30")
    const orderTime = new Date().toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // 4) orders 배열에 새 주문 저장 (최신 주문이 맨 위에 오도록 unshift 사용)
    const newOrder = {
        id: orderIdCounter++,
        name: userName,
        beverage: drinkName,
        size: sizeName,
        options: optionNames,
        quantity: quantity,
        requests: requests,
        total: finalTotal,
        time: orderTime
    };
    orders.unshift(newOrder);

    // 주문 내역 탭 렌더링 갱신
    renderOrders();

    // 5) 주문하기 탭 하단에 확인 메시지 표시
    const optionText = optionNames.length > 0 ? ` (${optionNames.join(', ')})` : '';
    const confirmationMessage = `${userName}님, ${drinkName} ${sizeName}사이즈${optionText} ${quantity}잔, 총 ${finalTotal.toLocaleString()}원 주문이 접수되었습니다!`;

    orderConfirmation.textContent = confirmationMessage;
    orderConfirmation.hidden = false;
    orderConfirmation.classList.remove('hidden');
    orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


// ==========================================================================
// 7. 내역 모두 지우기 버튼 처리
// ==========================================================================
clearAllOrdersBtn.addEventListener('click', function () {
    const confirmed = confirm('주문 내역을 모두 지우시겠습니까?');
    if (confirmed) {
        orders = [];
        renderOrders();
    }
});


// ==========================================================================
// 8. 다시 작성 버튼 처리 (reset 이벤트) - 주문 내역은 건드리지 않고 주문서만 초기화
// ==========================================================================
orderForm.addEventListener('reset', function () {
    setTimeout(function () {
        // M 사이즈 기본 선택 및 수량 1개로 복구
        const sizeM = document.getElementById('size-m');
        if (sizeM) {
            sizeM.checked = true;
        }
        quantityInput.value = 1;

        // 예상 금액 0원으로 초기화
        calculateTotal();

        // 주문 확인 메시지 닫기
        orderConfirmation.textContent = '';
        orderConfirmation.hidden = true;
        orderConfirmation.classList.add('hidden');
    }, 0);
});


// ==========================================================================
// 9. 초기 화면 실행
// ==========================================================================
calculateTotal();
renderOrders();
