/**
 * Survivor's Night - 체인 라이트닝 투사체 클래스
 * 체인 라이트닝의 연쇄 공격, 데미지 감쇠를 관리합니다.
 */
class ChainLightningProjectile {
    constructor(x, y, firstTarget, range, damage, maxChains) {
        this.x = x;
        this.y = y;
        this.firstTarget = firstTarget;
        this.range = range;
        this.damage = damage;
        this.maxChains = maxChains;
        
        // 🆕 체인 시스템
        this.chainCount = 0;
        this.chainDelay = 0.2; // 체인 간 지연 (0.2초)
        this.chainTimer = 0;
        this.hitEnemies = new Set(); // 이미 맞은 적들
        this.currentTarget = firstTarget;
        this.startPosition = { x: x, y: y }; // 시작 위치 저장
        
        // 🆕 체인 진행 과정 추적
        this.chainHistory = [];
        this.chainSegments = [];
        
        // 🆕 시각적 효과
        this.lightningParticles = [];
        this.color = '#00ffff';
        this.size = 3;
        
        // 🆕 첫 번째 체인 즉시 실행 플래그
        this.firstChainExecuted = false;
    }
    
    /**
     * 투사체 업데이트
     */
    update(deltaTime, game) {
        // 🆕 첫 번째 체인 즉시 실행
        if (!this.firstChainExecuted) {
            this.executeChain(game);
            this.firstChainExecuted = true;
            return true;
        }
        
        if (this.chainCount >= this.maxChains || !this.currentTarget) {
            return false; // 체인 완료
        }
        
        this.chainTimer += deltaTime;
        
        if (this.chainTimer >= this.chainDelay) {
            this.chainTimer = 0;
            this.executeChain(game);
        }
        
        // 🆕 체인 세그먼트 업데이트 (개별 타이머 시스템)
        for (let i = this.chainSegments.length - 1; i >= 0; i--) {
            const segment = this.chainSegments[i];
            
            // 🆕 개별 타이머로 지속시간 계산
            const elapsedTime = (this.gameTime || 0) - segment.startTime;
            segment.lifetime = Math.max(0, segment.maxLifetime - elapsedTime);
            
            if (segment.lifetime <= 0) {
                this.chainSegments.splice(i, 1);
            }
        }
        
        // 🆕 번개 파티클 업데이트
        for (let i = this.lightningParticles.length - 1; i >= 0; i--) {
            const particle = this.lightningParticles[i];
            particle.lifetime -= deltaTime;
            
            if (particle.lifetime <= 0) {
                this.lightningParticles.splice(i, 1);
            }
        }
        
        return true; // 계속 진행
    }
    
    /**
     * 🆕 체인 실행
     */
    executeChain(game) {
        if (!this.currentTarget || this.currentTarget.health <= 0) {
            this.findNextTarget(game);
            return;
        }
        
        // 🆕 현재 타겟 공격
        const damageMultiplier = Math.pow(0.8, this.chainCount); // 체인마다 20% 감소
        const finalDamage = this.damage * damageMultiplier;
        const previousHealth = this.currentTarget.health;
        
        this.currentTarget.takeDamage(finalDamage);
        console.log(`체인 라이트닝 ${this.chainCount + 1}차: ${this.currentTarget.type}, 데미지: ${finalDamage.toFixed(1)}`);
        
        // 🆕 적 처치 시 경험치 및 아이템 처리
        if (this.currentTarget.health <= 0) {
            this.handleEnemyDeath(this.currentTarget, game);
        }
        
        // 🆕 체인 세그먼트 추가 (수정된 방식)
        this.addChainSegment();
        
        // 🆕 번개 파티클 생성 (체인별 차별화)
        this.createLightningParticles(this.chainCount + 1);
        
        // 🆕 체인 진행 과정 기록 (수정된 방식)
        this.chainHistory.push({
            from: { x: this.currentTarget.x, y: this.currentTarget.y }, // 🆕 수정: 현재 타겟 위치에서 시작
            to: { x: this.currentTarget.x, y: this.currentTarget.y },
            target: this.currentTarget,
            chainNumber: this.chainCount + 1,
            timestamp: game.gameTime || 0
        });
        
        this.hitEnemies.add(this.currentTarget);
        this.chainCount++;
        
        // 🆕 다음 타겟 찾기
        this.findNextTarget(game);
    }
    
    /**
     * 🆕 체인 세그먼트 추가 (수정된 방식)
     */
    addChainSegment() {
        // 🆕 체인 시작점 결정 (수정된 로직)
        let startX, startY;
        
        if (this.chainCount === 0) {
            // 🆕 첫 번째 체인: 플레이어 위치에서 시작
            startX = this.startPosition.x;
            startY = this.startPosition.y;
        } else {
            // 🆕 두 번째 체인 이후: 이전 타겟의 실제 위치에서 시작
            const previousChain = this.chainHistory[this.chainHistory.length - 1];
            startX = previousChain.from.x;
            startY = previousChain.from.y;
        }
        
        // 🆕 체인 세그먼트 생성 (개별 타이머 시스템)
        const segment = {
            startX: startX,
            startY: startY,
            endX: this.currentTarget.x,
            endY: this.currentTarget.y,
            lifetime: 1.5 + (this.chainCount * 0.8), // 🆕 체인별 확장된 차등 지속시간
            maxLifetime: 1.5 + (this.chainCount * 0.8),
            chainNumber: this.chainCount + 1,
            intensity: Math.pow(0.8, this.chainCount), // 체인마다 강도 감소
            startTime: this.gameTime || 0, // 🆕 개별 시작 시간
            fadeStartTime: 1.5 + (this.chainCount * 0.8) - 0.5 // 🆕 페이드 아웃 시작 시간
        };
        
        this.chainSegments.push(segment);
        console.log(`체인 세그먼트 추가: ${segment.chainNumber}차 체인 (${startX.toFixed(1)}, ${startY.toFixed(1)}) → (${this.currentTarget.x.toFixed(1)}, ${this.currentTarget.y.toFixed(1)})`);
        console.log(`  - 지속시간: ${segment.lifetime.toFixed(1)}초, 강도: ${segment.intensity.toFixed(2)}, 생성시점: ${this.chainCount * 0.2}초, 시작시간: ${segment.startTime.toFixed(1)}초`);
    }
    
    /**
     * 🆕 다음 타겟 찾기
     */
    findNextTarget(game) {
        let nextTarget = null;
        let closestDistance = Infinity;
        
        game.enemies.forEach(enemy => {
            if (enemy.health <= 0 || this.hitEnemies.has(enemy)) return;
            
            const distance = Math.sqrt(
                Math.pow(this.currentTarget.x - enemy.x, 2) + 
                Math.pow(this.currentTarget.y - enemy.y, 2)
            );
            
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                nextTarget = enemy;
            }
        });
        
        this.currentTarget = nextTarget;
        
        if (nextTarget) {
            console.log(`체인 라이트닝 다음 타겟: ${nextTarget.type} (${this.chainCount + 1}차 체인 예정)`);
        } else {
            console.log(`체인 라이트닝 완료: ${this.chainCount}개 적 연쇄 공격`);
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
            console.log(`체인 라이트닝으로 적 처치: ${enemy.type}, 경험치 획득: ${enemy.experience || 15}`);
        }
        
        // 🆕 아이템 드롭 체크
        if (game.itemSystem) {
            game.itemSystem.dropItemFromEnemy(enemy);
        }
    }
    
    /**
     * 🆕 번개 파티클 생성 (체인별 차별화)
     */
    createLightningParticles(chainNumber) {
        const particleCount = 10 + (chainNumber * 2); // 체인마다 파티클 수 증가
        const intensity = Math.pow(0.8, chainNumber - 1); // 체인마다 강도 감소
        
        for (let i = 0; i < particleCount; i++) {
            const progress = i / (particleCount - 1);
            const x = this.x + (this.currentTarget.x - this.x) * progress;
            const y = this.y + (this.currentTarget.y - this.y) * progress;
            
            const particle = {
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                lifetime: 0.2 + Math.random() * 0.3,
                maxLifetime: 0.5,
                size: (2 + Math.random() * 3) * intensity, // 체인별 크기 차별화
                color: this.getChainColor(chainNumber), // 체인별 색상 차별화
                chainNumber: chainNumber
            };
            
            this.lightningParticles.push(particle);
        }
    }
    
    /**
     * 🆕 체인별 색상 반환
     */
    getChainColor(chainNumber) {
        const colors = ['#00ffff', '#0088ff', '#0066ff', '#0044ff', '#0022ff'];
        return colors[Math.min(chainNumber - 1, colors.length - 1)];
    }
    
    /**
     * 🆕 체인별 강도 반환
     */
    getChainIntensity(chainNumber) {
        return Math.pow(0.8, chainNumber - 1); // 체인마다 20% 감소
    }
    
    /**
     * 🆕 투사체 렌더링
     */
    render(ctx) {
        // 🆕 체인 세그먼트 렌더링 (개별 타이머 + 페이드 아웃 시스템)
        this.chainSegments.forEach(segment => {
            const chainColor = this.getChainColor(segment.chainNumber);
            const chainIntensity = this.getChainIntensity(segment.chainNumber);
            
            // 🆕 개별 타이머 기반 알파값 계산
            const elapsedTime = (this.gameTime || 0) - segment.startTime;
            let alpha = 1.0;
            
            // 🆕 페이드 아웃 효과 (마지막 0.5초)
            if (elapsedTime >= segment.fadeStartTime) {
                const fadeProgress = (elapsedTime - segment.fadeStartTime) / 0.5;
                alpha = Math.max(0, 1.0 - fadeProgress);
            }
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = chainColor;
            ctx.lineWidth = 3 * chainIntensity; // 체인별 선 두께 차별화
            ctx.lineCap = 'round';
            
            // 🆕 번개 모양의 지그재그 선 그리기
            this.drawLightningLine(ctx, segment.startX, segment.startY, segment.endX, segment.endY);
            
            ctx.restore();
        });
        
        // 🆕 번개 파티클 렌더링
        this.lightningParticles.forEach(particle => {
            const alpha = particle.lifetime / particle.maxLifetime;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    /**
     * 🆕 번개 모양의 지그재그 선 그리기
     */
    drawLightningLine(ctx, startX, startY, endX, endY) {
        const segments = 8;
        const points = [{ x: startX, y: startY }];
        
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const baseX = startX + (endX - startX) * progress;
            const baseY = startY + (endY - startY) * progress;
            
            // 🆕 랜덤 오프셋으로 지그재그 효과
            const offset = 15;
            const x = baseX + (Math.random() - 0.5) * offset;
            const y = baseY + (Math.random() - 0.5) * offset;
            
            points.push({ x, y });
        }
        
        points.push({ x: endX, y: endY });
        
        // 🆕 지그재그 선 그리기
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
    }
    
    /**
     * 🆕 투사체 완료 여부 확인
     */
    isFinished() {
        return this.chainCount >= this.maxChains || !this.currentTarget;
    }
}
