/**
 * Survivor's Night - 파이어볼 투사체 클래스
 * 파이어볼의 발사, 이동, 폭발, 범위 데미지를 관리합니다.
 */
class FireballProjectile {
    constructor(x, y, angle, range, damage, explosionRange) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.range = range;
        this.damage = damage;
        this.explosionRange = explosionRange;
        this.speed = 150;
        this.lifetime = range / this.speed;
        this.maxLifetime = this.lifetime;
        
        // 🆕 폭발 효과
        this.hasExploded = false;
        
        // 🆕 시각적 효과
        this.size = 6;
        this.color = '#ff6600';
        this.trail = []; // 화염 궤적
        this.particles = []; // 화염 파티클
    }
    
    /**
     * 투사체 업데이트
     */
    update(deltaTime, game) {
        if (this.hasExploded) {
            // 🆕 폭발 범위 표시 시간 업데이트
            if (this.explosionDisplayTime > 0) {
                this.explosionDisplayTime -= deltaTime;
            }
            return false;
        }
        
        // 🆕 화염 궤적 업데이트
        this.trail.push({ x: this.x, y: this.y, time: 0 });
        
        // 🆕 오래된 궤적 제거
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].time += deltaTime;
            if (this.trail[i].time > 0.2) {
                this.trail.splice(i, 1);
            }
        }
        
        // 🆕 화염 파티클 생성
        if (Math.random() < 0.3) {
            this.createFireParticle();
        }
        
        // 🆕 화염 파티클 업데이트
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.lifetime -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // 위치 업데이트
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;
        
        // 수명 감소
        this.lifetime -= deltaTime;
        
        // 충돌 감지
        if (this.checkCollisions(game)) {
            this.explode(game);
        }
        
        return true;
    }
    
    /**
     * 🆕 화염 파티클 생성
     */
    createFireParticle() {
        const particle = {
            x: this.x + (Math.random() - 0.5) * 10,
            y: this.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            lifetime: 0.5 + Math.random() * 0.5,
            maxLifetime: 1.0,
            size: 2 + Math.random() * 3,
            color: ['#ff6600', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 3)]
        };
        
        this.particles.push(particle);
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
                return true; // 충돌 발생
            }
        }
        
        return false;
    }
    
    /**
     * 🆕 폭발 효과
     */
    explode(game) {
        this.hasExploded = true;
        
        // 🆕 폭발 범위 표시 시작
        this.explosionDisplayTime = 1.0; // 1초간 표시
        this.explosionDisplayRadius = this.explosionRange * this.range;
        
        // 🆕 범위 데미지 적용
        let hitCount = 0;
        game.enemies.forEach(enemy => {
            if (enemy.health <= 0) return;
            
            const distance = Math.sqrt(
                Math.pow(this.x - enemy.x, 2) + 
                Math.pow(this.y - enemy.y, 2)
            );
            
            if (distance <= this.explosionRange * this.range) {
                // 🆕 거리에 따른 데미지 감소
                const damageMultiplier = distance === 0 ? 1.0 : 
                    Math.max(0.3, 1.0 - (distance / (this.explosionRange * this.range)));
                
                const finalDamage = this.damage * damageMultiplier;
                const previousHealth = enemy.health;
                enemy.takeDamage(finalDamage);
                hitCount++;
                
                console.log(`파이어볼 폭발: ${enemy.type}, 데미지: ${finalDamage.toFixed(1)}`);
                
                // 🆕 적 처치 시 경험치 및 아이템 처리
                if (enemy.health <= 0) {
                    this.handleEnemyDeath(enemy, game);
                }
                
                // 🆕 화상 효과 적용
                this.applyBurnEffect(enemy, game);
            }
        });
        
        console.log(`파이어볼 폭발 완료: ${hitCount}마리 적 피격`);
        
        // 🆕 폭발 파티클 생성
        this.createExplosionParticles();
        
        // 🆕 화면 흔들림 효과
        if (game.startScreenShake) {
            game.startScreenShake(3, 0.3);
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
            console.log(`파이어볼로 적 처치: ${enemy.type}, 경험치 획득: ${enemy.experience || 15}`);
        }
        
        // 🆕 아이템 드롭 체크
        if (game.itemSystem) {
            game.itemSystem.dropItemFromEnemy(enemy);
        }
    }
    
    /**
     * 🆕 화상 효과 적용
     */
    applyBurnEffect(enemy, game) {
        // 🆕 화상 데미지 (3초간 초당 5 데미지)
        const burnEffect = {
            damage: 5,
            duration: 3.0,
            interval: 1.0,
            lastTick: 0,
            enemy: enemy,
            game: game
        };
        
        // 🆕 게임에 화상 효과 추가
        if (!game.burnEffects) {
            game.burnEffects = [];
        }
        game.burnEffects.push(burnEffect);
        
        console.log(`화상 효과 적용: ${enemy.type}`);
    }
    
    /**
     * 🆕 폭발 파티클 생성
     */
    createExplosionParticles() {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                lifetime: 0.5 + Math.random() * 0.5,
                maxLifetime: 1.0,
                size: 3 + Math.random() * 4,
                color: ['#ff6600', '#ff8800', '#ffaa00', '#ffcc00'][Math.floor(Math.random() * 4)]
            };
            
            this.particles.push(particle);
        }
    }
    
    /**
     * 🆕 투사체 렌더링
     */
    render(ctx) {
        // 🆕 화염 궤적 렌더링
        this.trail.forEach((point, index) => {
            const alpha = 1 - (point.time / 0.2);
            const size = this.size * (1 - index / this.trail.length) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 🆕 화염 파티클 렌더링
        this.particles.forEach(particle => {
            const alpha = particle.lifetime / particle.maxLifetime;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 🆕 폭발 범위 표시 (붉은색 원) - 1초 페이드 아웃
        if (this.hasExploded && this.explosionDisplayTime > 0) {
            // 🆕 부드러운 페이드 아웃 효과 (1초에 걸쳐 서서히 투명해짐)
            const fadeProgress = this.explosionDisplayTime / 1.0;
            const alpha = Math.pow(fadeProgress, 1.5); // 비선형 페이드 아웃으로 더 자연스럽게
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.8; // 최대 투명도 증가
            
            // 🆕 폭발 범위 원 (붉은색) - 선 두께도 페이드 아웃
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3 * fadeProgress; // 선 두께도 점점 얇아짐
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionDisplayRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 🆕 폭발 범위 내부 채우기 - 투명도도 페이드 아웃
            const fillAlpha = Math.max(0.05, alpha * 0.15); // 최소 투명도 보장
            ctx.fillStyle = `rgba(255, 0, 0, ${fillAlpha})`;
            ctx.fill();
            
            ctx.restore();
        }
        
        if (this.hasExploded) return;
        
        // 🆕 파이어볼 본체 렌더링
        ctx.save();
        
        // 🆕 그라데이션 효과
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#ffaa00');
        gradient.addColorStop(0.7, '#ff6600');
        gradient.addColorStop(1, '#ff4400');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 🆕 테두리
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 🆕 투사체 완료 여부 확인
     */
    isFinished() {
        // 🆕 폭발 범위 표시가 완료된 후에 투사체 제거
        return this.lifetime <= 0 || (this.hasExploded && this.explosionDisplayTime <= 0);
    }
}
