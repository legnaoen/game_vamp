/**
 * Survivor's Night - 모바일 터치 컨트롤 시스템
 * 모바일 디바이스에서만 활성화되는 가상 컨트롤을 관리합니다.
 */
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;
        
        // 가상 조이스틱
        this.joystick = {
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            radius: 60,
            knobRadius: 25,
            isActive: false,
            touchId: null
        };
        
        // 가상 버튼들
        this.buttons = {
            attack: {
                x: 0,
                y: 0,
                radius: 30,
                isPressed: false,
                touchId: null,
                color: '#ff4757',
                activeColor: '#ff3742'
            },
            dash: {
                x: 0,
                y: 0,
                radius: 30,
                isPressed: false,
                touchId: null,
                color: '#2ed573',
                activeColor: '#26d065'
            },
            fireball: {
                x: 0,
                y: 0,
                radius: 25,
                isPressed: false,
                touchId: null,
                color: '#ffa502',
                activeColor: '#ff9500'
            },
            chainLightning: {
                x: 0,
                y: 0,
                radius: 25,
                isPressed: false,
                touchId: null,
                color: '#1e90ff',
                activeColor: '#0078d4'
            }
        };
        
        // 터치 이벤트 상태
        this.touches = new Map();
        
        this.init();
    }
    
    /**
     * 모바일 컨트롤 초기화
     */
    init() {
        if (!window.deviceDetector.isMobile()) {
            console.log('모바일 디바이스가 아니므로 터치 컨트롤을 비활성화합니다.');
            return;
        }
        
        this.canvas = this.game.canvas;
        this.ctx = this.game.ctx;
        this.isActive = true;
        
        this.setupLayout();
        this.setupTouchEvents();
        this.setupDeviceChangeListener();
        
        console.log('모바일 터치 컨트롤이 활성화되었습니다.');
    }
    
    /**
     * 레이아웃 설정
     */
    setupLayout() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const margin = 40;
        
        // 조이스틱 위치 (좌하단)
        this.joystick.centerX = margin + this.joystick.radius;
        this.joystick.centerY = canvasHeight - margin - this.joystick.radius;
        this.joystick.currentX = this.joystick.centerX;
        this.joystick.currentY = this.joystick.centerY;
        
        // 버튼 위치 (우하단)
        const buttonY = canvasHeight - margin - 30;
        const buttonSpacing = 80;
        const startX = canvasWidth - margin - 30;
        
        this.buttons.attack.x = startX;
        this.buttons.attack.y = buttonY;
        
        this.buttons.dash.x = startX - buttonSpacing;
        this.buttons.dash.y = buttonY;
        
        this.buttons.fireball.x = startX;
        this.buttons.fireball.y = buttonY - 60;
        
        this.buttons.chainLightning.x = startX - buttonSpacing;
        this.buttons.chainLightning.y = buttonY - 60;
    }
    
    /**
     * 터치 이벤트 설정
     */
    setupTouchEvents() {
        if (!this.isActive) return;
        
        // 터치 이벤트 리스너 추가
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // 스크롤 방지
        document.addEventListener('touchmove', this.preventScroll.bind(this), { passive: false });
    }
    
    /**
     * 디바이스 변경 감지
     */
    setupDeviceChangeListener() {
        window.addEventListener('deviceTypeChanged', (event) => {
            if (event.detail.deviceType === 'mobile') {
                if (!this.isActive) {
                    this.init();
                }
            } else {
                this.destroy();
            }
        });
    }
    
    /**
     * 터치 시작 처리
     */
    handleTouchStart(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const touchId = touch.identifier;
            const x = touch.clientX - this.canvas.offsetLeft;
            const y = touch.clientY - this.canvas.offsetTop;
            
            this.touches.set(touchId, { x, y });
            
            // 조이스틱 영역 체크
            if (this.isPointInJoystick(x, y)) {
                this.activateJoystick(touchId, x, y);
            }
            // 버튼 영역 체크
            else if (this.isPointInButton(x, y)) {
                this.activateButton(touchId, x, y);
            }
        }
    }
    
    /**
     * 터치 이동 처리
     */
    handleTouchMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const touchId = touch.identifier;
            const x = touch.clientX - this.canvas.offsetLeft;
            const y = touch.clientY - this.canvas.offsetTop;
            
            if (this.touches.has(touchId)) {
                this.touches.set(touchId, { x, y });
                
                // 조이스틱 업데이트
                if (this.joystick.isActive && this.joystick.touchId === touchId) {
                    this.updateJoystick(x, y);
                }
            }
        }
    }
    
    /**
     * 터치 종료 처리
     */
    handleTouchEnd(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const touchId = touch.identifier;
            
            // 조이스틱 비활성화
            if (this.joystick.isActive && this.joystick.touchId === touchId) {
                this.deactivateJoystick();
            }
            
            // 버튼 비활성화
            this.deactivateButton(touchId);
            
            this.touches.delete(touchId);
        }
    }
    
    /**
     * 스크롤 방지
     */
    preventScroll(event) {
        if (this.isActive) {
            event.preventDefault();
        }
    }
    
    /**
     * 조이스틱 영역 체크
     */
    isPointInJoystick(x, y) {
        const dx = x - this.joystick.centerX;
        const dy = y - this.joystick.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= this.joystick.radius;
    }
    
    /**
     * 버튼 영역 체크
     */
    isPointInButton(x, y) {
        for (let buttonName in this.buttons) {
            const button = this.buttons[buttonName];
            const dx = x - button.x;
            const dy = y - button.y;
            if (Math.sqrt(dx * dx + dy * dy) <= button.radius) {
                return buttonName;
            }
        }
        return null;
    }
    
    /**
     * 조이스틱 활성화
     */
    activateJoystick(touchId, x, y) {
        this.joystick.isActive = true;
        this.joystick.touchId = touchId;
        this.updateJoystick(x, y);
    }
    
    /**
     * 조이스틱 업데이트
     */
    updateJoystick(x, y) {
        const dx = x - this.joystick.centerX;
        const dy = y - this.joystick.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.joystick.radius) {
            this.joystick.currentX = x;
            this.joystick.currentY = y;
        } else {
            // 조이스틱 반경을 벗어나면 반경 내로 제한
            const angle = Math.atan2(dy, dx);
            this.joystick.currentX = this.joystick.centerX + Math.cos(angle) * this.joystick.radius;
            this.joystick.currentY = this.joystick.centerY + Math.sin(angle) * this.joystick.radius;
        }
        
        // 플레이어 이동 방향 계산
        this.updatePlayerMovement();
    }
    
    /**
     * 조이스틱 비활성화
     */
    deactivateJoystick() {
        this.joystick.isActive = false;
        this.joystick.touchId = null;
        this.joystick.currentX = this.joystick.centerX;
        this.joystick.currentY = this.joystick.centerY;
        
        // 플레이어 정지
        if (this.game.player) {
            this.game.player.vx = 0;
            this.game.player.vy = 0;
        }
    }
    
    /**
     * 플레이어 이동 업데이트
     */
    updatePlayerMovement() {
        if (!this.game.player || !this.joystick.isActive) return;
        
        const dx = this.joystick.currentX - this.joystick.centerX;
        const dy = this.joystick.currentY - this.joystick.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // 최소 이동 거리
            const maxDistance = this.joystick.radius;
            const normalizedDistance = Math.min(distance / maxDistance, 1);
            
            const angle = Math.atan2(dy, dx);
            const speed = this.game.player.speed * normalizedDistance;
            
            this.game.player.vx = Math.cos(angle) * speed;
            this.game.player.vy = Math.sin(angle) * speed;
        } else {
            this.game.player.vx = 0;
            this.game.player.vy = 0;
        }
    }
    
    /**
     * 버튼 활성화
     */
    activateButton(touchId, x, y) {
        const buttonName = this.isPointInButton(x, y);
        if (buttonName && !this.buttons[buttonName].isPressed) {
            this.buttons[buttonName].isPressed = true;
            this.buttons[buttonName].touchId = touchId;
            this.handleButtonPress(buttonName);
        }
    }
    
    /**
     * 버튼 비활성화
     */
    deactivateButton(touchId) {
        for (let buttonName in this.buttons) {
            const button = this.buttons[buttonName];
            if (button.isPressed && button.touchId === touchId) {
                button.isPressed = false;
                button.touchId = null;
                this.handleButtonRelease(buttonName);
            }
        }
    }
    
    /**
     * 버튼 누름 처리
     */
    handleButtonPress(buttonName) {
        if (!this.game.player) return;
        
        switch (buttonName) {
            case 'attack':
                // 자동 공격은 이미 활성화되어 있음
                break;
            case 'dash':
                this.game.player.dash();
                break;
            case 'fireball':
                this.game.player.fireFireball();
                break;
            case 'chainLightning':
                this.game.player.castChainLightning();
                break;
        }
    }
    
    /**
     * 버튼 놓음 처리
     */
    handleButtonRelease(buttonName) {
        // 현재는 버튼 놓음에 대한 특별한 처리가 없음
    }
    
    /**
     * 모바일 컨트롤 렌더링
     */
    render() {
        if (!this.isActive) return;
        
        this.ctx.save();
        
        // 조이스틱 렌더링
        this.renderJoystick();
        
        // 버튼 렌더링
        this.renderButtons();
        
        this.ctx.restore();
    }
    
    /**
     * 조이스틱 렌더링
     */
    renderJoystick() {
        // 조이스틱 배경
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(this.joystick.centerX, this.joystick.centerY, this.joystick.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 조이스틱 테두리
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 조이스틱 노브
        this.ctx.fillStyle = this.joystick.isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(this.joystick.currentX, this.joystick.currentY, this.joystick.knobRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 조이스틱 노브 테두리
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * 버튼 렌더링
     */
    renderButtons() {
        for (let buttonName in this.buttons) {
            const button = this.buttons[buttonName];
            
            // 버튼 배경
            this.ctx.fillStyle = button.isPressed ? button.activeColor : button.color;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(button.x, button.y, button.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 버튼 테두리
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 버튼 아이콘
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let icon = '';
            switch (buttonName) {
                case 'attack': icon = '⚔'; break;
                case 'dash': icon = '💨'; break;
                case 'fireball': icon = '🔥'; break;
                case 'chainLightning': icon = '⚡'; break;
            }
            
            this.ctx.fillText(icon, button.x, button.y);
            this.ctx.globalAlpha = 1;
        }
    }
    
    /**
     * 모바일 컨트롤 정리
     */
    destroy() {
        if (!this.isActive) return;
        
        // 이벤트 리스너 제거
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
        
        document.removeEventListener('touchmove', this.preventScroll);
        
        this.isActive = false;
        this.touches.clear();
        
        console.log('모바일 터치 컨트롤이 비활성화되었습니다.');
    }
}
