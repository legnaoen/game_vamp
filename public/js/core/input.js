/**
 * Survivor's Night - 입력 처리 클래스
 * 키보드, 마우스, 터치 입력을 처리합니다.
 */
class Input {
    constructor() {
        // 키보드 상태
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false,
            Escape: false,
            // 🆕 마법사 특수 공격 키
            q: false, // 매직 애로우
            e: false, // 파이어볼
            r: false  // 체인 라이트닝
        };
        
        // 마우스 상태
        this.mouse = {
            x: 0,
            y: 0,
            left: false,
            right: false
        };
        
        // 터치 상태
        this.touch = {
            x: 0,
            y: 0,
            active: false
        };
        
        // 입력 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 마우스 이벤트
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 터치 이벤트
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // 컨텍스트 메뉴 비활성화 (우클릭 방지)
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * 키보드 다운 이벤트 처리
     */
    handleKeyDown(e) {
        const key = e.key;
        
        // 키 상태 업데이트
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
        
        // 스페이스바 처리
        if (key === ' ') {
            this.keys.Space = true;
        }
        
        // 기본 동작 방지 (스크롤 등)
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'q', 'e', 'r'].includes(key)) {
            e.preventDefault();
        }
    }
    
    /**
     * 키보드 업 이벤트 처리
     */
    handleKeyUp(e) {
        const key = e.key;
        
        // 키 상태 업데이트
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
        
        // 스페이스바 처리
        if (key === ' ') {
            this.keys.Space = false;
        }
    }
    
    /**
     * 마우스 다운 이벤트 처리
     */
    handleMouseDown(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        if (e.button === 0) { // 좌클릭
            this.mouse.left = true;
        } else if (e.button === 2) { // 우클릭
            this.mouse.right = true;
        }
    }
    
    /**
     * 마우스 업 이벤트 처리
     */
    handleMouseUp(e) {
        if (e.button === 0) { // 좌클릭
            this.mouse.left = false;
        } else if (e.button === 2) { // 우클릭
            this.mouse.right = false;
        }
    }
    
    /**
     * 마우스 이동 이벤트 처리
     */
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    /**
     * 터치 시작 이벤트 처리
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.touch.x = touch.clientX;
            this.touch.y = touch.clientY;
            this.touch.active = true;
        }
    }
    
    /**
     * 터치 종료 이벤트 처리
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.touch.active = false;
    }
    
    /**
     * 터치 이동 이벤트 처리
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.touch.x = touch.clientX;
            this.touch.y = touch.clientY;
        }
    }
    
    /**
     * 특정 키가 눌려있는지 확인
     */
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    /**
     * 이동 입력 벡터 반환
     */
    getMovementVector() {
        let x = 0;
        let y = 0;
        
        // WASD 키
        if (this.keys.w || this.keys.ArrowUp) y -= 1;
        if (this.keys.s || this.keys.ArrowDown) y += 1;
        if (this.keys.a || this.keys.ArrowLeft) x -= 1;
        if (this.keys.d || this.keys.ArrowRight) x += 1;
        
        // 대각선 이동 정규화
        if (x !== 0 && y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }
        
        return { x, y };
    }
    
    /**
     * 스페이스바가 눌려있는지 확인
     */
    isSpacePressed() {
        return this.keys.Space;
    }
    
    /**
     * ESC 키가 눌려있는지 확인
     */
    isEscapePressed() {
        return this.keys.Escape;
    }
    
    /**
     * 🆕 Q키가 눌려있는지 확인 (매직 애로우)
     */
    isQPressed() {
        return this.keys.q;
    }
    
    /**
     * 🆕 E키가 눌려있는지 확인 (파이어볼)
     */
    isEPressed() {
        return this.keys.e;
    }
    
    /**
     * 🆕 R키가 눌려있는지 확인 (체인 라이트닝)
     */
    isRPressed() {
        return this.keys.r;
    }
    
    /**
     * 마우스 좌클릭 상태 확인
     */
    isMouseLeftPressed() {
        return this.mouse.left;
    }
    
    /**
     * 마우스 우클릭 상태 확인
     */
    isMouseRightPressed() {
        return this.mouse.right;
    }
    
    /**
     * 마우스 위치 반환
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    /**
     * 터치 상태 확인
     */
    isTouchActive() {
        return this.touch.active;
    }
    
    /**
     * 터치 위치 반환
     */
    getTouchPosition() {
        return { x: this.touch.x, y: this.touch.y };
    }
    
    /**
     * 모든 입력 상태 리셋
     */
    reset() {
        // 키보드 상태 리셋
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = false;
        });
        
        // 마우스 상태 리셋
        this.mouse.left = false;
        this.mouse.right = false;
        
        // 터치 상태 리셋
        this.touch.active = false;
    }
    
    /**
     * 입력 상태 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            keys: this.keys,
            mouse: this.mouse,
            touch: this.touch,
            movement: this.getMovementVector()
        };
    }
}
