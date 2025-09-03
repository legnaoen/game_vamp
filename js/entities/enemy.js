/**
 * Survivor's Night - 적 클래스
 * 적 캐릭터의 상태와 AI를 관리합니다.
 */
class Enemy {
    constructor(x, y, type = 'zombie') {
        // 위치
        this.x = x;
        this.y = y;
        
        // 적 타입
        this.type = type;
        
        // 타입별 속성 설정
        this.setupTypeProperties();
        
        // AI 상태
        this.state = 'chase'; // 'chase', 'attack', 'stunned'
        this.target = null;
        this.lastAttackTime = 0;
        this.stunnedTime = 0;
        
        // 애니메이션
        this.animationTime = 0;
        this.flashTime = 0;
        this.isFlashing = false;
    }
    
    /**
     * 타입별 속성 설정
     */
    setupTypeProperties() {
        switch (this.type) {
            case 'zombie':
                this.radius = 12;
                this.speed = 60;
                this.health = 30;
                this.maxHealth = 30;
                this.damage = 15;
                this.experience = 20;
                this.color = '#8B4513';
                this.strokeColor = '#654321';
                break;
                
            case 'ghost':
                this.radius = 10;
                this.speed = 80;
                this.health = 20;
                this.maxHealth = 20;
                this.damage = 10;
                this.experience = 15;
                this.color = '#708090';
                this.strokeColor = '#4A4A4A';
                break;
                
            case 'vampire':
                this.radius = 14;
                this.speed = 70;
                this.health = 40;
                this.maxHealth = 40;
                this.damage = 20;
                this.experience = 25;
                this.color = '#800000';
                this.strokeColor = '#4B0000';
                break;
                
            case 'boss':
                this.radius = 20;
                this.speed = 50;
                this.health = 100;
                this.maxHealth = 100;
                this.damage = 30;
                this.experience = 100;
                this.color = '#FF4500';
                this.strokeColor = '#CC3700';
                break;
                
            default:
                this.radius = 12;
                this.speed = 60;
                this.health = 30;
                this.maxHealth = 30;
                this.damage = 15;
                this.experience = 20;
                this.color = '#8B4513';
                this.strokeColor = '#654321';
        }
    }
    
    /**
     * 적 업데이트
     */
    update(deltaTime, player) {
        if (!player) return;
        
        // 애니메이션 시간 업데이트
        this.animationTime += deltaTime;
        
        // 스턴 상태 처리
        if (this.state === 'stunned') {
            this.stunnedTime -= deltaTime;
            if (this.stunnedTime <= 0) {
                this.state = 'chase';
            }
            return;
        }
        
        // 타겟 설정
        this.target = player;
        
        // AI 상태에 따른 동작
        switch (this.state) {
            case 'chase':
                this.chasePlayer(deltaTime, player);
                break;
            case 'attack':
                this.attackPlayer(deltaTime, player);
                break;
        }
        
        // 깜빡임 효과 업데이트
        if (this.isFlashing) {
            this.flashTime -= deltaTime;
            if (this.flashTime <= 0) {
                this.isFlashing = false;
            }
        }
    }
    
    /**
     * 플레이어 추적
     */
    chasePlayer(deltaTime, player) {
        // 플레이어까지의 거리 계산
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 공격 범위 내에 있으면 공격 상태로 전환
        if (distance <= this.radius + player.radius) {
            this.state = 'attack';
            return;
        }
        
        // 플레이어 방향으로 이동
        if (distance > 0) {
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            // 속도 계산
            const moveSpeed = this.speed * deltaTime;
            
            // 위치 업데이트
            this.x += directionX * moveSpeed;
            this.y += directionY * moveSpeed;
        }
    }
    
    /**
     * 플레이어 공격
     */
    attackPlayer(deltaTime, player) {
        const currentTime = this.animationTime;
        const attackInterval = 1.0; // 1초마다 공격
        
        if (currentTime - this.lastAttackTime >= attackInterval) {
            this.lastAttackTime = currentTime;
            
            // 플레이어에게 데미지
            player.takeDamage(this.damage);
            
            // 공격 효과 (파티클 등)
            this.createAttackParticles();
            
            // 공격 후 잠시 스턴
            this.state = 'stunned';
            this.stunnedTime = 0.5;
        }
    }
    
    /**
     * 데미지 받기
     */
    takeDamage(damage) {
        this.health -= damage;
        
        // 데미지 받음 효과
        this.isFlashing = true;
        this.flashTime = 0.1;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    /**
     * 적 사망
     */
    die() {
        // 사망 효과 (파티클 등)
        this.createDeathParticles();
        
        // 체력을 0으로 설정 (Game.update에서 자동으로 제거됨)
        this.health = 0;
        
        console.log(`적 사망: ${this.type}, 체력: ${this.health}`);
    }
    
    /**
     * 공격 파티클 생성
     */
    createAttackParticles() {
        // 게임 클래스에서 파티클 생성 요청
        // this.game.createEnemyAttackParticles(this.x, this.y, this.type);
    }
    
    /**
     * 사망 파티클 생성
     */
    createDeathParticles() {
        // 게임 클래스에서 파티클 생성 요청
        // this.game.createEnemyDeathParticles(this.x, this.y, this.type);
    }
    
    /**
     * 적 렌더링
     */
    render(ctx) {
        ctx.save();
        
        // 깜빡임 효과
        if (this.isFlashing) {
            ctx.globalAlpha = 0.5;
        }
        
        // 적 몸체 그리기
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // 타입별 색상 적용
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 타입별 특수 효과
        this.renderTypeEffects(ctx);
        
        // 체력바 (보스 타입만)
        if (this.type === 'boss') {
            this.renderHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 타입별 특수 효과 렌더링
     */
    renderTypeEffects(ctx) {
        switch (this.type) {
            case 'ghost':
                // 유령은 반투명하고 흔들림 효과
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(112, 128, 144, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
                
            case 'vampire':
                // 뱀파이어는 빨간 눈 효과
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(this.x - 4, this.y - 2, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 4, this.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'boss':
                // 보스는 크고 위협적인 외관
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }
    }
    
    /**
     * 체력바 렌더링 (보스용)
     */
    renderHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
        
        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 체력
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // 테두리
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    /**
     * 적 상태 정보 반환
     */
    getStatus() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            health: this.health,
            maxHealth: this.maxHealth,
            state: this.state,
            stunnedTime: this.stunnedTime,
            isFlashing: this.isFlashing
        };
    }
    
    /**
     * 적 리셋
     */
    reset() {
        this.health = this.maxHealth;
        this.state = 'chase';
        this.target = null;
        this.lastAttackTime = 0;
        this.stunnedTime = 0;
        this.animationTime = 0;
        this.flashTime = 0;
        this.isFlashing = false;
    }
    
    /**
     * 적 복제 (객체 풀링용)
     */
    clone() {
        const enemy = new Enemy(this.x, this.y, this.type);
        return enemy;
    }
}
