/**
 * インポート/エクスポートモジュール
 * CSV処理とデータの入出力
 */

import { ImportError } from './errorHandler.js';

export class ImportExport {
    constructor(appState, errorHandler) {
        this.appState = appState;
        this.errorHandler = errorHandler;
    }

    /**
     * CSVテンプレートのダウンロード
     */
    downloadTemplate() {
        try {
            const template = [
                ['貨物コード', '数量', '重量(kg)', '長さ(cm)', '幅(cm)', '高さ(cm)'],
                ['SAMPLE-A', '100', '5.5', '40.0', '30.0', '25.0'],
                ['SAMPLE-B', '50', '7.2', '45.0', '35.0', '20.0']
            ];
            
            const csvContent = this.arrayToCSV(template);
            this.downloadFile(csvContent, 'palletizer_template.csv', 'text/csv');
            
            this.appState.addNotification('テンプレートをダウンロードしました', 'success');
        } catch (error) {
            this.errorHandler.handleError(error, 'テンプレートダウンロード');
        }
    }

    /**
     * CSVインポート実行
     */
    async importCSV(file) {
        try {
            if (!file) {
                throw new ImportError('ファイルが選択されていません');
            }

            if (!file.name.toLowerCase().endsWith('.csv')) {
                throw new ImportError('CSVファイルを選択してください');
            }

            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);
            
            if (data.length === 0) {
                throw new ImportError('有効なデータが含まれていません');
            }

            // 既存データとマージするか確認
            let shouldMerge = false;
            if (this.appState.cartonData.length > 0) {
                shouldMerge = confirm('既存のデータに追加しますか？\n「キャンセル」を選択すると既存データを置き換えます。');
            }

            if (!shouldMerge) {
                this.appState.clearAllCartons();
            }

            // データを追加
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            data.forEach((item, index) => {
                try {
                    this.appState.addCarton(item);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`行${index + 2}: ${error.message}`);
                }
            });

            // 結果を通知
            if (successCount > 0) {
                this.appState.addNotification(
                    `${successCount}件のデータをインポートしました`,
                    'success'
                );
            }

            if (errorCount > 0) {
                const errorMessage = errors.slice(0, 3).join('\n');
                throw new ImportError(`${errorCount}件のエラー:\n${errorMessage}`);
            }

            return { success: successCount, errors: errorCount };

        } catch (error) {
            this.errorHandler.handleError(error, 'CSVインポート');
            throw error;
        }
    }

    /**
     * CSV解析
     */
    parseCSV(text) {
        // BOMを除去
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.substr(1);
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new ImportError('CSVファイルにデータが含まれていません');
        }

        const data = [];
        const headers = this.parseCSVLine(lines[0]);
        
        // ヘッダーの検証
        const requiredHeaders = 6;
        if (headers.length < requiredHeaders) {
            throw new ImportError(`CSVヘッダーが不正です（${requiredHeaders}列必要）`);
        }

        // データ行を解析
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = this.parseCSVLine(line);
            
            if (columns.length < requiredHeaders) {
                console.warn(`行${i + 1}: 列数不足（スキップ）`);
                continue;
            }

            const [code, qtyStr, weightStr, lStr, wStr, hStr] = columns;

            // データ検証と変換
            const item = {
                code: this.sanitizeString(code),
                qty: this.parsePositiveInt(qtyStr, '数量'),
                weight: this.parsePositiveFloat(weightStr, '重量'),
                l: this.parsePositiveFloat(lStr, '長さ'),
                w: this.parsePositiveFloat(wStr, '幅'),
                h: this.parsePositiveFloat(hStr, '高さ')
            };

            data.push(item);
        }

        return data;
    }

    /**
     * CSV行の解析
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    /**
     * 結果のエクスポート
     */
    exportResults() {
        try {
            const pallets = this.appState.results.currentPallets;
            
            if (!pallets || pallets.length === 0) {
                throw new Error('エクスポートするデータがありません');
            }

            const data = this.preparePalletExportData(pallets);
            const csvContent = this.arrayToCSV(data);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `palletization_result_${timestamp}.csv`;
            
            this.downloadFile(csvContent, filename, 'text/csv');
            
            this.appState.addNotification('結果をエクスポートしました', 'success');
        } catch (error) {
            this.errorHandler.handleError(error, '結果エクスポート');
        }
    }

    /**
     * パレットデータのエクスポート準備
     */
    preparePalletExportData(pallets) {
        const data = [];
        
        // ヘッダー情報
        data.push([`パレタイズ結果 (高さ制限: ${this.appState.palletConfig.maxHeightLimit}cm)`]);
        data.push([`作成日時: ${new Date().toLocaleString('ja-JP')}`]);
        data.push([]);
        
        // カラムヘッダー
        data.push([
            'パレットNo',
            'パレットタイプ',
            'サイズ(cm)',
            '高さ(cm)',
            '重量(kg)',
            'カートン数',
            '効率(%)',
            '高さ制限',
            '貨物コード',
            '数量詳細'
        ]);
        
        // パレットデータ
        pallets.forEach((pallet, index) => {
            const cartonCounts = {};
            pallet.cartons.forEach(carton => {
                cartonCounts[carton.code] = (cartonCounts[carton.code] || 0) + 1;
            });
            
            const codes = Object.keys(cartonCounts).join('; ');
            const quantities = Object.entries(cartonCounts)
                .map(([code, qty]) => `${code}:${qty}`)
                .join('; ');
            
            const heightOk = pallet.height <= this.appState.palletConfig.maxHeightLimit ? 'OK' : 'NG';
            const efficiency = pallet.efficiency || this.calculateEfficiency(pallet);
            
            data.push([
                index + 1,
                pallet.palletSize.name,
                `${pallet.palletSize.width}×${pallet.palletSize.depth}`,
                pallet.height.toFixed(1),
                pallet.totalWeight.toFixed(1),
                pallet.cartons.length,
                efficiency.toFixed(1),
                heightOk,
                codes,
                quantities
            ]);
        });
        
        // サマリー
        data.push([]);
        data.push(['サマリー']);
        data.push(['総パレット数', pallets.length]);
        data.push(['総カートン数', pallets.reduce((sum, p) => sum + p.cartons.length, 0)]);
        data.push(['総重量(kg)', pallets.reduce((sum, p) => sum + p.totalWeight, 0).toFixed(1)]);
        
        return data;
    }

    /**
     * 配列をCSVに変換
     */
    arrayToCSV(data) {
        return data.map(row => 
            row.map(cell => {
                const str = String(cell || '');
                // エスケープ処理
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ).join('\n');
    }

    /**
     * ファイルダウンロード
     */
    downloadFile(content, filename, mimeType) {
        // BOM付きUTF-8
        const bom = '\uFEFF';
        const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8;` });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * ファイル読み込み
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 文字列のサニタイズ
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') {
            throw new Error('コードが入力されていません');
        }
        
        // 危険な文字を除去
        const sanitized = str
            .trim()
            .replace(/[<>'"]/g, '')
            .slice(0, 50); // 長さ制限
        
        if (!sanitized) {
            throw new Error('有効なコードを入力してください');
        }
        
        return sanitized;
    }

    /**
     * 正の整数パース
     */
    parsePositiveInt(str, fieldName) {
        const num = parseInt(str);
        
        if (isNaN(num) || num <= 0) {
            throw new Error(`${fieldName}は正の整数である必要があります`);
        }
        
        if (num > 10000) {
            throw new Error(`${fieldName}が大きすぎます（最大: 10000）`);
        }
        
        return num;
    }

    /**
     * 正の小数パース
     */
    parsePositiveFloat(str, fieldName) {
        const num = parseFloat(str);
        
        if (isNaN(num) || num <= 0) {
            throw new Error(`${fieldName}は正の数値である必要があります`);
        }
        
        if (num > 1000) {
            throw new Error(`${fieldName}が大きすぎます（最大: 1000）`);
        }
        
        return num;
    }

    /**
     * 効率計算
     */
    calculateEfficiency(pallet) {
        const usedVolume = pallet.cartons.reduce((sum, c) => 
            sum + (c.l * c.w * c.h), 0
        );
        const palletVolume = pallet.palletSize.width * 
            pallet.palletSize.depth * 
            (pallet.height - 14);
        
        return (usedVolume / palletVolume) * 100;
    }

    /**
     * JSONエクスポート
     */
    exportJSON() {
        try {
            const data = this.appState.exportData();
            const json = JSON.stringify(data, null, 2);
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `palletizer_data_${timestamp}.json`;
            
            this.downloadFile(json, filename, 'application/json');
            
            this.appState.addNotification('データをエクスポートしました', 'success');
        } catch (error) {
            this.errorHandler.handleError(error, 'JSONエクスポート');
        }
    }

    /**
     * JSONインポート
     */
    async importJSON(file) {
        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);
            
            const result = this.appState.importData(data);
            
            if (result.success) {
                this.appState.addNotification('データをインポートしました', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'JSONインポート');
        }
    }
}