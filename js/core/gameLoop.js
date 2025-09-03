/**
 * Survivor's Night - 게임 루프 클래스
 * 게임의 메인 루프를 관리하고 60FPS를 유지합니다.
 */
class GameLoop {
    constructor(game) {
        this.game = game;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        
        // 성능 모니터링
        this.frameTimes = [];
        this.avgFrameTime = 0;
    }
    
    /**
     * 게임 루프 시작
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // requestAnimationFrame으로 게임 루프 시작
        this.gameLoop();
        
        console.log('게임 루프 시작');
    }
    
    /**
     * 게임 루프 정지
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('게임 루프 정지');
    }
    
    /**
     * 메인 게임 루프
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 다음 프레임 예약
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        
        // 델타 타임 계산 (초 단위)
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // FPS 제한 (60FPS)
        if (deltaTime < 1 / 60) {
            return;
        }
        
        // 성능 모니터링
        this.updatePerformanceMetrics(deltaTime);
        
        // 게임 업데이트
        this.game.update(deltaTime);
        
        // 게임 렌더링
        this.game.render();
        
        // FPS 계산 (1초마다)
        this.frameCount++;
        this.fpsUpdateTime += deltaTime;
        
        if (this.fpsUpdateTime >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
            
            // FPS 디버그 정보 (개발 중에만)
            if (this.fps < 55) {
                console.warn(`FPS 저하 감지: ${this.fps}`);
            }
        }
    }
    
    /**
     * 성능 메트릭 업데이트
     */
    updatePerformanceMetrics(deltaTime) {
        // 프레임 타임 기록 (최근 60프레임)
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // 평균 프레임 타임 계산
        this.avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        
        // 성능 경고 (평균 프레임 타임이 16.67ms를 초과하면 60FPS 미만)
        if (this.avgFrameTime > 0.0167) {
            // 성능 최적화 필요 시 경고 (개발 중에만)
            // console.warn(`성능 저하: 평균 프레임 타임 ${(this.avgFrameTime * 1000).toFixed(2)}ms`);
        }
    }
    
    /**
     * 현재 FPS 반환
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * 평균 프레임 타임 반환 (초)
     */
    getAverageFrameTime() {
        return this.avgFrameTime;
    }
    
    /**
     * 성능 통계 반환
     */
    getPerformanceStats() {
        return {
            fps: this.fps,
            avgFrameTime: this.avgFrameTime,
            frameCount: this.frameCount,
            isRunning: this.isRunning
        };
    }
}
