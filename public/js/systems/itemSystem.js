/**
 * Survivor's Night - 아이템 시스템
 * 아이템의 생성, 드롭, 효과 적용을 관리합니다.
 */
class ItemSystem {
    constructor(game) {
        this.game = game;
        
        // 아이템 타입별 설정
        this.itemTypes = {
            // 공격력 증가 (기본공격력의 10%씩 증가)
            attackDamage: {
                name: '공격력 강화',
                color: '#ff4757',
                radius: 8,
                lifetime: 15.0,
                effects: { attackDamage: 0.1 }
            },
            
            // 공격 속도 증가 (기본공격속도의 10%씩 증가)
            attackSpeed: {
                name: '공격속도 강화',
                color: '#ffa502',
                radius: 8,
                lifetime: 15.0,
                effects: { attackSpeed: 0.1 }
            },
            
            // 공격 범위 증가 (기본공격범위의 10%씩 증가)
            attackRange: {
                name: '공격범위 확장',
                color: '#2ed573',
                radius: 8,
                lifetime: 15.0,
                effects: { attackRange: 0.1 }
            },
            
            // 이동 속도 증가 (기본이동속도의 10%씩 증가)
            movementSpeed: {
                name: '이동속도 강화',
                color: '#1e90ff',
                radius: 8,
                lifetime: 15.0,
                effects: { movementSpeed: 0.1 }
            },
            
            // 최대 체력 증가 (기본체력의 10%씩 증가)
            maxHealth: {
                name: '체력 강화',
                color: '#ff6b81',
                radius: 8,
                lifetime: 15.0,
                effects: { maxHealth: 0.1 }
            },
            
            // 체력 회복 (고정값)
            healthRegen: {
                name: '체력회복',
                color: '#2ed573',
                radius: 8,
                lifetime: 15.0,
                effects: { healthRegen: 5 }
            }
        };
        
        // 아이템 드롭 확률
        this.dropRates = {
            common: 0.4,      // 일반 아이템 (40%) - 유지
            uncommon: 0.15,   // 희귀 아이템 (15%) - 유지
            rare: 0.05,       // 레어 아이템 (5%) - 10%에서 절반으로 감소
            epic: 0.025       // 에픽 아이템 (2.5%) - 5%에서 절반으로 감소
        };
        
        // 아이템 등급별 효과 배율 (각 등급마다 0.1씩 누적)
        this.rarityMultipliers = {
            common: 1.0,      // 0.1 (10%)
            uncommon: 2.0,    // 0.2 (20%)
            rare: 3.0,        // 0.3 (30%)
            epic: 4.0         // 0.4 (40%)
        };
        
        // 아이템 드롭 통계
        this.stats = {
            totalItemsDropped: 0,
            itemsByType: {},
            itemsByRarity: { common: 0, uncommon: 0, rare: 0, epic: 0 }
        };
    }
    
    /**
     * 적 처치 시 아이템 드롭
     */
    dropItemFromEnemy(enemy) {
        // 드롭 확률 계산 (기본 30%)
        const baseDropChance = 0.3;
        const dropChance = baseDropChance + (enemy.experience / 1000) * 0.1;
        
        if (Math.random() < dropChance) {
            const item = this.createRandomItem(enemy.x, enemy.y);
            if (item) {
                this.game.addItem(item);
                this.stats.totalItemsDropped++;
                this.stats.itemsByType[item.type] = (this.stats.itemsByType[item.type] || 0) + 1;
                this.stats.itemsByRarity[item.rarity]++;
                
                console.log(`${item.rarity} ${item.type} 아이템 드롭: ${item.name}`);
            }
        }
    }
    
    /**
     * 랜덤 아이템 생성
     */
    createRandomItem(x, y) {
        // 아이템 타입 선택
        const itemTypes = Object.keys(this.itemTypes);
        const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        // 등급 선택
        const rarity = this.selectRarity();
        
        // 아이템 설정 가져오기
        const itemConfig = this.itemTypes[selectedType];
        const rarityMultiplier = this.rarityMultipliers[rarity];
        
        // 아이템 생성
        const item = {
            x: x + (Math.random() - 0.5) * 20, // 적 위치 주변에 랜덤 배치
            y: y + (Math.random() - 0.5) * 20,
            type: selectedType,
            rarity: rarity,
            name: itemConfig.name,
            color: itemConfig.color,
            radius: itemConfig.radius,
            lifetime: itemConfig.lifetime,
            maxLifetime: itemConfig.lifetime,
            effects: {},
            
            // 등급별 효과 적용
            applyEffect: function(player) {
                // 효과가 없는 경우 처리
                if (!this.effects || Object.keys(this.effects).length === 0) {
                    console.warn('아이템에 효과가 없습니다:', this.name);
                    return;
                }
                
                Object.entries(this.effects).forEach(([stat, value]) => {
                    if (!stat || typeof value !== 'number') {
                        console.warn('유효하지 않은 아이템 효과:', stat, value);
                        return;
                    }
                    
                    const finalValue = value * rarityMultiplier;
                    // 아이템 객체 형태로 전달
                    player.applyItemEffect({
                        effectType: stat,
                        effectValue: finalValue,
                        effectDuration: 10 // 기본 지속시간
                    });
                });
                
                // HUD에 효과 표시
                if (this.game && this.game.hud) {
                    const effectType = Object.keys(this.effects)[0];
                    const effectValue = Object.values(this.effects)[0] * rarityMultiplier;
                    this.game.hud.showItemEffect(effectType, Math.round(effectValue * 100) / 100);
                }
                
                // 🆕 등급별 효과 상세 로그
                const effectType = Object.keys(this.effects)[0];
                const baseValue = Object.values(this.effects)[0];
                const finalValue = baseValue * rarityMultiplier;
                console.log(`${this.name} 효과 적용: ${effectType} +${finalValue.toFixed(1)} (${rarity} 등급, 기본값: ${baseValue} × ${rarityMultiplier})`);
            },
            
            // 아이템 업데이트
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                
                // 수명이 다한 아이템은 깜빡임 효과
                if (this.lifetime < 3.0) {
                    this.flashTime = (this.flashTime || 0) + deltaTime;
                }
            },
            
            // 아이템 렌더링
            render: function(ctx) {
                if (this.lifetime <= 0) return;
                
                ctx.save();
                
                // 등급별 테두리 색상
                const borderColors = {
                    common: '#ffffff',
                    uncommon: '#2ed573',
                    rare: '#1e90ff',
                    epic: '#ffd700'
                };
                
                const borderColor = borderColors[this.rarity];
                
                // 깜빡임 효과 (수명이 다할 때)
                if (this.lifetime < 3.0 && Math.floor(this.flashTime * 4) % 2 === 0) {
                    ctx.globalAlpha = 0.5;
                }
                
                // 등급별 테두리
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // 아이템 본체
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 등급 표시
                ctx.fillStyle = borderColor;
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.rarity.charAt(0).toUpperCase(), this.x, this.y + 3);
                
                ctx.restore();
            }
        };
        
        // 효과 복사 및 등급 적용 (아이템 생성 직후 즉시 복사)
        Object.entries(itemConfig.effects).forEach(([stat, value]) => {
            item.effects[stat] = value;
        });
        
        // 효과가 제대로 복사되었는지 확인
        if (Object.keys(item.effects).length === 0) {
            console.error('아이템 효과 복사 실패:', item.name, itemConfig.effects);
        } else {
            console.log(`아이템 생성 완료: ${item.name}, 효과:`, item.effects);
        }
        
        // 게임 참조 추가
        item.game = this.game;
        
        return item;
    }
    
    /**
     * 등급 선택
     */
    selectRarity() {
        const random = Math.random();
        
        // 누적 확률 계산 (총 100%로 정규화)
        const epicThreshold = this.dropRates.epic;
        const rareThreshold = epicThreshold + this.dropRates.rare;
        const uncommonThreshold = rareThreshold + this.dropRates.uncommon;
        const commonThreshold = uncommonThreshold + this.dropRates.common;
        
        if (random < epicThreshold) return 'epic';
        if (random < rareThreshold) return 'rare';
        if (random < uncommonThreshold) return 'uncommon';
        if (random < commonThreshold) return 'common';
        
        // 기본값으로 common 반환 (안전장치)
        return 'common';
    }
    
    /**
     * 특정 위치에 아이템 생성 (개발자 도구용)
     */
    createItemAtPosition(x, y, type = null, rarity = 'common') {
        const selectedType = type || Object.keys(this.itemTypes)[Math.floor(Math.random() * Object.keys(this.itemTypes).length)];
        const item = this.createRandomItem(x, y);
        
        if (type) {
            item.type = type;
            item.name = this.itemTypes[type].name;
            item.color = this.itemTypes[type].color;
        }
        
        if (rarity) {
            item.rarity = rarity;
        }
        
        this.game.addItem(item);
        return item;
    }
    
    /**
     * 아이템 시스템 통계 반환
     */
    getStats() {
        return {
            totalItemsDropped: this.stats.totalItemsDropped,
            itemsByType: this.stats.itemsByType,
            itemsByRarity: this.stats.itemsByRarity,
            dropRates: this.dropRates,
            rarityMultipliers: this.rarityMultipliers
        };
    }
    
    /**
     * 아이템 시스템 리셋
     */
    reset() {
        this.stats = {
            totalItemsDropped: 0,
            itemsByType: {},
            itemsByRarity: { common: 0, uncommon: 0, rare: 0, epic: 0 }
        };
    }
}
