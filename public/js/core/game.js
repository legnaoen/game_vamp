/**
 * Survivor's Night - 메인 게임 클래스
 * 게임의 전체 상태와 로직을 관리합니다.
 */
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameLoop = null;
        this.input = null;
        
        // 게임 상태
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.gameTime = 0; // 게임 시작 후 경과 시간 (초)
        this.lastTime = 0; // 마지막 프레임 시간
        
        // 게임 객체들
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.particles = [];
        
        // 게임 시스템
        this.collisionSystem = null;
        this.spawnSystem = null;
        this.itemSystem = null;
        this.hud = null;
        this.menu = null;
        
        // 게임 설정
        this.config = {
            canvasWidth: 800,
            canvasHeight: 600,
            targetFPS: 60,
            spawnRate: 0.5, // 초당 적 생성 수
            maxEnemies: 100,
            playerSpeed: 150,
            playerAttackRange: 120, // 80 * 1.5 = 120
            playerAttackDamage: 10
        };
        
        // 화면 효과
        this.screenEffects = {
            shake: {
                intensity: 0,
                duration: 0,
                time: 0
            }
        };
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    init() {
        this.setupCanvas();
        this.setupSystems();
        this.setupEventListeners();
        this.showMainMenu();
    }
    
    /**
     * Canvas 설정
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas 크기 설정
        this.canvas.width = this.config.canvasWidth;
        this.canvas.height = this.config.canvasHeight;
        
        // Canvas 스타일 설정
        this.ctx.imageSmoothingEnabled = false; // 픽셀 아트 스타일
    }
    
    /**
     * 게임 시스템 설정
     */
    setupSystems() {
        // 입력 시스템
        this.input = new Input();
        
        // 충돌 감지 시스템
        this.collisionSystem = new CollisionSystem();
        
        // 스폰 시스템
        this.spawnSystem = new SpawnSystem(this);
        
        // 아이템 시스템
        this.itemSystem = new ItemSystem(this);
        
        // HUD 시스템
        this.hud = new HUD();
        
        // 메뉴 시스템
        this.menu = new Menu();
        
        // 게임 루프
        this.gameLoop = new GameLoop(this);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 게임 시작 버튼
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // 도움말 버튼
        document.getElementById('helpButton').addEventListener('click', () => {
            this.showHelp();
        });
        
        // 일시정지 메뉴 버튼들
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quitButton').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // 게임오버 화면 버튼들
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('mainMenuButton').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // 도움말 화면 버튼
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        this.gameState = 'playing';
        this.gameTime = 0;
        this.lastTime = performance.now();
        
        // 플레이어 생성
        this.player = new Player(
            this.config.canvasWidth / 2,
            this.config.canvasHeight / 2,
            this.config.playerSpeed,
            this.config.playerAttackRange,
            this.config.playerAttackDamage
        );
        
        // 플레이어에 게임 참조 설정
        this.player.game = this;
        
        // 적 배열 초기화
        this.enemies = [];
        this.items = [];
        this.particles = [];
        
        // 시스템 초기화
        this.spawnSystem.reset();
        this.itemSystem.reset();
        this.hud.reset();
        
        // 화면 전환
        this.menu.hideAll();
        this.menu.showGameScreen();
        
        // 게임 루프 시작
        this.gameLoop.start();
        
        console.log('게임 시작!');
        console.log('초기 게임 시간:', this.gameTime);
    }
    
    /**
     * 게임 일시정지
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.menu.showPauseMenu();
        }
    }
    
    /**
     * 게임 재개
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.menu.hidePauseMenu();
        }
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        this.startGame();
    }
    
    /**
     * 메인 메뉴로 돌아가기
     */
    quitToMenu() {
        this.gameState = 'menu';
        this.gameLoop.stop();
        this.menu.hideAll();
        this.menu.showMainMenu();
    }
    
    /**
     * 게임오버
     */
    gameOver() {
        this.gameState = 'gameOver';
        this.gameLoop.stop();
        
        // 최종 통계 계산
        const finalStats = this.calculateFinalStats();
        this.menu.showGameOver(finalStats);
        
        console.log('게임 오버!');
    }
    
    /**
     * 최종 통계 계산
     */
    calculateFinalStats() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const enemiesKilled = this.player ? this.player.enemiesKilled : 0;
        const level = this.player ? this.player.level : 1;
        
        return {
            survivalTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            enemiesKilled: enemiesKilled,
            level: level,
            score: Math.floor(this.gameTime * 10 + enemiesKilled * 100 + level * 1000)
        };
    }
    
    /**
     * 메인 메뉴 표시
     */
    showMainMenu() {
        this.gameState = 'menu';
        this.menu.hideAll();
        this.menu.showMainMenu();
    }
    
    /**
     * 도움말 표시
     */
    showHelp() {
        this.menu.hideAll();
        this.menu.showHelp();
    }
    
    /**
     * 키보드 다운 이벤트 처리
     */
    handleKeyDown(e) {
        if (this.gameState === 'playing') {
            this.input.handleKeyDown(e);
            
            // ESC 키로 일시정지
            if (e.key === 'Escape') {
                this.pauseGame();
            }
        } else if (this.gameState === 'paused') {
            // ESC 키로 재개
            if (e.key === 'Escape') {
                this.resumeGame();
            }
        }
    }
    
    /**
     * 키보드 업 이벤트 처리
     */
    handleKeyUp(e) {
        if (this.gameState === 'playing') {
            this.input.handleKeyUp(e);
        }
    }
    
    /**
     * 게임 업데이트 (매 프레임 호출)
     */
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // deltaTime이 유효한지 확인
        if (typeof deltaTime !== 'number' || isNaN(deltaTime) || !isFinite(deltaTime)) {
            console.warn('유효하지 않은 deltaTime:', deltaTime);
            deltaTime = 1/60; // 기본값으로 설정
        }
        
        // 게임 시간 업데이트
        this.gameTime += deltaTime;
        
        // 플레이어 업데이트
        if (this.player) {
            this.player.update(deltaTime, this.input);
        }
        
        // 적 업데이트 (역순으로 처리하여 안전하게 제거)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            try {
                if (enemy && typeof enemy.update === 'function') {
                    enemy.update(deltaTime, this.player);
                    
                    // 체력이 0 이하인 적 제거
                    if (enemy.health <= 0) {
                        console.log(`적 제거됨: ${enemy.type}, 체력: ${enemy.health}`);
                        this.enemies.splice(i, 1);
                        continue;
                    }
                    
                    // 화면 밖으로 나간 적 제거
                    if (this.isEnemyOutOfBounds(enemy)) {
                        this.enemies.splice(i, 1);
                    }
                }
            } catch (error) {
                console.error('적 업데이트 오류:', error);
                this.enemies.splice(i, 1); // 오류가 발생한 적 제거
            }
        }
        
        // 아이템 업데이트
        this.items.forEach((item, index) => {
            try {
                if (item && typeof item.update === 'function') {
                    item.update(deltaTime);
                    
                    // 수명이 다한 아이템 제거
                    if (item.lifetime <= 0) {
                        this.items.splice(index, 1);
                    }
                }
            } catch (error) {
                console.error('아이템 업데이트 오류:', error);
                this.items.splice(index, 1); // 오류가 발생한 아이템 제거
            }
        });
        
        // 파티클 업데이트
        this.particles.forEach((particle, index) => {
            try {
                if (particle && typeof particle.update === 'function') {
                    particle.update(deltaTime);
                    
                    // 수명이 다한 파티클 제거
                    if (particle.lifetime <= 0) {
                        this.particles.splice(index, 1);
                    }
                }
            } catch (error) {
                console.error('파티클 업데이트 오류:', error);
                this.particles.splice(index, 1); // 오류가 발생한 파티클 제거
            }
        });
        
        // 🆕 투사체 업데이트
        if (this.player && this.player.projectiles) {
            for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
                const projectile = this.player.projectiles[i];
                try {
                    if (projectile && typeof projectile.update === 'function') {
                        if (!projectile.update(deltaTime, this)) {
                            // 🆕 완료된 투사체 제거
                            this.player.projectiles.splice(i, 1);
                        }
                    }
                } catch (error) {
                    console.error('투사체 업데이트 오류:', error);
                    this.player.projectiles.splice(i, 1); // 오류가 발생한 투사체 제거
                }
            }
        }
        
        // 🆕 화상 효과 업데이트
        this.updateBurnEffects(deltaTime);
        
        // 충돌 감지
        this.updateCollisions();
        
        // 적 스폰
        this.spawnSystem.update(deltaTime);
        
        // 화면 효과 업데이트
        this.updateScreenEffects(deltaTime);
        
        // HUD 업데이트
        this.hud.update(this.player, this.gameTime, this.enemies.length);
        
        // 게임오버 체크
        if (this.player && this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 게임 렌더링 (매 프레임 호출)
     */
    render() {
        // Canvas 클리어
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
        
        // 격자 무늬 배경 (더미 배경)
        this.renderGrid();
        
        // 화면 효과 적용
        this.applyScreenEffects();
        
        // 게임 객체들 렌더링
        if (this.gameState === 'playing') {
            // 아이템 렌더링
            this.items.forEach(item => {
                try {
                    if (item && typeof item.render === 'function') {
                        item.render(this.ctx);
                    }
                } catch (error) {
                    console.error('아이템 렌더링 오류:', error);
                }
            });
            
            // 적 렌더링
            this.enemies.forEach(enemy => {
                try {
                    if (enemy && typeof enemy.render === 'function') {
                        enemy.render(this.ctx);
                    }
                } catch (error) {
                    console.error('적 렌더링 오류:', error);
                }
            });
            
            // 플레이어 렌더링
            if (this.player) {
                try {
                    this.player.render(this.ctx);
                } catch (error) {
                    console.error('플레이어 렌더링 오류:', error);
                }
            }
            
            // 파티클 렌더링
            this.particles.forEach(particle => {
                try {
                    if (particle && typeof particle.render === 'function') {
                        particle.render(this.ctx);
                    }
                } catch (error) {
                    console.error('파티클 렌더링 오류:', error);
                }
            });
            
            // 🆕 투사체 렌더링
            if (this.player && this.player.projectiles) {
                this.player.projectiles.forEach(projectile => {
                    try {
                        if (projectile && typeof projectile.render === 'function') {
                            projectile.render(this.ctx);
                        }
                    } catch (error) {
                        console.error('투사체 렌더링 오류:', error);
                    }
                });
            }
        }
        
        // 화면 효과 복원
        this.restoreScreenEffects();
    }
    
    /**
     * 격자 무늬 배경 렌더링
     */
    renderGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // 세로선
        for (let x = 0; x <= this.config.canvasWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.config.canvasHeight);
            this.ctx.stroke();
        }
        
        // 가로선
        for (let y = 0; y <= this.config.canvasHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.config.canvasWidth, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 충돌 감지 업데이트
     */
    updateCollisions() {
        if (!this.player) return;
        
        // 플레이어와 적 충돌 (역순으로 처리하여 안전하게 제거)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.collisionSystem.checkCollision(this.player, enemy)) {
                // 플레이어가 적에게 데미지
                this.player.takeDamage(enemy.damage);
                
                // 충돌 효과 (파티클)
                this.createCollisionParticles(enemy.x, enemy.y);
                
                // 화면 흔들림 효과
                this.startScreenShake(3, 0.2);
                
                // 아이템 드롭 체크
                this.itemSystem.dropItemFromEnemy(enemy);
                
                // 적 제거
                this.enemies.splice(i, 1);
                
                // 플레이어 경험치 획득
                this.player.gainExperience(enemy.experience);
                
                console.log(`충돌로 적 제거됨: ${enemy.type}`);
            }
        }
        
        // 플레이어와 아이템 충돌 (역순으로 처리하여 splice 문제 방지)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (this.collisionSystem.checkCollision(this.player, item)) {
                try {
                    // 아이템 효과 적용
                    item.applyEffect(this.player);
                    
                    // 아이템 제거
                    this.items.splice(i, 1);
                    
                    // 획득 효과 (파티클)
                    this.createItemParticles(item.x, item.y);
                    
                    console.log(`아이템 획득: ${item.name || item.type}`);
                } catch (error) {
                    console.error('아이템 효과 적용 중 오류:', error);
                    // 오류가 발생해도 아이템은 제거
                    this.items.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * 충돌 파티클 생성
     */
    createCollisionParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                lifetime: 0.5,
                maxLifetime: 0.5,
                color: '#ff4757',
                
                // 파티클 업데이트 메서드 추가
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                    
                    // 속도 감쇠
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                
                // 파티클 렌더링 메서드 추가
                render: function(ctx) {
                    if (this.lifetime <= 0) return;
                    
                    const alpha = this.lifetime / this.maxLifetime;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            this.particles.push(particle);
        }
    }
    
    /**
     * 아이템 획득 파티클 생성
     */
    createItemParticles(x, y) {
        for (let i = 0; i < 3; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                lifetime: 1.0,
                maxLifetime: 1.0,
                color: '#2ed573',
                
                // 파티클 업데이트 메서드 추가
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                    
                    // 속도 감쇠
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                
                // 파티클 렌더링 메서드 추가
                render: function(ctx) {
                    if (this.lifetime <= 0) return;
                    
                    const alpha = this.lifetime / this.maxLifetime;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            this.particles.push(particle);
        }
    }
    
    /**
     * 적이 화면 밖으로 나갔는지 확인
     */
    isEnemyOutOfBounds(enemy) {
        const margin = 50;
        return enemy.x < -margin || 
               enemy.x > this.config.canvasWidth + margin ||
               enemy.y < -margin || 
               enemy.y > this.config.canvasHeight + margin;
    }
    
    /**
     * 적 추가
     */
    addEnemy(enemy) {
        if (this.enemies.length < this.config.maxEnemies) {
            this.enemies.push(enemy);
        }
    }
    
    /**
     * 아이템 추가
     */
    addItem(item) {
        this.items.push(item);
    }
    
    /**
     * 적 제거
     */
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }
    
    /**
     * 파티클 추가
     */
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    /**
     * 화면 흔들림 효과 시작
     */
    startScreenShake(intensity = 5, duration = 0.3) {
        this.screenEffects.shake.intensity = intensity;
        this.screenEffects.shake.duration = duration;
        this.screenEffects.shake.time = 0;
    }
    
    /**
     * 화면 효과 업데이트
     */
    updateScreenEffects(deltaTime) {
        // 화면 흔들림 효과 업데이트
        if (this.screenEffects.shake.time < this.screenEffects.shake.duration) {
            this.screenEffects.shake.time += deltaTime;
        }
    }
    
    /**
     * 🆕 화상 효과 업데이트
     */
    updateBurnEffects(deltaTime) {
        if (!this.burnEffects) return;
        
        for (let i = this.burnEffects.length - 1; i >= 0; i--) {
            const effect = this.burnEffects[i];
            
            // 🆕 화상 데미지 적용
            if (effect.lastTick >= effect.interval) {
                effect.lastTick = 0;
                
                if (effect.enemy && effect.enemy.health > 0) {
                    effect.enemy.takeDamage(effect.damage);
                    console.log(`화상 데미지: ${effect.enemy.type}, 데미지: ${effect.damage}`);
                }
            }
            
            effect.lastTick += deltaTime;
            
            // 🆕 만료된 효과 제거
            if (effect.duration <= 0) {
                this.burnEffects.splice(i, 1);
                continue;
            }
            
            effect.duration -= deltaTime;
        }
    }
    
    /**
     * 화면 효과 적용
     */
    applyScreenEffects() {
        if (this.screenEffects.shake.time < this.screenEffects.shake.duration) {
            const progress = this.screenEffects.shake.time / this.screenEffects.shake.duration;
            const intensity = this.screenEffects.shake.intensity * (1 - progress);
            
            // 랜덤 오프셋 적용
            const offsetX = (Math.random() - 0.5) * intensity;
            const offsetY = (Math.random() - 0.5) * intensity;
            
            this.ctx.save();
            this.ctx.translate(offsetX, offsetY);
        }
    }
    
    /**
     * 화면 효과 복원
     */
    restoreScreenEffects() {
        if (this.screenEffects.shake.time < this.screenEffects.shake.duration) {
            this.ctx.restore();
        }
    }
    
    /**
     * 공격 효과 생성
     */
    createAttackEffect(startX, startY, endX, endY) {
        // 공격선 파티클 생성
        const particles = this.createAttackLineParticles(startX, startY, endX, endY);
        this.particles.push(...particles);
        
        // 화면 흔들림 효과
        this.startScreenShake(2, 0.1);
    }
    
    /**
     * 공격선 파티클 생성
     */
    createAttackLineParticles(startX, startY, endX, endY) {
        const particles = [];
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const progress = i / (particleCount - 1);
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                lifetime: 0.3,
                maxLifetime: 0.3,
                color: '#ffd700',
                size: 3 + Math.random() * 2,
                
                // 파티클 업데이트 메서드
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                },
                
                // 파티클 렌더링 메서드
                render: function(ctx) {
                    if (this.lifetime <= 0) return;
                    
                    const alpha = this.lifetime / this.maxLifetime;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            
            particles.push(particle);
        }
        
        return particles;
    }
}
