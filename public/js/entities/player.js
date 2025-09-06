/**
 * Survivor's Night - 플레이어 클래스
 * 플레이어 캐릭터의 상태와 동작을 관리합니다.
 */
class Player {
    constructor(x, y, speed, attackRange, attackDamage) {
        // 위치
        this.x = x;
        this.y = y;
        
        // 크기
        this.radius = 16;
        
        // 이동
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
        
        // 체력
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.healthRegen = 0; // 초당 체력 회복량
        
        // 공격
        this.baseAttackRange = attackRange;  // 기본 공격 범위 (변경되지 않음)
        this.attackRange = attackRange;      // 현재 공격 범위 (레벨업으로 증가)
        this.levelAttackRangeBonus = 0;      // 레벨업으로 인한 공격 범위 보너스 (0.03 = 3%)
        this.attackDamage = attackDamage;
        this.baseAttackSpeed = 1.0;          // 기본 공격 속도 (변경되지 않음)
        this.attackSpeed = 1.0;              // 현재 공격 속도 (레벨업으로 증가)
        this.levelAttackSpeedBonus = 0;      // 레벨업으로 인한 공격 속도 보너스 (0.03 = 3%)
        this.lastAttackTime = 0;
        
        // 경험치 및 레벨
        this.experience = 0;
        this.level = 1;
        this.experienceToNext = this.getExperienceForLevel(this.level + 1);
        
        // 능력치 (아이템 효과 포함)
        this.stats = {
            attackDamage: 1.0,      // 공격력 배율
            attackSpeed: 1.0,       // 공격 속도 배율
            attackRange: 1.0,       // 공격 범위 배율
            movementSpeed: 1.0,     // 이동 속도 배율
            maxHealth: 1.0,         // 최대 체력 배율
            healthRegen: 0          // 체력 회복량
        };
        
        // 아이템 효과
        this.itemEffects = {
            attackDamage: [],
            attackSpeed: [],
            attackRange: [],
            movementSpeed: [],
            maxHealth: [],
            healthRegen: []
        };
        
        // 게임 통계
        this.enemiesKilled = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.survivalTime = 0;
        
        // 애니메이션
        this.animationTime = 0;
        this.isMoving = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.isDashing = false;
        
        // 공격 애니메이션
        this.attackAnimationTime = 0;
        this.isAttacking = false;
        this.attackDirection = { x: 0, y: 0 };
        this.attackParticles = [];
        
        // 디버그 옵션
        this.showAttackRange = false;
        
        // 🆕 마법사 공격 시스템 속성
        this.magicSystem = {
            // 매직 에로우
            magicArrow: {
                cooldown: 0,
                maxCooldown: 1.0,
                arrowCount: 1, // 레벨에 따라 증가
                range: 2.0, // 기본 공격 범위의 2배
                damage: 0.8 // 기본 공격력의 80%
            },
            
            // 파이어볼
            fireball: {
                cooldown: 0,
                maxCooldown: 2.0, // 자동 발사를 위해 3초 → 2초로 단축
                range: 2.0, // 기본 공격 범위의 2배 (테스트를 위해 증가)
                damage: 1.5, // 기본 공격력의 150%
                explosionRange: 0.25 // 60픽셀 폭발 범위 (0.25 * 2.0 * 120 = 60)
            },
            
            // 체인 라이트닝
            chainLightning: {
                cooldown: 0,
                maxCooldown: 5.0,
                range: 1.5, // 기본 공격 범위의 150%
                damage: 1.2, // 기본 공격력의 120%
                maxChains: 3 // 레벨에 따라 증가
            }
        };
        
        // 🆕 투사체 관리
        this.projectiles = [];
        
        // 🆕 마나 시스템 (선택사항)
        this.mana = 100;
        this.maxMana = 100;
        this.manaRegen = 5; // 초당 마나 회복
    }
    
    /**
     * 플레이어 업데이트
     */
    update(deltaTime, input) {
        // 이동 처리
        this.handleMovement(input, deltaTime);
        
        // 대시 처리
        this.handleDash(input, deltaTime);
        
        // 자동 공격
        this.handleAutoAttack(deltaTime);
        
        // 체력 회복
        this.handleHealthRegen(deltaTime);
        
        // 애니메이션 시간 업데이트
        this.animationTime += deltaTime;
        
        // 생존 시간 업데이트
        this.survivalTime += deltaTime;
        
        // 대시 쿨다운 감소
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        // 대시 지속시간 감소
        if (this.dashDuration > 0) {
            this.dashDuration -= deltaTime;
            if (this.dashDuration <= 0) {
                this.isDashing = false;
            }
        }
        
        // 🆕 마법 쿨다운 업데이트
        this.updateMagicCooldowns(deltaTime);
        
        // 🆕 마나 회복
        this.handleManaRegen(deltaTime);
        
        // 🆕 자동 특수 공격 처리 (레벨별)
        this.handleAutoSpecialAttacks();
        
        // 🆕 수동 특수 공격 처리 (키 입력)
        this.handleSpecialAttacks(input);
    }
    
    /**
     * 이동 처리
     */
    handleMovement(input, deltaTime) {
        const movement = input.getMovementVector();
        
        if (movement.x !== 0 || movement.y !== 0) {
            this.isMoving = true;
            
            // 이동 속도 계산 (아이템 효과 포함)
            const currentSpeed = this.speed * this.stats.movementSpeed;
            
            // 대시 중일 때 속도 증가
            const finalSpeed = this.isDashing ? currentSpeed * 2 : currentSpeed;
            
            // 속도 벡터 설정
            this.vx = movement.x * finalSpeed;
            this.vy = movement.y * finalSpeed;
            
            // 위치 업데이트
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // 화면 경계 체크
            this.checkBounds();
        } else {
            this.isMoving = false;
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    /**
     * 대시 처리
     */
    handleDash(input, deltaTime) {
        if (input.isSpacePressed() && this.dashCooldown <= 0 && !this.isDashing) {
            this.dashCooldown = 1.0; // 1초 쿨다운
            this.dashDuration = 0.2; // 0.2초 지속
            this.isDashing = true;
        }
    }
    
    /**
     * 자동 공격 처리
     */
    handleAutoAttack(deltaTime) {
        const currentTime = this.survivalTime;
        const attackInterval = 1.0 / (this.attackSpeed * this.stats.attackSpeed);
        
        if (currentTime - this.lastAttackTime >= attackInterval) {
            this.lastAttackTime = currentTime;
            
            // 공격 애니메이션 시작
            this.startAttackAnimation();
            
            // 🆕 레벨에 따른 다중 방향 공격
            this.executeMultiDirectionAttack();
        }
        
        // 공격 애니메이션 업데이트
        this.updateAttackAnimation(deltaTime);
    }
    
    /**
     * 공격 애니메이션 시작
     */
    startAttackAnimation() {
        this.isAttacking = true;
        this.attackAnimationTime = 0;
        
        // 공격 방향 설정 (마지막 이동 방향 또는 기본값)
        if (this.vx !== 0 || this.vy !== 0) {
            const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.attackDirection.x = this.vx / length;
            this.attackDirection.y = this.vy / length;
        } else {
            this.attackDirection.x = 1;
            this.attackDirection.y = 0;
        }
        
        // 공격 파티클 생성
        this.createAttackParticles();
    }
    
    /**
     * 공격 애니메이션 업데이트
     */
    updateAttackAnimation(deltaTime) {
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime;
            
            // 공격 애니메이션 지속시간 (0.3초)
            if (this.attackAnimationTime >= 0.3) {
                this.isAttacking = false;
                this.attackAnimationTime = 0;
            }
        }
        
        // 공격 파티클 업데이트
        this.attackParticles.forEach((particle, index) => {
            particle.lifetime -= deltaTime;
            if (particle.lifetime <= 0) {
                this.attackParticles.splice(index, 1);
            }
        });
    }
    
    /**
     * 🆕 레벨에 따른 다중 방향 공격 실행
     */
    executeMultiDirectionAttack() {
        // 🆕 1레벨: 전방향 공격 (가장 가까운 적)
        if (this.level === 1) {
            this.executeSingleTargetAttack();
            return;
        }
        
        // 🆕 2레벨 이상: 다중 방향 공격 (새로운 증가 체계)
        let attackDirections = 1;
        if (this.level >= 18) attackDirections = 9;        // 18레벨: 9개 (3레벨당 증가)
        else if (this.level >= 15) attackDirections = 8;   // 15레벨: 8개 (3레벨당 증가)
        else if (this.level >= 12) attackDirections = 7;   // 12레벨: 7개 (3레벨당 증가)
        else if (this.level >= 9) attackDirections = 6;    // 9레벨: 6개 (2레벨당 증가)
        else if (this.level >= 7) attackDirections = 5;    // 7레벨: 5개 (2레벨당 증가)
        else if (this.level >= 5) attackDirections = 4;    // 5레벨: 4개 (2레벨당 증가)
        else if (this.level >= 3) attackDirections = 3;    // 3레벨: 3개 (1레벨당 증가)
        else if (this.level >= 2) attackDirections = 2;    // 2레벨: 2개 (1레벨당 증가)
        
        // 🆕 각 방향에서 서로 다른 적을 찾아서 공격
        this.executeMultiTargetAttack(attackDirections);
        
        console.log(`다중 방향 공격 실행: ${attackDirections}방향, 레벨 ${this.level}`);
    }
    
    /**
     * 🆕 단일 타겟 공격 (1레벨)
     */
    executeSingleTargetAttack() {
        const attackRange = this.getCurrentAttackRange();
        const enemiesInRange = this.getEnemiesInRange();
        
        if (enemiesInRange.length > 0) {
            const targetEnemy = this.getClosestEnemy(enemiesInRange);
            if (targetEnemy) {
                this.attackEnemy(targetEnemy);
            }
        }
    }
    
    /**
     * 🆕 다중 타겟 공격 (2레벨 이상)
     */
    executeMultiTargetAttack(attackDirections) {
        const attackRange = this.getCurrentAttackRange();
        const searchDistance = attackRange * 1.5;
        
        // 🆕 공격 범위 내 모든 적 찾기
        const enemiesInRange = [];
        if (this.game && this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                if (!enemy || enemy.health <= 0) return;
                
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= searchDistance) {
                    enemiesInRange.push({
                        enemy: enemy,
                        distance: distance,
                        angle: Math.atan2(dy, dx)
                    });
                }
            });
        }
        
        if (enemiesInRange.length === 0) return;
        
        // 🆕 적 개수에 따른 분기 처리
        if (enemiesInRange.length === 1) {
            // 🆕 적이 1개일 때: 모든 공격을 해당 적에게 중첩
            const target = enemiesInRange[0].enemy;
            console.log(`적 1개 중첩 공격: ${target.type}에게 ${attackDirections}번 공격`);
            
            for (let i = 0; i < attackDirections; i++) {
                this.attackEnemy(target);
            }
            return;
        }
        
        // 🆕 적이 2개 이상일 때: 서로 다른 적 선택하여 공격
        // 거리 순으로 정렬 (가까운 순)
        enemiesInRange.sort((a, b) => a.distance - b.distance);
        
        const selectedTargets = [];
        const usedEnemies = new Set();
        
        // 🆕 attackDirections만큼 다른 적 선택
        for (let i = 0; i < Math.min(attackDirections, enemiesInRange.length); i++) {
            const target = enemiesInRange[i].enemy;
            
            // 이미 선택된 적은 건너뛰기
            if (usedEnemies.has(target)) {
                // 다음으로 가까운 적 찾기
                for (let j = i + 1; j < enemiesInRange.length; j++) {
                    const nextTarget = enemiesInRange[j].enemy;
                    if (!usedEnemies.has(nextTarget)) {
                        selectedTargets.push(nextTarget);
                        usedEnemies.add(nextTarget);
                        break;
                    }
                }
            } else {
                selectedTargets.push(target);
                usedEnemies.add(target);
            }
        }
        
        // 🆕 선택된 타겟들 공격
        selectedTargets.forEach(target => {
            this.attackEnemy(target);
        });
        
        console.log(`다중 타겟 공격: ${selectedTargets.length}개 적 선택, ${attackDirections}방향`);
    }
    
    /**
     * 공격 파티클 생성
     */
    createAttackParticles() {
        const attackRange = this.attackRange * this.stats.attackRange;
        
        // 🆕 1레벨: 전방향 파티클 (8개)
        if (this.level === 1) {
            const particleCount = 8;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = attackRange * (0.5 + Math.random() * 0.5);
                
                const particle = {
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 50,
                    vy: Math.sin(angle) * 50,
                    lifetime: 0.5,
                    maxLifetime: 0.5,
                    color: '#ffd700',
                    size: 2 + Math.random() * 2
                };
                
                this.attackParticles.push(particle);
            }
            return;
        }
        
        // 🆕 2레벨 이상: 스마트 파티클 생성 (새로운 증가 체계)
        let attackDirections = 1;
        if (this.level >= 18) attackDirections = 9;        // 18레벨: 9개 (3레벨당 증가)
        else if (this.level >= 15) attackDirections = 8;   // 15레벨: 8개 (3레벨당 증가)
        else if (this.level >= 12) attackDirections = 7;   // 12레벨: 7개 (3레벨당 증가)
        else if (this.level >= 9) attackDirections = 6;    // 9레벨: 6개 (2레벨당 증가)
        else if (this.level >= 7) attackDirections = 5;    // 7레벨: 5개 (2레벨당 증가)
        else if (this.level >= 5) attackDirections = 4;    // 5레벨: 4개 (2레벨당 증가)
        else if (this.level >= 3) attackDirections = 3;    // 3레벨: 3개 (1레벨당 증가)
        else if (this.level >= 2) attackDirections = 2;    // 2레벨: 2개 (1레벨당 증가)
        
        // 🆕 공격 범위 내 적 확인
        const enemiesInRange = this.getEnemiesInRange();
        
        if (enemiesInRange.length === 1) {
            // 🆕 적이 1개일 때: 중앙 집중 파티클
            const target = enemiesInRange[0];
            const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
            
            for (let i = 0; i < attackDirections; i++) {
                // 🆕 타겟 주변에 집중된 파티클
                const spreadAngle = targetAngle + (Math.random() - 0.5) * 0.5; // ±0.25라디안
                const distance = attackRange * (0.3 + Math.random() * 0.4); // 타겟 근처
                
                const particle = {
                    x: this.x + Math.cos(spreadAngle) * distance,
                    y: this.y + Math.sin(spreadAngle) * distance,
                    vx: Math.cos(spreadAngle) * 80,
                    vy: Math.sin(spreadAngle) * 80,
                    lifetime: 0.6,
                    maxLifetime: 0.6,
                    color: '#ffd700',
                    size: 3 + Math.random() * 2
                };
                
                this.attackParticles.push(particle);
            }
        } else if (enemiesInRange.length >= 2) {
            // 🆕 적이 여러 개일 때: 각 타겟 방향으로 분산 파티클
            const selectedTargets = this.getSelectedTargetsForParticles(attackDirections, enemiesInRange);
            
            selectedTargets.forEach((target, index) => {
                const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
                const distance = attackRange * (0.4 + Math.random() * 0.6);
                
                const particle = {
                    x: this.x + Math.cos(targetAngle) * distance,
                    y: this.y + Math.sin(targetAngle) * distance,
                    vx: Math.cos(targetAngle) * 60,
                    vy: Math.sin(targetAngle) * 60,
                    lifetime: 0.5,
                    maxLifetime: 0.5,
                    color: '#ffd700',
                    size: 2 + Math.random() * 2
                };
                
                this.attackParticles.push(particle);
            });
        } else {
            // 🆕 적이 없을 때: 기본 방향별 파티클
            for (let i = 0; i < attackDirections; i++) {
                const angle = (i / attackDirections) * Math.PI * 2;
                const distance = attackRange * (0.5 + Math.random() * 0.5);
                
                const particle = {
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 50,
                    vy: Math.sin(angle) * 50,
                    lifetime: 0.5,
                    maxLifetime: 0.5,
                    color: '#ffd700',
                    size: 2 + Math.random() * 2
                };
                
                this.attackParticles.push(particle);
            }
        }
    }
    
    /**
     * 🆕 매직 에로우 처리
     */
    handleMagicArrow() {
        const magic = this.magicSystem.magicArrow;
        
        if (magic.cooldown <= 0) {
            // 쿨다운 설정
            magic.cooldown = magic.maxCooldown;
            
            // 레벨별 화살 수 계산
            const arrowCount = magic.arrowCount;
            
            // 화살 발사
            for (let i = 0; i < arrowCount; i++) {
                this.fireMagicArrow();
            }
            
            console.log(`매직 에로우 발사! 화살 ${arrowCount}개, 레벨 ${this.level} 데미지 강화: ${((1 + (this.level - 1) * 0.05) * 100 - 100).toFixed(1)}%`);
        }
    }
    
    /**
     * 🆕 자동 특수공격 통합 처리 (레벨별)
     */
    handleAutoSpecialAttacks() {
        const skills = this.getAvailableSkills();
        
        // 2레벨: 매직애로우 자동 발사
        if (skills.magicArrow) {
            this.handleAutoMagicArrow();
        }
        
        // 3레벨: 파이어볼 자동 발사 (기존 유지)
        if (skills.fireball) {
            this.handleAutoFireball();
        }
        
        // 5레벨: 체인라이트닝은 수동 유지 (고위력 스킬)
    }
    
    /**
     * 🆕 매직애로우 자동 발사 처리
     */
    handleAutoMagicArrow() {
        const magic = this.magicSystem.magicArrow;
        
        if (magic.cooldown <= 0) {
            // 공격 범위 내 적이 있는지 확인
            const enemiesInRange = this.getEnemiesInRange();
            if (enemiesInRange.length > 0) {
                // 매직애로우 자동 발사
                this.handleMagicArrow();
            }
        }
    }
    
    /**
     * 🆕 파이어볼 자동 발사 처리
     */
    handleAutoFireball() {
        const magic = this.magicSystem.fireball;
        
        if (magic.cooldown <= 0) {
            // 공격 범위 내 적이 있는지 확인
            const enemiesInRange = this.getEnemiesInRange();
            if (enemiesInRange.length > 0) {
                // 가장 가까운 적을 타겟으로 선택
                const targetEnemy = this.getClosestEnemy(enemiesInRange);
                if (targetEnemy) {
                    // 파이어볼 자동 발사 (타겟 지정)
                    this.fireFireball(targetEnemy);
                }
            }
        }
    }
    
    /**
     * 🆕 매직 에로우 발사
     */
    fireMagicArrow() {
        // 🆕 스마트 방향으로 발사 (가장 가까운 적 기준 ±45도)
        let angle;
        const nearestEnemy = this.findNearestEnemyInRange();
        
        if (nearestEnemy) {
            // 가장 가까운 적 방향 기준 ±45도 범위
            const baseAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            const randomOffset = (Math.random() - 0.5) * Math.PI / 2; // ±45도
            angle = baseAngle + randomOffset;
        } else {
            // 적이 없으면 랜덤 방향
            angle = Math.random() * Math.PI * 2;
        }
        
        const range = this.getCurrentAttackRange() * this.magicSystem.magicArrow.range;
        
        // 🆕 투사체 생성
        // 🆕 레벨에 따른 데미지 강화 (레벨당 5% 증가)
        const levelDamageBonus = 1 + (this.level - 1) * 0.05;
        const enhancedDamage = this.getCurrentAttackDamage() * this.magicSystem.magicArrow.damage * levelDamageBonus;
        
        const projectile = new MagicArrowProjectile(
            this.x, this.y,
            angle,
            range,
            enhancedDamage
        );
        
        this.projectiles.push(projectile);
    }
    
    /**
     * 🆕 파이어볼 발사 (E키 또는 자동)
     */
    fireFireball(targetEnemy = null) {
        const magic = this.magicSystem.fireball;
        
        if (magic.cooldown <= 0) {
            // 쿨다운 설정
            magic.cooldown = magic.maxCooldown;
            
            // 🆕 파이어볼 공격 범위 계산
            const fireballRange = this.getCurrentAttackRange() * magic.range;
            
            // 🆕 타겟이 없으면 파이어볼 범위 내에서 가장 가까운 적을 자동으로 찾기
            if (!targetEnemy) {
                const enemiesInFireballRange = this.getEnemiesInSpecificRange(fireballRange);
                if (enemiesInFireballRange.length > 0) {
                    targetEnemy = this.getClosestEnemy(enemiesInFireballRange);
                    console.log(`파이어볼 오토타겟팅: ${targetEnemy.type} 선택됨 (범위: ${fireballRange.toFixed(1)})`);
                } else {
                    // 🆕 파이어볼 범위 내에 적이 없으면 발사하지 않음
                    console.log('파이어볼: 공격 범위 내에 적이 없어 발사하지 않음');
                    return;
                }
            }
            
            // 🆕 타겟이 있으면 타겟 방향으로 발사
            if (targetEnemy) {
                // 🆕 레벨에 따른 데미지 강화 (레벨당 5% 증가)
                const levelDamageBonus = 1 + (this.level - 1) * 0.05;
                
                // 타겟을 향한 방향 계산
                const dx = targetEnemy.x - this.x;
                const dy = targetEnemy.y - this.y;
                const angle = Math.atan2(dy, dx);
                console.log(`파이어볼 발사! 타겟: ${targetEnemy.type}, 방향: ${(angle * 180 / Math.PI).toFixed(1)}도, 범위: ${fireballRange.toFixed(1)}, 레벨 ${this.level} 데미지 강화: ${(levelDamageBonus * 100 - 100).toFixed(1)}%`);
                
                const enhancedDamage = this.getCurrentAttackDamage() * magic.damage * levelDamageBonus;
                
                const projectile = new FireballProjectile(
                    this.x, this.y,
                    angle,
                    fireballRange,
                    enhancedDamage,
                    magic.explosionRange
                );
                
                this.projectiles.push(projectile);
            }
        }
    }
    
    /**
     * 🆕 파이어볼 발사 방향 결정
     */
    getFireballDirection() {
        if (this.vx !== 0 || this.vy !== 0) {
            // 🆕 마지막 이동 방향 사용
            const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            return Math.atan2(this.vy, this.vx);
        } else {
            // 🆕 기본 방향 (오른쪽)
            return 0;
        }
    }
    
    /**
     * 🆕 체인 라이트닝 발사 (R키)
     */
    castChainLightning() {
        const magic = this.magicSystem.chainLightning;
        
        if (magic.cooldown <= 0) {
            // 쿨다운 설정
            magic.cooldown = magic.maxCooldown;
            
            // 🆕 가장 가까운 적 찾기
            const enemiesInRange = this.getEnemiesInRange();
            if (enemiesInRange.length === 0) {
                console.log('체인 라이트닝: 공격 범위 내 적이 없습니다.');
                return;
            }
            
            const firstTarget = this.getClosestEnemy(enemiesInRange);
            if (!firstTarget) {
                console.log('체인 라이트닝: 타겟을 찾을 수 없습니다.');
                return;
            }
            
            // 🆕 체인 라이트닝 시작
            // 🆕 레벨에 따른 데미지 강화 (레벨당 5% 증가)
            const levelDamageBonus = 1 + (this.level - 1) * 0.05;
            const enhancedDamage = this.getCurrentAttackDamage() * magic.damage * levelDamageBonus;
            
            const chainLightning = new ChainLightningProjectile(
                this.x, this.y,
                firstTarget,
                this.getCurrentAttackRange() * magic.range,
                enhancedDamage,
                magic.maxChains
            );
            
            this.projectiles.push(chainLightning);
            console.log(`체인 라이트닝 발사! 타겟: ${firstTarget.type}, 체인 수: ${magic.maxChains}, 레벨 ${this.level} 데미지 강화: ${(levelDamageBonus * 100 - 100).toFixed(1)}%`);
        } else {
            console.log(`체인 라이트닝 쿨다운: ${magic.cooldown.toFixed(1)}초 남음`);
        }
    }
    
    /**
     * 체력 회복 처리
     */
    handleHealthRegen(deltaTime) {
        if (this.health < this.getMaxHealth()) {
            this.health += this.stats.healthRegen * deltaTime;
            if (this.health > this.getMaxHealth()) {
                this.health = this.getMaxHealth();
            }
        }
    }
    
    /**
     * 🆕 마나 회복 처리
     */
    handleManaRegen(deltaTime) {
        if (this.mana < this.maxMana) {
            this.mana += this.manaRegen * deltaTime;
            if (this.mana > this.maxMana) {
                this.mana = this.maxMana;
            }
        }
    }
    
    /**
     * 🆕 마법 쿨다운 업데이트
     */
    updateMagicCooldowns(deltaTime) {
        Object.values(this.magicSystem).forEach(magic => {
            if (magic.cooldown > 0) {
                magic.cooldown -= deltaTime;
            }
        });
    }
    
    /**
     * 🆕 특수 공격 처리
     */
    handleSpecialAttacks(input) {
        // 🆕 input 객체 유효성 검사
        if (!input) {
            console.error('input 객체가 null 또는 undefined입니다.');
            return;
        }
        
        // 🆕 레벨별 사용 가능한 스킬 확인
        const skills = this.getAvailableSkills();
        
        // 🆕 Q키: 매직 애로우 (2레벨, 수동 발사도 가능)
        if (skills.magicArrow && typeof input.isQPressed === 'function' && input.isQPressed()) {
            console.log('Q키 입력 감지됨 - 매직 애로우 수동 발사 시도');
            this.handleMagicArrow();
        } else if (!skills.magicArrow && typeof input.isQPressed === 'function' && input.isQPressed()) {
            console.log('매직 애로우는 레벨 2에서 해금됩니다.');
        }
        
        // 🆕 E키: 파이어볼 (3레벨)
        if (skills.fireball && typeof input.isEPressed === 'function' && input.isEPressed()) {
            console.log('E키 입력 감지됨 - 파이어볼 발사 시도');
            this.fireFireball();
        } else if (!skills.fireball && typeof input.isEPressed === 'function' && input.isEPressed()) {
            console.log('파이어볼은 레벨 3에서 해금됩니다.');
        }
        
        // 🆕 R키: 체인 라이트닝 (5레벨)
        if (skills.chainLightning && typeof input.isRPressed === 'function' && input.isRPressed()) {
            console.log('R키 입력 감지됨 - 체인 라이트닝 발사 시도');
            this.castChainLightning();
        } else if (!skills.chainLightning && typeof input.isRPressed === 'function' && input.isRPressed()) {
            console.log('체인 라이트닝은 레벨 5에서 해금됩니다.');
        }
    }
    
    /**
     * 화면 경계 체크
     */
    checkBounds() {
        const margin = this.radius;
        
        if (this.x < margin) this.x = margin;
        if (this.x > 800 - margin) this.x = 800 - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > 600 - margin) this.y = 600 - margin;
    }
    
    /**
     * 데미지 받기
     */
    takeDamage(damage) {
        this.health -= damage;
        this.totalDamageTaken += damage;
        
        if (this.health < 0) {
            this.health = 0;
        }
        
        // 데미지 받음 효과 (시각적 피드백)
        this.createDamageParticles();
    }
    
    /**
     * 경험치 획득
     */
    gainExperience(exp) {
        this.experience += exp;
        this.enemiesKilled++;
        
        // 레벨업 체크
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }
    
    /**
     * 레벨업
     */
    levelUp() {
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = this.getExperienceForLevel(this.level + 1);
        
        // 기존 레벨업 보상
        this.maxHealth += 10;
        this.health = this.maxHealth; // 체력 완전 회복
        this.attackDamage += 2;
        this.speed += 3;
        
        // 🆕 공격 범위 증가 (레벨당 3%)
        const oldRange = this.attackRange;
        this.levelAttackRangeBonus = (this.level - 1) * 0.03; // 3%씩 누적
        this.attackRange = this.baseAttackRange * (1 + this.levelAttackRangeBonus);
        
        // 🆕 공격 속도 증가 (레벨당 3%)
        const oldSpeed = this.attackSpeed;
        this.levelAttackSpeedBonus = (this.level - 1) * 0.03; // 3%씩 누적
        this.attackSpeed = this.baseAttackSpeed * (1 + this.levelAttackSpeedBonus);
        
        // 🆕 증가 알림
        const rangeIncrease = ((this.attackRange - oldRange) / oldRange * 100).toFixed(1);
        const speedIncrease = ((this.attackSpeed - oldSpeed) / oldSpeed * 100).toFixed(1);
        console.log(`공격 범위 증가: ${oldRange.toFixed(1)} → ${this.attackRange.toFixed(1)} (+${rangeIncrease}%)`);
        console.log(`공격 속도 증가: ${oldSpeed.toFixed(2)} → ${this.attackSpeed.toFixed(2)} (+${speedIncrease}%)`);
        
        // 레벨업 효과 (파티클 등)
        this.createLevelUpParticles();
        
        // 🆕 마법 능력치 업데이트
        this.updateMagicStats();
        
        // 🆕 스킬 해금 알림
        this.checkSkillUnlocks();
        
        console.log(`레벨업! 현재 레벨: ${this.level}`);
    }
    
    /**
     * 레벨별 필요 경험치 계산
     */
    getExperienceForLevel(level) {
        if (level <= 1) return 0;
        return Math.floor(100 * Math.pow(1.5, level - 2));
    }
    
    /**
     * 🆕 마법 능력치 업데이트 (레벨업 시)
     */
    updateMagicStats() {
        const magic = this.magicSystem;
        
        // 🆕 매직 에로우 화살 수 증가
        if (this.level >= 20) magic.magicArrow.arrowCount = 5;
        else if (this.level >= 15) magic.magicArrow.arrowCount = 4;
        else if (this.level >= 10) magic.magicArrow.arrowCount = 3;
        else if (this.level >= 5) magic.magicArrow.arrowCount = 2;
        else magic.magicArrow.arrowCount = 1;
        
        // 🆕 체인 라이트닝 체인 수 증가 (레벨업마다 +1씩 증가)
        magic.chainLightning.maxChains = 3 + (this.level - 1);
        
        console.log(`마법 능력치 업데이트: 화살 ${magic.magicArrow.arrowCount}개, 체인 ${magic.chainLightning.maxChains}개`);
    }
    
    /**
     * 아이템 효과 적용
     */
    applyItemEffect(item) {
        const effectType = item.effectType;
        const effectValue = item.effectValue;
        const effectDuration = item.effectDuration;
        
        // 상세한 유효성 검사
        if (!item || typeof item !== 'object') {
            console.error('유효하지 않은 아이템 객체:', item);
            return;
        }
        
        if (!effectType || typeof effectType !== 'string') {
            console.error('유효하지 않은 아이템 효과 타입:', effectType, '아이템:', item);
            return;
        }
        
        if (!this.itemEffects[effectType]) {
            console.error('지원하지 않는 아이템 효과 타입:', effectType, '지원 타입:', Object.keys(this.itemEffects));
            return;
        }
        
        if (typeof effectValue !== 'number' || isNaN(effectValue)) {
            console.error('유효하지 않은 아이템 효과 값:', effectValue, '타입:', effectType);
            return;
        }
        
        // 아이템 효과 배열에 추가
        this.itemEffects[effectType].push({
            value: effectValue,
            duration: effectDuration || 30,
            startTime: this.survivalTime
        });
        
        // 통계 업데이트
        this.updateStats();
        
        // 🆕 아이템 효과 적용 상세 로그
        console.log(`아이템 효과 적용 성공: ${effectType} +${effectValue.toFixed(1)} (지속시간: ${effectDuration || 30}초)`);
    }
    

    
    /**
     * 통계 업데이트 (아이템 효과 반영)
     */
    updateStats() {
        // 기본값으로 리셋
        this.stats = {
            attackDamage: 1.0,
            attackSpeed: 1.0,
            attackRange: 1.0,
            movementSpeed: 1.0,
            maxHealth: 1.0,
            healthRegen: 0
        };
        
        // 아이템 효과 적용
        Object.keys(this.itemEffects).forEach(statType => {
            const effects = this.itemEffects[statType];
            
            // 만료된 효과 제거
            for (let i = effects.length - 1; i >= 0; i--) {
                if (this.survivalTime - effects[i].startTime >= effects[i].duration) {
                    effects.splice(i, 1);
                }
            }
            
            // 유효한 효과들의 합계 계산
            let totalEffect = 0;
            effects.forEach(effect => {
                totalEffect += effect.value;
            });
            
            // 통계에 적용
            if (statType === 'attackDamage' || statType === 'attackSpeed' || 
                statType === 'attackRange' || statType === 'movementSpeed' || 
                statType === 'maxHealth') {
                this.stats[statType] = 1.0 + totalEffect;
            } else {
                this.stats[statType] = totalEffect;
            }
        });
    }
    
    /**
     * 최대 체력 반환 (아이템 효과 포함)
     */
    getMaxHealth() {
        return this.maxHealth * this.stats.maxHealth;
    }
    
    /**
     * 현재 공격력 반환 (아이템 효과 포함)
     */
    getCurrentAttackDamage() {
        return this.attackDamage * this.stats.attackDamage;
    }
    
    /**
     * 현재 공격 범위 반환 (아이템 효과 포함)
     */
    getCurrentAttackRange() {
        return this.attackRange * this.stats.attackRange;
    }
    
    /**
     * 데미지 파티클 생성
     */
    createDamageParticles() {
        // 게임 클래스에서 파티클 생성 요청
        // this.game.createDamageParticles(this.x, this.y);
    }
    
    /**
     * 레벨업 파티클 생성
     */
    createLevelUpParticles() {
        // 게임 클래스에서 파티클 생성 요청
        // this.game.createLevelUpParticles(this.x, this.y);
    }
    
    /**
     * 플레이어 렌더링
     */
    render(ctx) {
        // 플레이어 몸체 (더미 이미지: 파란색 원)
        ctx.save();
        
        // 대시 중일 때 투명도 조절
        if (this.isDashing) {
            ctx.globalAlpha = 0.7;
        }
        
        // 플레이어 그리기
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // 레벨에 따른 색상 변화
        let fillColor = '#0066FF'; // 기본 파란색
        let strokeColor = '#0033CC';
        
        if (this.level >= 15) {
            fillColor = '#FFD700'; // 금색
            strokeColor = '#FFA500';
        } else if (this.level >= 10) {
            fillColor = '#9370DB'; // 보라색
            strokeColor = '#4B0082';
        } else if (this.level >= 5) {
            fillColor = '#FF69B4'; // 핑크색
            strokeColor = '#FF1493';
        }
        
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 레벨 표시
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level.toString(), this.x, this.y + 4);
        
        // 공격 범위 표시 (디버그용)
        if (this.showAttackRange) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.getCurrentAttackRange(), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // 🆕 공격 애니메이션 표시 (스마트 다중 방향) - 🚫 비활성화됨
        // 🆕 나중에 다시 활성화하려면 아래 주석을 해제하세요
        /*
        if (this.isAttacking) {
            const progress = this.attackAnimationTime / 0.3; // 0.3초 지속
            const alpha = 1 - progress;
            const scale = 1 + progress * 0.5;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            
            // 🆕 1레벨: 원형 공격 범위
            if (this.level === 1) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.getCurrentAttackRange() * scale, 0, Math.PI * 2);
                ctx.stroke();
            }
            // 🆕 2레벨 이상: 스마트 공격 범위 (새로운 증가 체계)
            else {
                let attackDirections = 1;
                if (this.level >= 18) attackDirections = 9;        // 18레벨: 9개 (3레벨당 증가)
                else if (this.level >= 15) attackDirections = 8;   // 15레벨: 8개 (3레벨당 증가)
                else if (this.level >= 12) attackDirections = 7;   // 12레벨: 7개 (3레벨당 증가)
                else if (this.level >= 9) attackDirections = 6;    // 9레벨: 6개 (2레벨당 증가)
                else if (this.level >= 7) attackDirections = 5;    // 7레벨: 5개 (2레벨당 증가)
                else if (this.level >= 5) attackDirections = 4;    // 5레벨: 4개 (2레벨당 증가)
                else if (this.level >= 3) attackDirections = 3;    // 3레벨: 3개 (1레벨당 증가)
                else if (this.level >= 2) attackDirections = 2;    // 2레벨: 2개 (1레벨당 증가)
                
                // 🆕 공격 범위 내 적 확인
                const enemiesInRange = this.getEnemiesInRange();
                
                if (enemiesInRange.length === 1) {
                    // 🆕 적이 1개일 때: 중앙 집중 공격 범위
                    const target = enemiesInRange[0];
                    const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
                    const range = this.getCurrentAttackRange() * scale;
                    
                    // 🆕 타겟 주변에 집중된 부채꼴
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, range, targetAngle - Math.PI/3, targetAngle + Math.PI/3);
                    ctx.lineTo(this.x, this.y);
                    ctx.closePath();
                    ctx.stroke();
                    
                    // 🆕 중앙 집중 표시
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, range * 0.3, 0, Math.PI * 2);
                    ctx.stroke();
                } else if (enemiesInRange.length >= 2) {
                    // 🆕 적이 여러 개일 때: 각 타겟 방향으로 공격 범위
                    const selectedTargets = this.getSelectedTargetsForParticles(attackDirections, enemiesInRange);
                    
                    selectedTargets.forEach((target, index) => {
                        const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
                        const range = this.getCurrentAttackRange() * scale;
                        
                        // 🆕 각 타겟 방향으로 부채꼴
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, range, targetAngle - Math.PI/4, targetAngle + Math.PI/4);
                        ctx.lineTo(this.x, this.y);
                        ctx.closePath();
                        ctx.stroke();
                    });
                } else {
                    // 🆕 적이 없을 때: 기본 방향별 공격 범위
                    for (let i = 0; i < attackDirections; i++) {
                        const angle = (i / attackDirections) * Math.PI * 2;
                        const range = this.getCurrentAttackRange() * scale;
                        
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, range, angle - Math.PI/attackDirections, angle + Math.PI/attackDirections);
                        ctx.lineTo(this.x, this.y);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
            
            ctx.restore();
        }
        */
        
        // 공격 파티클 렌더링
        this.attackParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.lifetime / particle.maxLifetime;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    /**
     * 공격 범위 내 적 감지
     */
    getEnemiesInRange() {
        if (!this.game || !this.game.enemies) return [];
        
        const range = this.getCurrentAttackRange();
        return this.game.enemies.filter(enemy => {
            if (!enemy || enemy.health <= 0) return false;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) + 
                Math.pow(this.y - enemy.y, 2)
            );
            return distance <= range;
        });
    }
    
    /**
     * 🆕 지정된 범위 내 적 감지 (파이어볼 등 특수 공격용)
     */
    getEnemiesInSpecificRange(range) {
        if (!this.game || !this.game.enemies) return [];
        
        return this.game.enemies.filter(enemy => {
            if (!enemy || enemy.health <= 0) return false;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) + 
                Math.pow(this.y - enemy.y, 2)
            );
            return distance <= range;
        });
    }
    
    /**
     * 가장 가까운 적 선택
     */
    getClosestEnemy(enemies) {
        if (!enemies || enemies.length === 0) return null;
        
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (!enemy || enemy.health <= 0) return;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) +
                Math.pow(this.y - enemy.y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }
    
    /**
     * 🆕 공격 범위 내 가장 가까운 적 찾기 (매직애로우용)
     */
    findNearestEnemyInRange() {
        const enemiesInRange = this.getEnemiesInRange();
        return this.getClosestEnemy(enemiesInRange);
    }
    
    /**
     * 🆕 레벨별 사용 가능한 스킬 확인
     */
    getAvailableSkills() {
        return {
            magicArrow: this.level >= 2,     // 2레벨: 매직애로우
            fireball: this.level >= 3,       // 3레벨: 파이어볼
            chainLightning: this.level >= 5  // 5레벨: 체인라이트닝
        };
    }
    
    /**
     * 🆕 스킬 해금 알림 체크
     */
    checkSkillUnlocks() {
        if (this.level === 2) {
            console.log('🎯 새로운 스킬 해금!');
            console.log('🎯 매직애로우 (Q키) - 자동 추적 투사체가 자동으로 발사됩니다!');
        }
        if (this.level === 3) {
            console.log('🔥 새로운 스킬 해금!');
            console.log('🔥 파이어볼 (E키) - 폭발 범위 데미지를 가진 투사체입니다!');
        }
        if (this.level === 5) {
            console.log('⚡ 새로운 스킬 해금!');
            console.log('⚡ 체인라이트닝 (R키) - 적들 사이를 연쇄 공격하는 강력한 마법입니다!');
        }
    }
    
    /**
     * 적 공격 실행
     */
    attackEnemy(enemy) {
        if (!enemy || enemy.health <= 0) return;
        
        const damage = this.getCurrentAttackDamage();
        const previousHealth = enemy.health;
        
        enemy.takeDamage(damage);
        
        console.log(`적 공격: ${enemy.type}, 데미지: ${damage}, 체력: ${previousHealth} → ${enemy.health}`);
        
        // 공격 효과 생성
        if (this.game && this.game.createAttackEffect) {
            this.game.createAttackEffect(this.x, this.y, enemy.x, enemy.y);
        }
        
        // 적 처치 시 경험치 획득
        if (enemy.health <= 0) {
            this.gainExperience(enemy.experience || 15);
            if (this.game && this.game.itemSystem) {
                this.game.itemSystem.dropItemFromEnemy(enemy);
            }
            this.enemiesKilled++;
            console.log(`적 처치됨: ${enemy.type}, 경험치 획득: ${enemy.experience || 15}`);
        }
        
        this.totalDamageDealt += damage;
    }
    
    /**
     * 현재 공격 범위 계산 (레벨업 보너스 + 아이템 효과)
     */
    getCurrentAttackRange() {
        return this.attackRange * this.stats.attackRange;
    }
    
    /**
     * 🆕 기본 공격 범위 반환 (레벨업 보너스 없음)
     */
    getBaseAttackRange() {
        return this.baseAttackRange;
    }
    
    /**
     * 🆕 레벨업 보너스만 반환 (0.05 = 5%)
     */
    getLevelAttackRangeBonus() {
        return this.levelAttackRangeBonus;
    }
    
    /**
     * 🆕 레벨업 보너스 퍼센트 반환
     */
    getLevelAttackRangeBonusPercent() {
        return (this.levelAttackRangeBonus * 100).toFixed(1);
    }
    
    /**
     * 🆕 기본 공격 속도 반환 (레벨업 보너스 없음)
     */
    getBaseAttackSpeed() {
        return this.baseAttackSpeed;
    }
    
    /**
     * 🆕 레벨업 공격속도 보너스만 반환 (0.02 = 2%)
     */
    getLevelAttackSpeedBonus() {
        return this.levelAttackSpeedBonus;
    }
    
    /**
     * 🆕 레벨업 공격속도 보너스 퍼센트 반환
     */
    getLevelAttackSpeedBonusPercent() {
        return (this.levelAttackSpeedBonus * 100).toFixed(1);
    }
    
    /**
     * 🆕 현재 공격 속도 계산 (레벨업 보너스 + 아이템 효과)
     */
    getCurrentAttackSpeed() {
        return this.attackSpeed * this.stats.attackSpeed;
    }
    
    /**
     * 현재 공격력 계산 (아이템 효과 포함)
     */
    getCurrentAttackDamage() {
        return this.attackDamage * this.stats.attackDamage;
    }
    
    /**
     * 플레이어 상태 정보 반환
     */
    getStatus() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.getMaxHealth(),
            level: this.level,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            stats: this.stats,
            isDashing: this.isDashing,
            dashCooldown: this.dashCooldown
        };
    }
    
    /**
     * 플레이어 리셋
     */
    reset() {
        this.health = this.maxHealth;
        this.experience = 0;
        this.level = 1;
        this.experienceToNext = this.getExperienceForLevel(2);
        this.enemiesKilled = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.survivalTime = 0;
        this.animationTime = 0;
        this.isMoving = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.isDashing = false;
        
        // 🆕 공격 범위 초기화
        this.attackRange = this.baseAttackRange;
        this.levelAttackRangeBonus = 0;
        
        // 🆕 공격 속도 초기화
        this.attackSpeed = this.baseAttackSpeed;
        this.levelAttackSpeedBonus = 0;
        
        // 아이템 효과 초기화
        Object.keys(this.itemEffects).forEach(key => {
            this.itemEffects[key] = [];
        });
        
        // 통계 초기화
        this.updateStats();
        
        // 🆕 마법 시스템 초기화
        this.updateMagicStats();
        
        // 🆕 투사체 초기화
        this.projectiles = [];
        
        // 🆕 마나 초기화
        this.mana = this.maxMana;
    }
    
    /**
     * 🆕 파티클용 타겟 선택 (파티클 생성 전용)
     */
    getSelectedTargetsForParticles(attackDirections, enemiesInRange) {
        if (enemiesInRange.length === 0) return [];
        
        // 거리 순으로 정렬
        const sortedEnemies = [...enemiesInRange].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - this.x, 2) + Math.pow(a.y - this.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - this.x, 2) + Math.pow(b.y - this.y, 2));
            return distA - distB;
        });
        
        const selectedTargets = [];
        const usedEnemies = new Set();
        
        // attackDirections만큼 다른 적 선택
        for (let i = 0; i < Math.min(attackDirections, sortedEnemies.length); i++) {
            const target = sortedEnemies[i];
            
            if (!usedEnemies.has(target)) {
                selectedTargets.push(target);
                usedEnemies.add(target);
            } else {
                // 다음으로 가까운 적 찾기
                for (let j = i + 1; j < sortedEnemies.length; j++) {
                    const nextTarget = sortedEnemies[j];
                    if (!usedEnemies.has(nextTarget)) {
                        selectedTargets.push(nextTarget);
                        usedEnemies.add(nextTarget);
                        break;
                    }
                }
            }
        }
        
        return selectedTargets;
    }
}
