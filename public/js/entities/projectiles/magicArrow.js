/**
 * Survivor's Night - 매직 에로우 투사체 클래스
 * 매직 에로우의 발사, 이동, 유도, 충돌을 관리합니다.
 */
class MagicArrowProjectile {
    constructor(x, y, angle, range, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.range = range;
        this.damage = damage;
        this.speed = 200;
        this.lifetime = range / this.speed;
        this.maxLifetime = this.lifetime;
        
        // 🆕 유도 시스템
        this.isGuided = false;
        this.targetEnemy = null;
        this.guideDelay = 0.1; // 0.1초 후 유도 시작
        
        // 🆕 시각적 효과
        this.size = 4;
        this.color = '#00ffff';
        this.trail = []; // 궤적 효과
    }
    
    /**
     * 투사체 업데이트
     */
    update(deltaTime, game) {
        // 🆕 궤적 업데이트
        this.trail.push({ x: this.x, y: this.y, time: 0 });
        
        // 🆕 오래된 궤적 제거
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].time += deltaTime;
            if (this.trail[i].time > 0.3) {
                this.trail.splice(i, 1);
            }
        }
        
        // 🆕 유도 시스템 구현
        if (!this.isGuided && this.lifetime < this.maxLifetime - this.guideDelay) {
            this.findTarget(game);
        }
        
        // 🆕 유도 중일 때 타겟을 향해 방향 조정
        if (this.isGuided && this.targetEnemy) {
            this.guideToTarget();
        }
        
        // 위치 업데이트
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
        
        // 수명 감소
        this.lifetime -= deltaTime;
        
        // 충돌 감지
        this.checkCollisions(game);
    }
    
    /**
     * 🆕 타겟 찾기
     */
    findTarget(game) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        game.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) + 
                Math.pow(this.y - enemy.y, 2)
            );
            
            if (distance < closestDistance && distance <= 150) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        if (closestEnemy) {
            this.targetEnemy = closestEnemy;
            this.isGuided = true;
            console.log(`매직 에로우 유도 시작: ${closestEnemy.type}`);
        }
    }
    
    /**
     * 🆕 적 처치 시 처리
     */
    handleEnemyDeath(enemy, game) {
        // 🆕 플레이어 경험치 획득
        if (game.player) {
            game.player.gainExperience(enemy.experience || 15);
            game.player.enemiesKilled++;
            console.log(`매직 에로우로 적 처치: ${enemy.type}, 경험치 획득: ${enemy.experience || 15}`);
        }
        
        // 🆕 아이템 드롭 체크
        if (game.itemSystem) {
            game.itemSystem.dropItemFromEnemy(enemy);
        }
    }
    
    /**
     * 🆕 타겟을 향해 유도
     */
    guideToTarget() {
        if (!this.targetEnemy || this.targetEnemy.health <= 0) {
            this.targetEnemy = null;
            this.isGuided = false;
            return;
        }
        
        // 🆕 타겟을 향해 방향 조정 (부드러운 전환)
        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // 🆕 각도 차이 계산
        let angleDiff = targetAngle - this.angle;
        
        // 🆕 각도 정규화 (-π ~ π)
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // 🆕 부드러운 각도 전환 (최대 90도/초)
        const maxRotation = Math.PI / 2 * deltaTime;
        if (Math.abs(angleDiff) > maxRotation) {
            angleDiff = Math.sign(angleDiff) * maxRotation;
        }
        
        this.angle += angleDiff;
    }
    
    /**
     * 🆕 충돌 감지
     */
    checkCollisions(game) {
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            if (enemy.health <= 0) continue;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) + 
                Math.pow(this.y - enemy.y, 2)
            );
            
            if (distance <= enemy.radius + this.size) {
                // 🆕 충돌 발생
                const previousHealth = enemy.health;
                enemy.takeDamage(this.damage);
                console.log(`매직 에로우 명중: ${enemy.type}, 데미지: ${this.damage}`);
                
                // 🆕 적 처치 시 경험치 및 아이템 처리
                if (enemy.health <= 0) {
                    this.handleEnemyDeath(enemy, game);
                }
                
                // 🆕 충돌 효과 생성
                if (game.createAttackEffect) {
                    game.createAttackEffect(this.x, this.y, enemy.x, enemy.y);
                }
                
                // 🆕 투사체 제거
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 🆕 투사체 렌더링
     */
    render(ctx) {
        // 🆕 궤적 렌더링
        this.trail.forEach((point, index) => {
            const alpha = 1 - (point.time / 0.3);
            const size = this.size * (1 - index / this.trail.length);
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 🆕 투사체 본체 렌더링
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 🆕 화살 모양 그리기
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(this.angle) * this.size, this.y + Math.sin(this.angle) * this.size);
        ctx.lineTo(this.x - Math.cos(this.angle) * this.size, this.y - Math.sin(this.angle) * this.size);
        ctx.lineTo(this.x + Math.cos(this.angle + Math.PI/6) * this.size * 0.5, this.y + Math.sin(this.angle + Math.PI/6) * this.size * 0.5);
        ctx.lineTo(this.x + Math.cos(this.angle - Math.PI/6) * this.size * 0.5, this.y + Math.sin(this.angle - Math.PI/6) * this.size * 0.5);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * 🆕 투사체 완료 여부 확인
     */
    isFinished() {
        return this.lifetime <= 0;
    }
}
