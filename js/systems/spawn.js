/**
 * Survivor's Night - 스폰 시스템
 * 적과 아이템의 생성과 관리를 담당합니다.
 */
class SpawnSystem {
    constructor(game) {
        this.game = game;
        
        // 🆕 시간 기반 난이도 증가 시스템
        this.difficultySystem = {
            // 30초마다 적 출현 빈도 증가 (초당 0.5마리씩, 기본값 2.0)
            spawnRatePhases: [
                { time: 0, rate: 2.0 },      // 0-30초: 초당 2.0마리 (기본값 증가)
                { time: 30, rate: 2.5 },     // 30-60초: 초당 2.5마리
                { time: 60, rate: 3.0 },     // 1-1.5분: 초당 3.0마리
                { time: 90, rate: 3.5 },     // 1.5-2분: 초당 3.5마리
                { time: 120, rate: 4.0 },    // 2-2.5분: 초당 4.0마리
                { time: 150, rate: 4.5 },    // 2.5-3분: 초당 4.5마리
                { time: 180, rate: 5.0 },    // 3-3.5분: 초당 5.0마리
                { time: 210, rate: 5.5 },    // 3.5-4분: 초당 5.5마리
                { time: 240, rate: 6.0 },    // 4-4.5분: 초당 6.0마리
                { time: 270, rate: 6.5 },    // 4.5-5분: 초당 6.5마리
                { time: 300, rate: 7.0 },    // 5-5.5분: 초당 7.0마리
                { time: 330, rate: 7.5 },    // 5.5-6분: 초당 7.5마리
                { time: 360, rate: 8.0 },    // 6-6.5분: 초당 8.0마리
                { time: 390, rate: 8.5 },    // 6.5-7분: 초당 8.5마리
                { time: 420, rate: 9.0 },    // 7-7.5분: 초당 9.0마리
                { time: 450, rate: 9.5 },    // 7.5-8분: 초당 9.5마리
                { time: 480, rate: 10.0 },   // 8-8.5분: 초당 10.0마리
                { time: 510, rate: 10.5 },   // 8.5-9분: 초당 10.5마리
                { time: 540, rate: 11.0 },   // 9-9.5분: 초당 11.0마리
                { time: 570, rate: 11.5 }    // 9.5분+: 초당 11.5마리 (최종 구간)
            ],
            
            // 1분마다 적 강화 (최대 3배까지)
            enemyPowerPhases: [
                { time: 0, multiplier: 1.0 },     // 0-1분: 기본 강화
                { time: 60, multiplier: 1.2 },   // 1-2분: 20% 강화
                { time: 120, multiplier: 1.4 },  // 2-3분: 40% 강화
                { time: 180, multiplier: 1.6 },  // 3-4분: 60% 강화
                { time: 240, multiplier: 1.8 },  // 4-5분: 80% 강화
                { time: 300, multiplier: 2.0 },  // 5-6분: 100% 강화
                { time: 360, multiplier: 2.2 },  // 6-7분: 120% 강화
                { time: 420, multiplier: 2.4 },  // 7-8분: 140% 강화
                { time: 480, multiplier: 2.6 },  // 8-9분: 160% 강화
                { time: 540, multiplier: 2.8 },  // 9-10분: 180% 강화
                { time: 600, multiplier: 3.0 }   // 10분+: 200% 강화 (최종 구간)
            ]
        };
        
        // 스폰 설정
        this.spawnConfig = {
            baseSpawnRate: 2.0,        // 기본 스폰률 (초당) - 0.5에서 2.0으로 증가
            maxEnemies: 100,           // 최대 동시 적 수
            spawnDistance: 100,        // 플레이어로부터 최소 스폰 거리
            maxSpawnDistance: 300      // 플레이어로부터 최대 스폰 거리
        };
        
        // 스폰 타이머
        this.spawnTimer = 0;
        this.spawnInterval = 1.0 / this.spawnConfig.baseSpawnRate;
        
        // 적 타입별 스폰 확률
        this.enemySpawnWeights = {
            zombie: 60,    // 60% 확률
            ghost: 25,     // 25% 확률
            vampire: 12,   // 12% 확률
            boss: 3        // 3% 확률
        };
        
        // 보스 스폰 조건
        this.bossSpawnConditions = {
            minTime: 60,           // 최소 1분 후
            minLevel: 5,           // 최소 레벨 5
            interval: 120          // 2분마다
        };
        
        this.lastBossSpawn = 0;
        
        // 아이템 스폰 설정
        this.itemSpawnConfig = {
            baseChance: 0.1,       // 적 처치 시 10% 확률
            maxItems: 20,          // 최대 동시 아이템 수
            lifetime: 10.0         // 아이템 수명 (초)
        };
        
        // 스폰 통계
        this.spawnStats = {
            totalEnemiesSpawned: 0,
            totalItemsSpawned: 0,
            enemiesByType: { zombie: 0, ghost: 0, vampire: 0, boss: 0 },
            itemsByType: {}
        };
    }
    
    /**
     * 스폰 시스템 업데이트
     */
    update(deltaTime) {
        if (!this.game.player) return;
        
        // 스폰 타이머 업데이트
        this.spawnTimer += deltaTime;
        
        // 적 스폰 체크
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        // 보스 스폰 체크
        this.checkBossSpawn();
        
        // 🆕 시간 기반 난이도 증가 시스템 업데이트
        this.updateDifficulty();
    }
    
    /**
     * 적 스폰
     */
    spawnEnemy() {
        // 최대 적 수 체크
        if (this.game.enemies.length >= this.spawnConfig.maxEnemies) {
            return;
        }
        
        // 스폰 위치 계산
        const spawnPos = this.calculateSpawnPosition();
        if (!spawnPos) return;
        
        // 적 타입 선택
        const enemyType = this.selectEnemyType();
        
        // 🆕 현재 난이도에 맞는 적 강화 적용
        const currentPhase = this.getCurrentDifficultyPhase(this.game.gameTime);
        const enemy = new Enemy(spawnPos.x, spawnPos.y, enemyType);
        
        // 🆕 적 강화 적용 (체력, 공격력, 이동속도)
        if (currentPhase.powerMultiplier > 1.0) {
            enemy.health = Math.floor(enemy.health * currentPhase.powerMultiplier);
            enemy.maxHealth = Math.floor(enemy.maxHealth * currentPhase.powerMultiplier);
            enemy.damage = Math.floor(enemy.damage * currentPhase.powerMultiplier);
            enemy.speed = Math.floor(enemy.speed * (1 + (currentPhase.powerMultiplier - 1) * 0.5)); // 속도는 절반만 증가
        }
        
        // 적에 게임 참조 설정
        enemy.game = this.game;
        
        // 게임에 추가
        this.game.addEnemy(enemy);
        
        // 통계 업데이트
        this.spawnStats.totalEnemiesSpawned++;
        this.spawnStats.enemiesByType[enemyType]++;
        
        // 🆕 강화된 적 스폰 로그
        if (currentPhase.powerMultiplier > 1.0) {
            console.log(`⚔️ 강화된 ${enemyType} 스폰: (${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}) - 강화 ${(currentPhase.powerMultiplier * 100 - 100).toFixed(0)}%`);
        } else {
            console.log(`${enemyType} 스폰: (${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)})`);
        }
    }
    
    /**
     * 스폰 위치 계산
     */
    calculateSpawnPosition() {
        const player = this.game.player;
        const canvasWidth = this.game.config.canvasWidth;
        const canvasHeight = this.game.config.canvasHeight;
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            // 랜덤 각도 선택
            const angle = Math.random() * Math.PI * 2;
            
            // 랜덤 거리 선택 (최소~최대 스폰 거리)
            const distance = this.spawnConfig.spawnDistance + 
                           Math.random() * (this.spawnConfig.maxSpawnDistance - this.spawnConfig.spawnDistance);
            
            // 스폰 위치 계산
            const spawnX = player.x + Math.cos(angle) * distance;
            const spawnY = player.y + Math.sin(angle) * distance;
            
            // 화면 경계 체크
            if (spawnX < 0 || spawnX > canvasWidth || 
                spawnY < 0 || spawnY > canvasHeight) {
                continue;
            }
            
            // 다른 적과의 거리 체크
            if (this.isValidSpawnPosition(spawnX, spawnY)) {
                return { x: spawnX, y: spawnY };
            }
        }
        
        return null; // 적절한 위치를 찾지 못함
    }
    
    /**
     * 스폰 위치 유효성 검사
     */
    isValidSpawnPosition(x, y) {
        const minDistance = 30; // 최소 간격
        
        // 다른 적과의 거리 체크
        for (const enemy of this.game.enemies) {
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 적 타입 선택
     */
    selectEnemyType() {
        const totalWeight = Object.values(this.enemySpawnWeights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(this.enemySpawnWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'zombie'; // 기본값
    }
    
    /**
     * 보스 스폰 체크
     */
    checkBossSpawn() {
        const player = this.game.player;
        const currentTime = this.game.gameTime;
        
        // 보스 스폰 조건 체크
        if (currentTime >= this.bossSpawnConditions.minTime &&
            player.level >= this.bossSpawnConditions.minLevel &&
            currentTime - this.lastBossSpawn >= this.bossSpawnConditions.interval) {
            
            // 보스 스폰
            this.spawnBoss();
            this.lastBossSpawn = currentTime;
        }
    }
    
    /**
     * 보스 스폰
     */
    spawnBoss() {
        // 최대 적 수 체크
        if (this.game.enemies.length >= this.spawnConfig.maxEnemies) {
            return;
        }
        
        // 보스 스폰 위치 계산 (플레이어 근처)
        const player = this.game.player;
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 50;
        
        const spawnX = player.x + Math.cos(angle) * distance;
        const spawnY = player.y + Math.sin(angle) * distance;
        
        // 보스 생성
        const boss = new Enemy(spawnX, spawnY, 'boss');
        
        // 보스에 게임 참조 설정
        boss.game = this.game;
        
        // 게임에 추가
        this.game.addEnemy(boss);
        
        // 통계 업데이트
        this.spawnStats.totalEnemiesSpawned++;
        this.spawnStats.enemiesByType.boss++;
        
        console.log('보스 스폰!');
    }
    
    /**
     * 🆕 시간 기반 난이도 증가 시스템 업데이트
     */
    updateDifficulty() {
        const currentTime = this.game.gameTime;
        
        // 🆕 현재 시간에 맞는 스폰 레이트 계산
        let currentSpawnRate = this.difficultySystem.spawnRatePhases[0].rate;
        for (let i = this.difficultySystem.spawnRatePhases.length - 1; i >= 0; i--) {
            if (currentTime >= this.difficultySystem.spawnRatePhases[i].time) {
                currentSpawnRate = this.difficultySystem.spawnRatePhases[i].rate;
                break;
            }
        }
        
        // 🆕 스폰 간격 업데이트
        this.spawnInterval = 1.0 / currentSpawnRate;
        
        // 🆕 현재 난이도 정보 로그 (30초마다)
        if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) > 0) {
            const currentPhase = this.getCurrentDifficultyPhase(currentTime);
            console.log(`🎯 난이도 업데이트: ${Math.floor(currentTime)}초 경과`);
            console.log(`   📈 스폰 레이트: ${currentSpawnRate.toFixed(1)}/초`);
            console.log(`   ⚔️ 적 강화: ${(currentPhase.powerMultiplier * 100 - 100).toFixed(0)}%`);
        }
    }
    
    /**
     * 🆕 현재 난이도 단계 정보 반환
     */
    getCurrentDifficultyPhase(currentTime) {
        // 🆕 스폰 레이트 단계
        let currentSpawnPhase = this.difficultySystem.spawnRatePhases[0];
        for (let i = this.difficultySystem.spawnRatePhases.length - 1; i >= 0; i--) {
            if (currentTime >= this.difficultySystem.spawnRatePhases[i].time) {
                currentSpawnPhase = this.difficultySystem.spawnRatePhases[i];
                break;
            }
        }
        
        // 🆕 적 강화 단계
        let currentPowerPhase = this.difficultySystem.enemyPowerPhases[0];
        for (let i = this.difficultySystem.enemyPowerPhases.length - 1; i >= 0; i--) {
            if (currentTime >= this.difficultySystem.enemyPowerPhases[i].time) {
                currentPowerPhase = this.difficultySystem.enemyPowerPhases[i];
                break;
            }
        }
        
        return {
            spawnRate: currentSpawnPhase.rate,
            powerMultiplier: currentPowerPhase.multiplier,
            spawnPhase: currentSpawnPhase,
            powerPhase: currentPowerPhase
        };
    }
    
    /**
     * 아이템 스폰
     */
    spawnItem(x, y, type = 'random') {
        // 최대 아이템 수 체크
        if (this.game.items.length >= this.itemSpawnConfig.maxItems) {
            return;
        }
        
        // 아이템 타입이 랜덤이면 선택
        if (type === 'random') {
            type = this.selectItemType();
        }
        
        // 아이템 생성
        const item = this.createItem(x, y, type);
        
        // 게임에 추가
        this.game.addItem(item);
        
        // 통계 업데이트
        this.spawnStats.totalItemsSpawned++;
        if (!this.spawnStats.itemsByType[type]) {
            this.spawnStats.itemsByType[type] = 0;
        }
        this.spawnStats.itemsByType[type]++;
    }
    
    /**
     * 아이템 타입 선택
     */
    selectItemType() {
        const itemTypes = [
            'attackDamage',
            'attackSpeed', 
            'attackRange',
            'movementSpeed',
            'maxHealth',
            'healthRegen'
        ];
        
        return itemTypes[Math.floor(Math.random() * itemTypes.length)];
    }
    
    /**
     * 아이템 생성
     */
    createItem(x, y, type) {
        // 아이템 속성 설정
        const itemConfig = this.getItemConfig(type);
        
        return {
            x: x,
            y: y,
            radius: 8,
            type: type,
            effectType: type,
            effectValue: itemConfig.value,
            effectDuration: itemConfig.duration,
            lifetime: this.itemSpawnConfig.lifetime,
            color: itemConfig.color,
            strokeColor: itemConfig.strokeColor,
            
            // 아이템 업데이트
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
            },
            
            // 아이템 렌더링
            render: function(ctx) {
                ctx.save();
                
                // 아이템 몸체
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = this.strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 아이템 아이콘 (더미)
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.getIcon(), this.x, this.y + 3);
                
                ctx.restore();
            },
            
            // 아이템 아이콘
            getIcon: function() {
                const icons = {
                    attackDamage: '⚔',
                    attackSpeed: '⚡',
                    attackRange: '🎯',
                    movementSpeed: '🏃',
                    maxHealth: '❤',
                    healthRegen: '💚'
                };
                return icons[this.type] || '?';
            },
            
            // 효과 적용
            applyEffect: function(player) {
                player.applyItemEffect(this);
            }
        };
    }
    
    /**
     * 아이템 설정 반환
     */
    getItemConfig(type) {
        const configs = {
            attackDamage: { value: 0.2, duration: 30, color: '#FF4500', strokeColor: '#CC3700' },
            attackSpeed: { value: 0.15, duration: 30, color: '#FFD700', strokeColor: '#FFA500' },
            attackRange: { value: 0.25, duration: 30, color: '#9370DB', strokeColor: '#4B0082' },
            movementSpeed: { value: 0.2, duration: 30, color: '#00CED1', strokeColor: '#008B8B' },
            maxHealth: { value: 0.1, duration: 30, color: '#FF69B4', strokeColor: '#FF1493' },
            healthRegen: { value: 5, duration: 30, color: '#32CD32', strokeColor: '#228B22' }
        };
        
        return configs[type] || configs.attackDamage;
    }
    
    /**
     * 스폰 시스템 리셋
     */
    reset() {
        this.spawnTimer = 0;
        this.spawnInterval = 1.0 / this.spawnConfig.baseSpawnRate;
        this.lastBossSpawn = 0;
        
        // 🆕 난이도 시스템 초기화
        console.log('🎯 난이도 시스템 리셋됨');
        
        // 통계 리셋
        this.spawnStats = {
            totalEnemiesSpawned: 0,
            totalItemsSpawned: 0,
            enemiesByType: { zombie: 0, ghost: 0, vampire: 0, boss: 0 },
            itemsByType: {}
        };
    }
    
    /**
     * 스폰 통계 반환
     */
    getStats() {
        const currentPhase = this.getCurrentDifficultyPhase(this.game.gameTime);
        return {
            ...this.spawnStats,
            currentEnemyCount: this.game.enemies.length,
            currentItemCount: this.game.items.length,
            spawnRate: 1.0 / this.spawnInterval,
            // 🆕 현재 난이도 정보 추가
            currentDifficulty: {
                spawnRate: currentPhase.spawnRate,
                powerMultiplier: currentPhase.powerMultiplier,
                timeElapsed: Math.floor(this.game.gameTime),
                phase: {
                    spawn: currentPhase.spawnPhase,
                    power: currentPhase.powerPhase
                }
            }
        };
    }
}
