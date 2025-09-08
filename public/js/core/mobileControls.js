/**
 * Survivor's Night - HTML 기반 모바일 터치 컨트롤 시스템
 * 모바일 디바이스에서만 활성화되는 가상 컨트롤을 관리합니다.
 * Canvas 렌더링 대신 HTML 요소를 사용하여 터치 문제를 해결합니다.
 */
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        
        // HTML 요소들
        this.overlay = null;
        this.joystickBase = null;
        this.joystickKnob = null;
        this.buttons = {};
        
        // 조이스틱 상태 (🔧 더 컴팩트한 레이아웃에 맞춰 크기 조정)
        this.joystick = {
            isActive: false,
            touchId: null,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            maxRadius: 40, // 조이스틱 이동 가능 반경 (50 → 40, 90px 조이스틱에 맞춤)
            startX: 0,
            startY: 0
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
            console.log('데스크톱 디바이스이므로 HTML 모바일 컨트롤을 비활성화합니다.');
            return;
        }
        
        console.log('HTML 기반 모바일 컨트롤 초기화 시작...');
        
        // HTML 요소 참조 가져오기
        this.setupElements();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 상태는 비활성화 (게임 시작 시 활성화됨)
        this.isActive = false;
        
        console.log('HTML 기반 모바일 컨트롤 초기화 완료');
    }
    
    /**
     * HTML 요소들 설정
     */
    setupElements() {
        // 메인 오버레이
        this.overlay = document.getElementById('mobileControlsOverlay');
        if (!this.overlay) {
            console.error('모바일 컨트롤 오버레이를 찾을 수 없습니다!');
            return;
        }
        
        // 조이스틱 요소들
        this.joystickBase = document.getElementById('joystickBase');
        this.joystickKnob = document.getElementById('joystickKnob');
        
        // 버튼 요소들
        this.buttons = {
            attack: document.getElementById('attackBtn'),
            dash: document.getElementById('dashBtn'),
            fireball: document.getElementById('fireballBtn'),
            chainLightning: document.getElementById('chainBtn')
        };
        
        console.log('HTML 요소 참조 설정 완료:', {
            overlay: !!this.overlay,
            joystickBase: !!this.joystickBase,
            joystickKnob: !!this.joystickKnob,
            buttons: Object.keys(this.buttons).map(key => ({ [key]: !!this.buttons[key] }))
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.overlay) return;
        
        // 조이스틱 이벤트
        if (this.joystickBase) {
            this.joystickBase.addEventListener('touchstart', this.handleJoystickStart.bind(this), { passive: false });
            this.joystickBase.addEventListener('touchmove', this.handleJoystickMove.bind(this), { passive: false });
            this.joystickBase.addEventListener('touchend', this.handleJoystickEnd.bind(this), { passive: false });
            this.joystickBase.addEventListener('touchcancel', this.handleJoystickEnd.bind(this), { passive: false });
        }
        
        // 버튼 이벤트들
        Object.entries(this.buttons).forEach(([name, button]) => {
            if (button) {
                button.addEventListener('touchstart', (e) => this.handleButtonStart(e, name), { passive: false });
                button.addEventListener('touchend', (e) => this.handleButtonEnd(e, name), { passive: false });
                button.addEventListener('touchcancel', (e) => this.handleButtonEnd(e, name), { passive: false });
                
                // 클릭 이벤트도 추가 (테스트용)
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleButtonPress(name);
                });
            }
        });
        
        console.log('HTML 모바일 컨트롤 이벤트 리스너 설정 완료');
    }
    
    /**
     * 조이스틱 터치 시작
     */
    handleJoystickStart(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🕹️ 조이스틱 터치 시작');
        
        const touch = event.touches[0];
        if (touch) {
            this.joystick.isActive = true;
            this.joystick.touchId = touch.identifier;
            
            // 조이스틱 베이스의 중심점 계산
            const rect = this.joystickBase.getBoundingClientRect();
            this.joystick.centerX = rect.left + rect.width / 2;
            this.joystick.centerY = rect.top + rect.height / 2;
            
            // 터치 시작 위치 저장
            this.joystick.startX = touch.clientX;
            this.joystick.startY = touch.clientY;
            
            this.updateJoystickPosition(touch.clientX, touch.clientY);
        }
    }
    
    /**
     * 조이스틱 터치 이동
     */
    handleJoystickMove(event) {
        if (!this.isActive || !this.joystick.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const touch = Array.from(event.touches).find(t => t.identifier === this.joystick.touchId);
        if (touch) {
            this.updateJoystickPosition(touch.clientX, touch.clientY);
        }
    }
    
    /**
     * 조이스틱 터치 종료
     */
    handleJoystickEnd(event) {
        if (!this.isActive || !this.joystick.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🕹️ 조이스틱 터치 종료');
        
        this.joystick.isActive = false;
        this.joystick.touchId = null;
        
        // 조이스틱 노브를 중앙으로 복원
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        
        // 플레이어 정지
        if (this.game.player) {
            this.game.player.vx = 0;
            this.game.player.vy = 0;
            console.log('🕹️ 플레이어 정지 설정');
        }
    }
    
    /**
     * 조이스틱 위치 업데이트
     */
    updateJoystickPosition(touchX, touchY) {
        const dx = touchX - this.joystick.centerX;
        const dy = touchY - this.joystick.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let knobX = dx;
        let knobY = dy;
        
        // 최대 반경 제한
        if (distance > this.joystick.maxRadius) {
            const angle = Math.atan2(dy, dx);
            knobX = Math.cos(angle) * this.joystick.maxRadius;
            knobY = Math.sin(angle) * this.joystick.maxRadius;
        }
        
        // 조이스틱 노브 위치 업데이트
        this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // 플레이어 이동 업데이트
        this.updatePlayerMovement(knobX, knobY);
    }
    
    /**
     * 플레이어 이동 업데이트
     */
    updatePlayerMovement(deltaX, deltaY) {
        if (!this.game.player) {
            console.error('❌ 플레이어 참조가 없습니다!', { game: !!this.game, player: !!this.game?.player });
            return;
        }
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 5) { // 최소 이동 거리
            const normalizedDistance = Math.min(distance / this.joystick.maxRadius, 1);
            const angle = Math.atan2(deltaY, deltaX);
            const speed = this.game.player.speed * normalizedDistance;
            
            const newVx = Math.cos(angle) * speed;
            const newVy = Math.sin(angle) * speed;
            
            this.game.player.vx = newVx;
            this.game.player.vy = newVy;
            
            console.log('🕹️ 플레이어 이동 설정:', {
                deltaX: deltaX.toFixed(1),
                deltaY: deltaY.toFixed(1),
                distance: distance.toFixed(1),
                normalizedDistance: normalizedDistance.toFixed(2),
                angle: (angle * 180 / Math.PI).toFixed(1) + '°',
                speed: speed.toFixed(1),
                vx: newVx.toFixed(1),
                vy: newVy.toFixed(1),
                playerPos: `(${this.game.player.x.toFixed(1)}, ${this.game.player.y.toFixed(1)})`
            });
        } else {
            this.game.player.vx = 0;
            this.game.player.vy = 0;
            console.log('🕹️ 플레이어 정지 (거리가 너무 작음:', distance.toFixed(1), ')');
        }
    }
    
    /**
     * 버튼 터치 시작
     */
    handleButtonStart(event, buttonName) {
        if (!this.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`🔘 ${buttonName} 버튼 터치 시작`);
        
        // 버튼 시각적 피드백
        this.buttons[buttonName].classList.add('active');
        
        // 버튼 액션 실행
        this.handleButtonPress(buttonName);
    }
    
    /**
     * 버튼 터치 종료
     */
    handleButtonEnd(event, buttonName) {
        if (!this.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`🔘 ${buttonName} 버튼 터치 종료`);
        
        // 버튼 시각적 피드백 제거
        this.buttons[buttonName].classList.remove('active');
    }
    
    /**
     * 버튼 누름 처리
     */
    handleButtonPress(buttonName) {
        console.log(`🎯 버튼 액션 실행: ${buttonName}`);
        
        if (!this.game.player) {
            console.error('❌ 게임 플레이어가 없음!');
            return;
        }
        
        switch (buttonName) {
            case 'attack':
                console.log('⚔️ 공격 버튼 (자동 공격은 이미 활성화됨)');
                // 자동 공격은 이미 활성화되어 있음
                break;
            case 'dash':
                console.log('💨 대시 실행!');
                this.game.player.dash();
                break;
            case 'fireball':
                console.log('🔥 파이어볼 버튼 터치 (모바일에서는 자동 발사됨)');
                // 모바일에서는 파이어볼이 자동 발사되므로 수동 발사는 비활성화
                // 버튼은 쿨다운 표시 목적으로만 사용
                break;
            case 'chainLightning':
                console.log('⚡ 체인 라이트닝 시전!');
                this.game.player.castChainLightning();
                break;
            default:
                console.warn(`⚠️ 알 수 없는 버튼: ${buttonName}`);
        }
    }
    
    /**
     * 게임 상태별 모바일 컨트롤 활성화
     */
    activateForGameState(gameState) {
        if (!window.deviceDetector.isMobile()) return;
        if (!this.overlay) return;
        
        if (gameState === 'playing') {
            this.isActive = true;
            this.overlay.classList.remove('hidden');
            console.log('HTML 모바일 컨트롤 활성화: 게임 플레이 모드');
        } else {
            this.isActive = false;
            this.overlay.classList.add('hidden');
            this.resetJoystick();
            console.log('HTML 모바일 컨트롤 비활성화: 메뉴 모드');
        }
    }
    
    /**
     * 모바일 컨트롤 완전 비활성화
     */
    deactivate() {
        this.isActive = false;
        
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
        
        this.resetJoystick();
        this.resetButtons();
        
        console.log('HTML 모바일 컨트롤 완전 비활성화');
    }
    
    /**
     * 조이스틱 상태 초기화
     */
    resetJoystick() {
        this.joystick.isActive = false;
        this.joystick.touchId = null;
        
        if (this.joystickKnob) {
            this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
        
        // 플레이어 정지
        if (this.game.player) {
            this.game.player.vx = 0;
            this.game.player.vy = 0;
        }
    }
    
    /**
     * 버튼 상태 초기화
     */
    resetButtons() {
        Object.values(this.buttons).forEach(button => {
            if (button) {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * 스킬 잠금 상태 업데이트
     */
    updateSkillLocks(playerLevel) {
        if (!window.deviceDetector.isMobile()) return;
        
        // 파이어볼 (레벨 3)
        if (this.buttons.fireball) {
            if (playerLevel >= 3) {
                this.buttons.fireball.classList.remove('disabled');
            } else {
                this.buttons.fireball.classList.add('disabled');
            }
        }
        
        // 체인 라이트닝 (레벨 5)
        if (this.buttons.chainLightning) {
            if (playerLevel >= 5) {
                this.buttons.chainLightning.classList.remove('disabled');
            } else {
                this.buttons.chainLightning.classList.add('disabled');
            }
        }
    }
    
    /**
     * 스킬 쿨다운 상태 업데이트
     */
    updateSkillCooldowns(skillCooldowns) {
        if (!window.deviceDetector.isMobile()) return;
        
        Object.entries(skillCooldowns).forEach(([skillName, isOnCooldown]) => {
            let buttonName = skillName;
            if (skillName === 'fireball') buttonName = 'fireball';
            else if (skillName === 'chainLightning') buttonName = 'chainLightning';
            
            const button = this.buttons[buttonName];
            if (button) {
                if (isOnCooldown) {
                    button.classList.add('cooldown');
                } else {
                    button.classList.remove('cooldown');
                }
            }
        });
    }
    
    /**
     * 렌더링 (HTML 기반이므로 빈 메서드)
     */
    render() {
        // HTML 요소를 사용하므로 별도의 렌더링이 필요하지 않음
        // CSS와 HTML로 모든 시각적 표현이 처리됨
    }
    
    /**
     * 모바일 컨트롤 정리
     */
    destroy() {
        console.log('HTML 모바일 컨트롤 정리 시작...');
        
        this.deactivate();
        
        // 이벤트 리스너 제거는 필요시 구현
        // (일반적으로 HTML 요소가 제거되면 자동으로 정리됨)
        
        console.log('HTML 모바일 컨트롤 정리 완료');
    }
}
