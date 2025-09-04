/**
 * Survivor's Night - 메인 JavaScript 파일
 * 게임의 진입점과 초기화를 담당합니다.
 */

// 게임 인스턴스
let game = null;

// 페이지 로드 완료 시 게임 시작
document.addEventListener('DOMContentLoaded', function() {
    console.log('Survivor\'s Night 게임 로딩 시작...');
    
    // 게임 초기화
    initGame();
    
    // 개발자 도구 (개발 중에만 사용)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setupDeveloperTools();
    }
});

/**
 * 게임 초기화
 */
function initGame() {
    try {
        // 게임 인스턴스 생성
        game = new Game();
        
        // 모바일 컨트롤 초기화
        if (window.deviceDetector && window.deviceDetector.isMobile()) {
            game.mobileControls = new MobileControls(game);
            console.log('모바일 터치 컨트롤이 활성화되었습니다.');
        }
        
        console.log('게임 초기화 완료!');
        console.log('게임 상태:', game.gameState);
        console.log('디바이스 타입:', window.deviceDetector ? window.deviceDetector.getDeviceInfo().type : 'unknown');
        
        // 디바이스별 조작법 안내
        if (window.deviceDetector && window.deviceDetector.isMobile()) {
            console.log('모바일 조작법:');
            console.log('- 좌하단 조이스틱: 이동');
            console.log('- 우하단 버튼들: 공격, 대시, 특수공격');
        } else {
            console.log('데스크톱 조작법:');
            console.log('- WASD 또는 방향키: 이동');
            console.log('- 스페이스바: 대시');
            console.log('- E: 파이어볼, R: 체인 라이트닝');
            console.log('- ESC: 일시정지/재개');
        }
        
        // 성공 메시지 표시
        showSuccessMessage('게임이 성공적으로 로드되었습니다!');
        
    } catch (error) {
        console.error('게임 초기화 실패:', error);
        showErrorMessage('게임 초기화에 실패했습니다: ' + error.message);
    }
}

/**
 * 성공 메시지 표시
 */
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #2ed573, #1e90ff);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        animation: slideInRight 0.5s ease-out;
        box-shadow: 0 4px 15px rgba(46, 213, 115, 0.3);
    `;
    
    // 애니메이션 스타일 추가
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #ff4757, #ff3742);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        animation: slideInRight 0.5s ease-out;
        box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

/**
 * 개발자 도구 설정 (개발 중에만 사용)
 */
function setupDeveloperTools() {
    console.log('개발자 도구 설정 중...');
    
    // 전역 함수로 게임 인스턴스 노출
    window.game = game;
    
    // 개발자 콘솔 명령어들
    window.dev = {
        // 게임 상태 확인
        status: () => {
            if (!game) return '게임이 초기화되지 않았습니다.';
            return {
                gameState: game.gameState,
                gameTime: game.gameTime,
                player: game.player ? game.player.getStatus() : null,
                enemies: game.enemies.length,
                items: game.items.length,
                particles: game.particles.length
            };
        },
        
        // 게임 재시작
        restart: () => {
            if (game) {
                game.restartGame();
                console.log('게임 재시작됨');
            }
        },
        
        // 플레이어 체력 설정
        setHealth: (health) => {
            if (game && game.player) {
                game.player.health = Math.max(0, Math.min(health, game.player.getMaxHealth()));
                console.log(`플레이어 체력을 ${health}로 설정`);
            }
        },
        
        // 플레이어 레벨 설정
        setLevel: (level) => {
            if (game && game.player) {
                game.player.level = Math.max(1, level);
                game.player.experience = 0;
                game.player.experienceToNext = game.player.getExperienceForLevel(level + 1);
                console.log(`플레이어 레벨을 ${level}로 설정`);
            }
        },
        
        // 적 스폰
        spawnEnemy: (type = 'zombie') => {
            if (game && game.player) {
                const enemy = new Enemy(game.player.x + 100, game.player.y + 100, type);
                enemy.game = game;
                game.addEnemy(enemy);
                console.log(`${type} 적을 스폰했습니다.`);
            }
        },
        
        // 아이템 스폰
        spawnItem: (type = null, rarity = 'common') => {
            if (game && game.itemSystem) {
                const player = game.player;
                if (player) {
                    const item = game.itemSystem.createItemAtPosition(player.x + 50, player.y + 50, type, rarity);
                    console.log(`${rarity} ${item.type} 아이템 생성: ${item.name}`);
                    return item;
                } else {
                    console.log('플레이어가 없습니다. 게임을 시작해주세요.');
                }
            } else {
                console.log('아이템 시스템이 초기화되지 않았습니다.');
            }
        },
        
        // 아이템 통계
        itemStats: () => {
            if (game && game.itemSystem) {
                return game.itemSystem.getStats();
            }
            return '아이템 시스템이 초기화되지 않았습니다.';
        },
        
        // 화면 흔들림 효과 테스트
        screenShake: (intensity = 5, duration = 0.5) => {
            if (game) {
                game.startScreenShake(intensity, duration);
                console.log(`화면 흔들림 효과 시작: 강도 ${intensity}, 지속시간 ${duration}초`);
            }
        },
        
        // 성능 통계
        performance: () => {
            if (game && game.gameLoop) {
                return game.gameLoop.getPerformanceStats();
            }
            return '게임 루프가 실행되지 않았습니다.';
        },
        
        // 충돌 감지 통계
        collisions: () => {
            if (game && game.collisionSystem) {
                return game.collisionSystem.getStats();
            }
            return '충돌 감지 시스템이 초기화되지 않았습니다.';
        },
        
        // 자동 공격 시스템 테스트
        testAutoAttack: () => {
            if (game && game.player) {
                const enemiesInRange = game.player.getEnemiesInRange();
                console.log(`공격 범위 내 적 수: ${enemiesInRange.length}`);
                
                if (enemiesInRange.length > 0) {
                    const closest = game.player.getClosestEnemy(enemiesInRange);
                    console.log('가장 가까운 적:', closest);
                    
                    // 강제 공격 실행
                    game.player.attackEnemy(closest);
                    console.log('강제 공격 실행됨');
                } else {
                    console.log('공격 범위 내 적이 없습니다.');
                }
            }
        },
        
        // 공격 범위 표시 토글
        toggleAttackRange: () => {
            if (game && game.player) {
                game.player.showAttackRange = !game.player.showAttackRange;
                console.log(`공격 범위 표시: ${game.player.showAttackRange ? 'ON' : 'OFF'}`);
            }
        },
        
        // 적 상태 확인
        enemyStatus: () => {
            if (game && game.enemies) {
                console.log(`현재 적 수: ${game.enemies.length}`);
                game.enemies.forEach((enemy, index) => {
                    console.log(`적 ${index}: ${enemy.type}, 체력: ${enemy.health}/${enemy.maxHealth}, 위치: (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)})`);
                });
            }
        },
        
        // 스폰 통계
        spawns: () => {
            if (game && game.spawnSystem) {
                return game.spawnSystem.getStats();
            }
            return '스폰 시스템이 초기화되지 않았습니다.';
        },
        
        // 게임 일시정지
        pause: () => {
            if (game) {
                game.pauseGame();
                console.log('게임 일시정지됨');
            }
        },
        
        // 게임 재개
        resume: () => {
            if (game) {
                game.resumeGame();
                console.log('게임 재개됨');
            }
        },
        
        // 게임오버
        gameOver: () => {
            if (game) {
                game.gameOver();
                console.log('게임오버됨');
            }
        },
        
        // 🆕 마법사 공격 시스템 테스트
        testMagicArrow: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            console.log('🧙‍♂️ 매직 에로우 테스트 시작...');
            game.player.fireMagicArrow();
        },
        
        testFireball: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            console.log('🔥 파이어볼 테스트 시작...');
            game.player.fireFireball();
        },
        
        testChainLightning: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            console.log('⚡ 체인 라이트닝 테스트 시작...');
            game.player.castChainLightning();
        },
        
        // 🆕 파이어볼 자동 발사 테스트
        testAutoFireball: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            console.log('🔥 파이어볼 자동 발사 테스트 시작...');
            game.player.handleAutoFireball();
        },
        
        magicStats: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            const magic = game.player.magicSystem;
            console.log('🧙‍♂️ 마법 능력치:');
            console.log(`매직 에로우: 화살 ${magic.magicArrow.arrowCount}개, 쿨다운 ${magic.magicArrow.cooldown.toFixed(1)}초`);
            console.log(`파이어볼: 쿨다운 ${magic.fireball.cooldown.toFixed(1)}초`);
            console.log(`체인 라이트닝: 최대 체인 ${magic.chainLightning.maxChains}개, 쿨다운 ${magic.chainLightning.cooldown.toFixed(1)}초`);
            console.log(`마나: ${game.player.mana}/${game.player.maxMana}`);
        },
        
        resetMagicCooldowns: () => {
            if (!game || !game.player) {
                console.log('게임이 실행 중이 아닙니다.');
                return;
            }
            
            Object.values(game.player.magicSystem).forEach(magic => {
                magic.cooldown = 0;
            });
            
            console.log('🧙‍♂️ 모든 마법 쿨다운이 리셋되었습니다!');
        },
        
        // 도움말
        help: () => {
            console.log('사용 가능한 개발자 명령어:');
            console.log('dev.status() - 게임 상태 확인');
            console.log('dev.restart() - 게임 재시작');
            console.log('dev.setHealth(health) - 플레이어 체력 설정');
            console.log('dev.setLevel(level) - 플레이어 레벨 설정');
            console.log('dev.spawnEnemy(type) - 적 스폰');
            console.log('dev.spawnItem(type, rarity) - 아이템 스폰 (type: attackDamage, attackSpeed, attackRange, movementSpeed, maxHealth, healthRegen)');
            console.log('dev.itemStats() - 아이템 통계');
            console.log('dev.screenShake(intensity, duration) - 화면 흔들림 효과 테스트');
            console.log('dev.performance() - 성능 통계');
            console.log('dev.collisions() - 충돌 감지 통계');
            console.log('dev.testAutoAttack() - 자동 공격 시스템 테스트');
            console.log('dev.toggleAttackRange() - 공격 범위 표시 토글');
            console.log('dev.enemyStatus() - 적 상태 확인');
            console.log('dev.spawns() - 스폰 통계');
            console.log('dev.pause() - 게임 일시정지');
            console.log('dev.resume() - 게임 재개');
            console.log('dev.gameOver() - 게임오버');
            console.log('dev.help() - 도움말');
            console.log('🧙‍♂️ 🆕 마법사 공격 시스템 명령어:');
            console.log('dev.testMagicArrow() - 매직 에로우 테스트');
            console.log('dev.testFireball() - 파이어볼 테스트');
            console.log('dev.testChainLightning() - 체인 라이트닝 테스트');
            console.log('dev.testAutoFireball() - 파이어볼 자동 발사 테스트');
            console.log('dev.magicStats() - 마법 능력치 확인');
            console.log('dev.resetMagicCooldowns() - 마법 쿨다운 리셋');
        }
    };
    
    // 개발자 도구 로드 완료 메시지
    console.log('개발자 도구 설정 완료!');
    console.log('콘솔에서 dev.help()를 입력하여 사용법을 확인하세요.');
    console.log('게임 인스턴스는 window.game으로 접근할 수 있습니다.');
    
    // 개발자 도구 사용법 표시
    setTimeout(() => {
        console.log('%c🎮 개발자 도구가 활성화되었습니다!', 'color: #4a90e2; font-size: 16px; font-weight: bold;');
        console.log('%c콘솔에서 dev.help()를 입력하여 사용법을 확인하세요.', 'color: #2ed573; font-size: 14px;');
    }, 1000);
}

/**
 * 게임 성능 모니터링 (선택사항)
 */
function setupPerformanceMonitoring() {
    if (!game || !game.gameLoop) return;
    
    // 성능 모니터링 간격 (5초마다)
    setInterval(() => {
        const stats = game.gameLoop.getPerformanceStats();
        
        // FPS가 낮을 때 경고
        if (stats.fps < 50) {
            console.warn(`성능 저하 감지: FPS ${stats.fps}`);
        }
        
        // 평균 프레임 타임이 높을 때 경고
        if (stats.avgFrameTime > 0.02) {
            console.warn(`프레임 지연 감지: ${(stats.avgFrameTime * 1000).toFixed(2)}ms`);
        }
    }, 5000);
}

/**
 * 에러 핸들링
 */
window.addEventListener('error', function(event) {
    console.error('게임 에러 발생:', event.error);
    showErrorMessage('게임 에러가 발생했습니다: ' + event.error.message);
});

/**
 * 페이지 언로드 시 정리
 */
window.addEventListener('beforeunload', function() {
    if (game && game.gameLoop) {
        game.gameLoop.stop();
    }
});

/**
 * 게임 로딩 완료 확인
 */
function isGameLoaded() {
    return game !== null && game.gameState !== undefined;
}

/**
 * 게임 상태 확인
 */
function getGameState() {
    if (!game) return '게임이 초기화되지 않았습니다.';
    return game.gameState;
}

/**
 * 게임 통계 반환
 */
function getGameStats() {
    if (!game) return null;
    
    return {
        gameState: game.gameState,
        gameTime: game.gameTime,
        playerLevel: game.player ? game.player.level : 0,
        enemiesKilled: game.player ? game.player.enemiesKilled : 0,
        currentEnemies: game.enemies.length,
        currentItems: game.items.length,
        performance: game.gameLoop ? game.gameLoop.getPerformanceStats() : null
    };
}

// 전역 함수로 노출
window.isGameLoaded = isGameLoaded;
window.getGameState = getGameState;
window.getGameStats = getGameStats;
