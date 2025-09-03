/**
 * Survivor's Night - 충돌 감지 시스템
 * 게임 객체 간의 충돌을 감지하고 처리합니다.
 */
class CollisionSystem {
    constructor() {
        // 충돌 감지 최적화를 위한 공간 분할
        this.gridSize = 100; // 그리드 크기
        this.spatialGrid = new Map();
        
        // 충돌 감지 통계
        this.collisionChecks = 0;
        this.collisionsDetected = 0;
    }
    
    /**
     * 두 객체 간의 충돌 감지
     */
    checkCollision(obj1, obj2) {
        this.collisionChecks++;
        
        // 원형 충돌 박스 사용
        if (this.checkCircleCollision(obj1, obj2)) {
            this.collisionsDetected++;
            return true;
        }
        
        return false;
    }
    
    /**
     * 원형 충돌 박스 충돌 감지
     */
    checkCircleCollision(obj1, obj2) {
        // 두 객체의 중심점 간 거리 계산
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 두 객체의 반지름 합
        const radiusSum = obj1.radius + obj2.radius;
        
        // 거리가 반지름 합보다 작으면 충돌
        return distance <= radiusSum;
    }
    
    /**
     * 사각형 충돌 박스 충돌 감지 (필요시 사용)
     */
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 공간 분할을 위한 그리드 인덱스 계산
     */
    getGridIndex(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        return `${gridX},${gridY}`;
    }
    
    /**
     * 객체를 공간 그리드에 추가
     */
    addToGrid(obj) {
        const gridIndex = this.getGridIndex(obj.x, obj.y);
        
        if (!this.spatialGrid.has(gridIndex)) {
            this.spatialGrid.set(gridIndex, []);
        }
        
        this.spatialGrid.get(gridIndex).push(obj);
    }
    
    /**
     * 객체를 공간 그리드에서 제거
     */
    removeFromGrid(obj) {
        const gridIndex = this.getGridIndex(obj.x, obj.y);
        
        if (this.spatialGrid.has(gridIndex)) {
            const grid = this.spatialGrid.get(gridIndex);
            const index = grid.indexOf(obj);
            
            if (index > -1) {
                grid.splice(index, 1);
            }
        }
    }
    
    /**
     * 특정 영역 내의 객체들 찾기
     */
    getObjectsInArea(x, y, radius) {
        const objects = [];
        const minGridX = Math.floor((x - radius) / this.gridSize);
        const maxGridX = Math.floor((x + radius) / this.gridSize);
        const minGridY = Math.floor((y - radius) / this.gridSize);
        const maxGridY = Math.floor((y + radius) / this.gridSize);
        
        for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
            for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
                const gridIndex = `${gridX},${gridY}`;
                
                if (this.spatialGrid.has(gridIndex)) {
                    const grid = this.spatialGrid.get(gridIndex);
                    objects.push(...grid);
                }
            }
        }
        
        return objects;
    }
    
    /**
     * 플레이어 공격 범위 내의 적들 찾기
     */
    getEnemiesInAttackRange(player, enemies) {
        const inRangeEnemies = [];
        const attackRange = player.getCurrentAttackRange();
        
        enemies.forEach(enemy => {
            if (this.checkCollision(player, enemy)) {
                // 플레이어와 적이 겹쳐있을 때는 제외
                return;
            }
            
            // 공격 범위 내에 있는지 확인
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= attackRange) {
                inRangeEnemies.push(enemy);
            }
        });
        
        return inRangeEnemies;
    }
    
    /**
     * 가장 가까운 적 찾기
     */
    getNearestEnemy(player, enemies) {
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        return nearestEnemy;
    }
    
    /**
     * 화면 밖으로 나간 객체 확인
     */
    isObjectOutOfBounds(obj, canvasWidth, canvasHeight, margin = 50) {
        return obj.x < -margin || 
               obj.x > canvasWidth + margin ||
               obj.y < -margin || 
               obj.y > canvasHeight + margin;
    }
    
    /**
     * 화면 경계와의 충돌 확인
     */
    checkBoundaryCollision(obj, canvasWidth, canvasHeight) {
        const collisions = {
            left: false,
            right: false,
            top: false,
            bottom: false
        };
        
        if (obj.x - obj.radius <= 0) {
            collisions.left = true;
            obj.x = obj.radius;
        }
        
        if (obj.x + obj.radius >= canvasWidth) {
            collisions.right = true;
            obj.x = canvasWidth - obj.radius;
        }
        
        if (obj.y - obj.radius <= 0) {
            collisions.top = true;
            obj.y = obj.radius;
        }
        
        if (obj.y + obj.radius >= canvasHeight) {
            collisions.bottom = true;
            obj.y = canvasHeight - obj.radius;
        }
        
        return collisions;
    }
    
    /**
     * 충돌 감지 통계 반환
     */
    getStats() {
        return {
            collisionChecks: this.collisionChecks,
            collisionsDetected: this.collisionsDetected,
            efficiency: this.collisionChecks > 0 ? 
                (this.collisionsDetected / this.collisionChecks * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * 충돌 감지 통계 리셋
     */
    resetStats() {
        this.collisionChecks = 0;
        this.collisionsDetected = 0;
    }
    
    /**
     * 공간 그리드 리셋
     */
    resetGrid() {
        this.spatialGrid.clear();
    }
    
    /**
     * 디버그 정보 렌더링 (개발 중에만 사용)
     */
    renderDebugInfo(ctx, player, enemies) {
        if (!player) return;
        
        ctx.save();
        
        // 플레이어 공격 범위 표시
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.getCurrentAttackRange(), 0, Math.PI * 2);
        ctx.stroke();
        
        // 충돌 감지 통계
        const stats = this.getStats();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`충돌 감지: ${stats.collisionChecks}`, 10, 20);
        ctx.fillText(`충돌 발생: ${stats.collisionsDetected}`, 10, 35);
        ctx.fillText(`효율성: ${stats.efficiency}`, 10, 50);
        
        ctx.restore();
    }
}
