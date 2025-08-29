/**
 * エラーハンドリングモジュール
 * 統一的なエラー処理とユーザーフレンドリーなエラー表示
 */

export class ErrorHandler {
    constructor(appState) {
        this.appState = appState;
        this.setupGlobalErrorHandlers();
    }

    // グローバルエラーハンドラーの設定
    setupGlobalErrorHandlers() {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'システムエラー');
            event.preventDefault();
        });

        // 未処理のPromiseリジェクションをキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, '非同期処理エラー');
            event.preventDefault();
        });
    }

    // エラー処理のメインメソッド
    handleError(error, context = '') {
        let userMessage = '';
        let technicalDetails = '';
        let severity = 'error'; // 'info', 'warning', 'error'

        // エラーの種類に応じた処理
        if (error instanceof ValidationError) {
            userMessage = error.message;
            severity = 'warning';
        } else if (error instanceof CalculationError) {
            userMessage = `計算エラー: ${error.message}`;
            severity = 'error';
        } else if (error instanceof ImportError) {
            userMessage = `インポートエラー: ${error.message}`;
            severity = 'warning';
        } else if (error instanceof Error) {
            userMessage = this.getUserFriendlyMessage(error.message);
            technicalDetails = error.stack;
        } else if (typeof error === 'string') {
            userMessage = error;
        } else {
            userMessage = '予期しないエラーが発生しました';
            technicalDetails = JSON.stringify(error);
        }

        // コンテキストを追加
        if (context) {
            userMessage = `${context}: ${userMessage}`;
        }

        // エラーログ
        this.logError(error, context, technicalDetails);

        // UIに表示
        this.displayError(userMessage, severity);

        // 状態に記録
        this.appState.addError({
            message: userMessage,
            severity,
            context,
            timestamp: new Date(),
            technical: technicalDetails
        });

        return {
            handled: true,
            userMessage,
            severity
        };
    }

    // ユーザーフレンドリーなメッセージに変換
    getUserFriendlyMessage(technicalMessage) {
        const messageMap = {
            'Network error': 'ネットワークエラーが発生しました。接続を確認してください。',
            'Invalid input': '入力値が正しくありません。確認してください。',
            'Calculation failed': '計算処理に失敗しました。データを確認してください。',
            'Memory limit exceeded': 'メモリ不足です。データ量を減らしてください。',
            'Invalid carton index': '指定された貨物が見つかりません。',
            'No pallets available': '利用可能なパレットがありません。',
            'Height limit exceeded': '高さ制限を超えています。設定を確認してください。'
        };

        // マッピングから探す
        for (const [key, value] of Object.entries(messageMap)) {
            if (technicalMessage.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        // デフォルトメッセージ
        return '処理中にエラーが発生しました。もう一度お試しください。';
    }

    // エラーをUIに表示
    displayError(message, severity = 'error') {
        // 既存のエラー表示をクリア
        const existingAlerts = document.querySelectorAll('.error-alert');
        existingAlerts.forEach(alert => {
            if (alert.dataset.autoRemove === 'true') {
                alert.remove();
            }
        });

        // 新しいエラー表示を作成
        const errorContainer = document.getElementById('errors') || this.createErrorContainer();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${severity} error-alert`;
        alertDiv.dataset.autoRemove = 'true';
        
        const icon = this.getIconForSeverity(severity);
        const closeButton = '<button class="close-alert" onclick="this.parentElement.remove()">×</button>';
        
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${icon}</span>
                <span class="alert-message">${this.escapeHtml(message)}</span>
                ${closeButton}
            </div>
        `;
        
        errorContainer.appendChild(alertDiv);

        // 自動削除（エラー以外）
        if (severity !== 'error') {
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.style.opacity = '0';
                    setTimeout(() => alertDiv.remove(), 300);
                }
            }, 5000);
        }
    }

    // エラーコンテナを作成
    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'errors';
        container.className = 'error-container';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    // 重要度に応じたアイコンを取得
    getIconForSeverity(severity) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        return icons[severity] || icons.info;
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // エラーログ
    logError(error, context, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || error,
            stack: error?.stack,
            details,
            userAgent: navigator.userAgent
        };

        // コンソールに出力
        console.error('Error Log:', logEntry);

        // ローカルストレージに保存（最新10件）
        try {
            const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            logs.unshift(logEntry);
            if (logs.length > 10) {
                logs.length = 10;
            }
            localStorage.setItem('errorLogs', JSON.stringify(logs));
        } catch (e) {
            console.error('Failed to save error log:', e);
        }
    }

    // エラーログを取得
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('errorLogs') || '[]');
        } catch (e) {
            return [];
        }
    }

    // エラーログをクリア
    clearErrorLogs() {
        localStorage.removeItem('errorLogs');
    }

    // try-catchラッパー
    async wrapAsync(fn, context = '') {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error, context);
            throw error;
        }
    }

    // 同期関数用のtry-catchラッパー
    wrap(fn, context = '') {
        try {
            return fn();
        } catch (error) {
            this.handleError(error, context);
            throw error;
        }
    }
}

// カスタムエラークラス
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class CalculationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CalculationError';
    }
}

export class ImportError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ImportError';
    }
}