/**
 * Survivor's Night - 디바이스 감지 시스템
 * 모바일, 태블릿, 데스크톱을 감지하여 적절한 UI를 제공합니다.
 */
class DeviceDetector {
    constructor() {
        this.deviceType = this.detectDevice();
        this.isInitialized = false;
        
        // 화면 크기 변경 감지
        this.setupResizeListener();
    }
    
    /**
     * 디바이스 타입 감지
     */
    detectDevice() {
        const hasTouch = 'ontouchstart' in window;
        const screenWidth = window.innerWidth;
        const userAgent = navigator.userAgent;
        
        // 모바일 감지
        if (hasTouch && screenWidth < 768) {
            return 'mobile';
        }
        
        // 태블릿 감지
        if (hasTouch && screenWidth >= 768 && screenWidth < 1024) {
            return 'tablet';
        }
        
        // 데스크톱 감지
        return 'desktop';
    }
    
    /**
     * 모바일 디바이스인지 확인
     */
    isMobile() {
        return this.deviceType === 'mobile';
    }
    
    /**
     * 태블릿 디바이스인지 확인
     */
    isTablet() {
        return this.deviceType === 'tablet';
    }
    
    /**
     * 데스크톱 디바이스인지 확인
     */
    isDesktop() {
        return this.deviceType === 'desktop';
    }
    
    /**
     * 터치 지원 디바이스인지 확인
     */
    hasTouch() {
        return this.isMobile() || this.isTablet();
    }
    
    /**
     * 화면 크기 변경 감지 설정
     */
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newDeviceType = this.detectDevice();
                if (newDeviceType !== this.deviceType) {
                    this.deviceType = newDeviceType;
                    this.onDeviceChange();
                }
            }, 250);
        });
    }
    
    /**
     * 디바이스 타입 변경 시 콜백
     */
    onDeviceChange() {
        console.log(`디바이스 타입 변경: ${this.deviceType}`);
        
        // 디바이스 변경 이벤트 발생
        const event = new CustomEvent('deviceTypeChanged', {
            detail: { deviceType: this.deviceType }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 현재 디바이스 정보 반환
     */
    getDeviceInfo() {
        return {
            type: this.deviceType,
            hasTouch: this.hasTouch(),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent
        };
    }
    
    /**
     * 디바이스별 최적화 설정
     */
    getOptimizationSettings() {
        const settings = {
            mobile: {
                targetFPS: 30,
                enableTouchEvents: true,
                enableKeyboardEvents: false,
                showVirtualControls: true,
                touchAction: 'none'
            },
            tablet: {
                targetFPS: 45,
                enableTouchEvents: true,
                enableKeyboardEvents: true,
                showVirtualControls: false,
                touchAction: 'manipulation'
            },
            desktop: {
                targetFPS: 60,
                enableTouchEvents: false,
                enableKeyboardEvents: true,
                showVirtualControls: false,
                touchAction: 'auto'
            }
        };
        
        return settings[this.deviceType];
    }
}

// 전역 인스턴스 생성
window.deviceDetector = new DeviceDetector();
