/**
 * Survivor's Night - 메뉴 시스템
 * 게임의 모든 메뉴와 화면 전환을 관리합니다.
 */
class Menu {
    constructor() {
        // 메뉴 요소들
        this.menus = {
            main: document.getElementById('gameMenu'),
            game: document.getElementById('gameScreen'),
            pause: document.getElementById('pauseMenu'),
            gameOver: document.getElementById('gameOverScreen'),
            help: document.getElementById('helpScreen')
        };
        
        // 현재 활성 메뉴
        this.activeMenu = 'main';
        
        // 메뉴 초기화
        this.init();
    }
    
    /**
     * 메뉴 초기화
     */
    init() {
        // 모든 메뉴 숨기기
        this.hideAll();
        
        // 메인 메뉴 표시
        this.showMainMenu();
        
        // 메뉴 전환 애니메이션 설정
        this.setupMenuAnimations();
    }
    
    /**
     * 메뉴 애니메이션 설정
     */
    setupMenuAnimations() {
        // 메뉴 전환 애니메이션 스타일 추가
        if (!document.getElementById('menuAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'menuAnimationStyles';
            style.textContent = `
                .menu {
                    transition: all 0.3s ease;
                }
                
                .menu.fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                
                .menu.fade-out {
                    animation: fadeOut 0.3s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.9); }
                }
                
                .menu-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * 모든 메뉴 숨기기
     */
    hideAll() {
        Object.values(this.menus).forEach(menu => {
            if (menu) {
                menu.classList.add('hidden');
                menu.classList.remove('fade-in', 'slide-in');
            }
        });
    }
    
    /**
     * 메인 메뉴 표시
     */
    showMainMenu() {
        this.hideAll();
        this.activeMenu = 'main';
        
        if (this.menus.main) {
            this.menus.main.classList.remove('hidden');
            this.menus.main.classList.add('fade-in');
        }
    }
    
    /**
     * 게임 화면 표시
     */
    showGameScreen() {
        this.hideAll();
        this.activeMenu = 'game';
        
        if (this.menus.game) {
            this.menus.game.classList.remove('hidden');
            this.menus.game.classList.add('slide-in');
        }
    }
    
    /**
     * 일시정지 메뉴 표시
     */
    showPauseMenu() {
        this.activeMenu = 'pause';
        
        if (this.menus.pause) {
            this.menus.pause.classList.remove('hidden');
            this.menus.pause.classList.add('fade-in');
        }
    }
    
    /**
     * 일시정지 메뉴 숨기기
     */
    hidePauseMenu() {
        if (this.menus.pause) {
            this.menus.pause.classList.add('hidden');
            this.menus.pause.classList.remove('fade-in');
        }
    }
    
    /**
     * 게임오버 화면 표시
     */
    showGameOver(finalStats) {
        this.activeMenu = 'gameOver';
        
        if (this.menus.gameOver) {
            // 최종 통계 표시
            this.updateGameOverStats(finalStats);
            
            this.menus.gameOver.classList.remove('hidden');
            this.menus.gameOver.classList.add('fade-in');
        }
    }
    
    /**
     * 게임오버 통계 업데이트
     */
    updateGameOverStats(stats) {
        const statsElement = document.getElementById('finalStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="game-over-stats">
                    <p><strong>생존 시간:</strong> ${stats.survivalTime}</p>
                    <p><strong>처치한 적:</strong> ${stats.enemiesKilled}마리</p>
                    <p><strong>최종 레벨:</strong> ${stats.level}</p>
                    <p><strong>최종 점수:</strong> ${stats.score.toLocaleString()}점</p>
                </div>
            `;
        }
    }
    
    /**
     * 도움말 화면 표시
     */
    showHelp() {
        this.hideAll();
        this.activeMenu = 'help';
        
        if (this.menus.help) {
            this.menus.help.classList.remove('hidden');
            this.menus.help.classList.add('fade-in');
        }
    }
    
    /**
     * 메뉴 전환 (애니메이션 포함)
     */
    switchMenu(fromMenu, toMenu) {
        if (!this.menus[fromMenu] || !this.menus[toMenu]) return;
        
        // 현재 메뉴 페이드 아웃
        this.menus[fromMenu].classList.add('fade-out');
        
        setTimeout(() => {
            // 현재 메뉴 숨기기
            this.menus[fromMenu].classList.add('hidden');
            this.menus[fromMenu].classList.remove('fade-out');
            
            // 새 메뉴 표시
            this.menus[toMenu].classList.remove('hidden');
            this.menus[toMenu].classList.add('fade-in');
            
            this.activeMenu = toMenu;
        }, 300);
    }
    
    /**
     * 메뉴 상태 확인
     */
    isMenuActive(menuName) {
        return this.activeMenu === menuName;
    }
    
    /**
     * 현재 활성 메뉴 반환
     */
    getActiveMenu() {
        return this.activeMenu;
    }
    
    /**
     * 메뉴 요소 가져오기
     */
    getMenu(menuName) {
        return this.menus[menuName];
    }
    
    /**
     * 메뉴 애니메이션 효과 추가
     */
    addMenuEffect(menuName, effectClass) {
        const menu = this.menus[menuName];
        if (menu) {
            menu.classList.add(effectClass);
        }
    }
    
    /**
     * 메뉴 애니메이션 효과 제거
     */
    removeMenuEffect(menuName, effectClass) {
        const menu = this.menus[menuName];
        if (menu) {
            menu.classList.remove(effectClass);
        }
    }
    
    /**
     * 메뉴 배경 블러 효과 추가
     */
    addBackgroundBlur() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.filter = 'blur(5px)';
        }
    }
    
    /**
     * 메뉴 배경 블러 효과 제거
     */
    removeBackgroundBlur() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.filter = 'none';
        }
    }
    
    /**
     * 메뉴 오버레이 추가
     */
    addOverlay() {
        let overlay = document.getElementById('menuOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'menuOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 15;
                pointer-events: none;
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'block';
    }
    
    /**
     * 메뉴 오버레이 제거
     */
    removeOverlay() {
        const overlay = document.getElementById('menuOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    /**
     * 메뉴 상태 저장
     */
    saveMenuState() {
        const state = {
            activeMenu: this.activeMenu,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('survivorsNight_menuState', JSON.stringify(state));
        } catch (e) {
            console.warn('메뉴 상태 저장 실패:', e);
        }
    }
    
    /**
     * 메뉴 상태 복원
     */
    restoreMenuState() {
        try {
            const saved = localStorage.getItem('survivorsNight_menuState');
            if (saved) {
                const state = JSON.parse(saved);
                
                // 1시간 이내의 저장된 상태만 복원
                if (Date.now() - state.timestamp < 3600000) {
                    this.activeMenu = state.activeMenu;
                    return true;
                }
            }
        } catch (e) {
            console.warn('메뉴 상태 복원 실패:', e);
        }
        
        return false;
    }
    
    /**
     * 메뉴 통계 반환
     */
    getStats() {
        return {
            activeMenu: this.activeMenu,
            totalMenus: Object.keys(this.menus).length,
            availableMenus: Object.keys(this.menus)
        };
    }
    
    /**
     * 메뉴 리셋
     */
    reset() {
        this.hideAll();
        this.activeMenu = 'main';
        this.showMainMenu();
        this.removeBackgroundBlur();
        this.removeOverlay();
    }
}
