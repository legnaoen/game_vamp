/**
 * Survivor's Night - HUD 시스템
 * 게임 내 UI 요소들을 관리합니다.
 */
class HUD {
    constructor() {
        // HUD 요소들
        this.elements = {
            healthBar: null,
            expBar: null,
            healthText: null,
            expText: null,
            survivalTime: null,
            enemyCount: null
        };
        
        // HUD 초기화
        this.init();
    }
    
    /**
     * HUD 초기화
     */
    init() {
        // HUD 요소들 참조 가져오기
        this.elements.healthBar = document.getElementById('healthFill');
        this.elements.expBar = document.getElementById('expFill');
        this.elements.healthText = document.getElementById('healthText');
        this.elements.expText = document.getElementById('expText');
        this.elements.survivalTime = document.getElementById('survivalTime');
        this.elements.enemyCount = document.getElementById('enemyCount');
        
        // 초기 상태 설정
        this.reset();
    }
    
    /**
     * HUD 업데이트
     */
    update(player, gameTime, enemyCount) {
        if (!player) return;
        
        // 체력바 업데이트
        this.updateHealthBar(player);
        
        // 경험치바 업데이트
        this.updateExpBar(player);
        
        // 생존 시간 업데이트
        this.updateSurvivalTime(gameTime);
        
        // 적 수 업데이트
        this.updateEnemyCount(enemyCount);
    }
    
    /**
     * 체력바 업데이트
     */
    updateHealthBar(player) {
        if (!this.elements.healthBar || !this.elements.healthText) return;
        
        const healthPercent = player.health / player.getMaxHealth();
        const healthPercentClamped = Math.max(0, Math.min(1, healthPercent));
        
        // 체력바 너비 업데이트
        this.elements.healthBar.style.width = (healthPercentClamped * 100) + '%';
        
        // 체력 텍스트 업데이트
        this.elements.healthText.textContent = `${Math.floor(player.health)}/${Math.floor(player.getMaxHealth())}`;
        
        // 체력에 따른 색상 변화
        this.updateHealthBarColor(healthPercentClamped);
    }
    
    /**
     * 체력바 색상 업데이트
     */
    updateHealthBarColor(healthPercent) {
        if (!this.elements.healthBar) return;
        
        let color;
        if (healthPercent > 0.6) {
            color = '#2ed573'; // 녹색 (건강함)
        } else if (healthPercent > 0.3) {
            color = '#ffa502'; // 주황색 (주의)
        } else {
            color = '#ff4757'; // 빨간색 (위험)
        }
        
        this.elements.healthBar.style.background = `linear-gradient(90deg, ${color}, ${this.adjustBrightness(color, -20)})`;
    }
    
    /**
     * 색상 밝기 조절
     */
    adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    /**
     * 경험치바 업데이트
     */
    updateExpBar(player) {
        if (!this.elements.expBar || !this.elements.expText) return;
        
        const expPercent = player.experience / player.experienceToNext;
        const expPercentClamped = Math.max(0, Math.min(1, expPercent));
        
        // 경험치바 너비 업데이트
        this.elements.expBar.style.width = (expPercentClamped * 100) + '%';
        
        // 경험치 텍스트 업데이트
        this.elements.expText.textContent = `레벨 ${player.level}`;
        
        // 레벨업 임박 시 깜빡임 효과
        if (expPercent > 0.9) {
            this.addBlinkEffect(this.elements.expBar);
        } else {
            this.removeBlinkEffect(this.elements.expBar);
        }
    }
    
    /**
     * 생존 시간 업데이트
     */
    updateSurvivalTime(gameTime) {
        if (!this.elements.survivalTime) return;
        
        // gameTime이 유효한 숫자인지 확인
        if (typeof gameTime !== 'number' || isNaN(gameTime) || !isFinite(gameTime)) {
            this.elements.survivalTime.textContent = '생존시간: 00:00';
            return;
        }
        
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.survivalTime.textContent = `생존시간: ${timeString}`;
        
        // 특정 시간마다 색상 변화
        this.updateTimeColor(minutes, seconds);
    }
    
    /**
     * 시간에 따른 색상 변화
     */
    updateTimeColor(minutes, seconds) {
        if (!this.elements.survivalTime) return;
        
        let color = '#ffffff'; // 기본 흰색
        
        if (minutes >= 10) {
            color = '#ff4757'; // 빨간색 (10분 이상)
        } else if (minutes >= 5) {
            color = '#ffa502'; // 주황색 (5분 이상)
        } else if (minutes >= 2) {
            color = '#ffdd59'; // 노란색 (2분 이상)
        }
        
        this.elements.survivalTime.style.color = color;
    }
    
    /**
     * 적 수 업데이트
     */
    updateEnemyCount(enemyCount) {
        if (!this.elements.enemyCount) return;
        
        this.elements.enemyCount.textContent = `적 수: ${enemyCount}`;
        
        // 적 수에 따른 색상 변화
        this.updateEnemyCountColor(enemyCount);
    }
    
    /**
     * 적 수에 따른 색상 변화
     */
    updateEnemyCountColor(enemyCount) {
        if (!this.elements.enemyCount) return;
        
        let color = '#ffffff'; // 기본 흰색
        
        if (enemyCount >= 80) {
            color = '#ff4757'; // 빨간색 (80개 이상)
        } else if (enemyCount >= 50) {
            color = '#ffa502'; // 주황색 (50개 이상)
        } else if (enemyCount >= 20) {
            color = '#ffdd59'; // 노란색 (20개 이상)
        }
        
        this.elements.enemyCount.style.color = color;
    }
    
    /**
     * 깜빡임 효과 추가
     */
    addBlinkEffect(element) {
        if (element.classList.contains('blink')) return;
        
        element.classList.add('blink');
        element.style.animation = 'blink 0.5s infinite';
    }
    
    /**
     * 깜빡임 효과 제거
     */
    removeBlinkEffect(element) {
        element.classList.remove('blink');
        element.style.animation = '';
    }
    
    /**
     * 레벨업 효과 표시
     */
    showLevelUpEffect(level) {
        // 레벨업 알림 생성
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.textContent = `레벨업! ${level}`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ffa500);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            animation: levelUp 2s ease-out forwards;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        `;
        
        // 애니메이션 스타일 추가
        if (!document.getElementById('levelUpStyles')) {
            const style = document.createElement('style');
            style.id = 'levelUpStyles';
            style.textContent = `
                @keyframes levelUp {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 2초 후 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    /**
     * 데미지 표시
     */
    showDamage(damage, x, y) {
        // 데미지 텍스트 생성
        const damageText = document.createElement('div');
        damageText.className = 'damage-text';
        damageText.textContent = `-${damage}`;
        damageText.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: #ff4757;
            font-size: 18px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            animation: damageFloat 1s ease-out forwards;
        `;
        
        // 애니메이션 스타일 추가
        if (!document.getElementById('damageStyles')) {
            const style = document.createElement('style');
            style.id = 'damageStyles';
            style.textContent = `
                @keyframes damageFloat {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-50px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(damageText);
        
        // 1초 후 제거
        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1000);
    }
    
    /**
     * 아이템 획득 효과 표시
     */
    showItemEffect(itemType, value) {
        // 아이템 효과 알림 생성
        const notification = document.createElement('div');
        notification.className = 'item-effect-notification';
        
        const effectNames = {
            attackDamage: '공격력',
            attackSpeed: '공격속도',
            attackRange: '공격범위',
            movementSpeed: '이동속도',
            maxHealth: '최대체력',
            healthRegen: '체력회복'
        };
        
        notification.textContent = `${effectNames[itemType] || itemType} +${value}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #2ed573;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            animation: itemEffect 3s ease-out forwards;
            border: 1px solid #2ed573;
        `;
        
        // 애니메이션 스타일 추가
        if (!document.getElementById('itemEffectStyles')) {
            const style = document.createElement('style');
            style.id = 'itemEffectStyles';
            style.textContent = `
                @keyframes itemEffect {
                    0% { transform: translateX(100%); opacity: 0; }
                    20% { transform: translateX(0); opacity: 1; }
                    80% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 3초 후 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    /**
     * HUD 리셋
     */
    reset() {
        // 체력바 리셋
        if (this.elements.healthBar) {
            this.elements.healthBar.style.width = '100%';
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #2ed573, #1e90ff)';
        }
        
        // 경험치바 리셋
        if (this.elements.expBar) {
            this.elements.expBar.style.width = '0%';
        }
        
        // 텍스트 리셋
        if (this.elements.healthText) {
            this.elements.healthText.textContent = '100/100';
        }
        
        if (this.elements.expText) {
            this.elements.expText.textContent = '레벨 1';
        }
        
        if (this.elements.survivalTime) {
            this.elements.survivalTime.textContent = '생존시간: 00:00';
            this.elements.survivalTime.style.color = '#ffffff';
        }
        
        if (this.elements.enemyCount) {
            this.elements.enemyCount.textContent = '적 수: 0';
            this.elements.enemyCount.style.color = '#ffffff';
        }
    }
    
    /**
     * HUD 숨기기
     */
    hide() {
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.style.display = 'none';
        }
    }
    
    /**
     * HUD 표시
     */
    show() {
        const gameUI = document.getElementById('gameUI');
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }
}
