# Palletizar - パレタイズ最適化計算機

高度なパレタイズ最適化を行う3D bin packingアプリケーション

## 🏗️ アーキテクチャ

### モジュラー構造

アプリケーションは以下のES6モジュールに分割されています：

```
js/
├── main.js          # メインアプリケーション初期化
├── data.js          # データ管理とストレージ
├── ui.js            # ユーザーインターフェース
├── algorithms.js    # パレタイズ計算アルゴリズム
├── visualization.js # キャンバス描画と可視化
└── utils.js         # ユーティリティ関数
```

### モジュール詳細

#### 📊 data.js
- カートンデータの管理
- パレット設定の管理
- CSV インポート/エクスポート
- ローカルストレージ機能
- データバリデーション

#### 🎨 ui.js
- DOM操作
- イベントハンドリング
- フォーム管理
- 結果表示
- ユーザーインタラクション

#### 🧮 algorithms.js
- 3D bin packing アルゴリズム
- 高さ制限対応計算
- 混載最適化
- スコアリングシステム
- 配置効率計算

#### 📈 visualization.js
- キャンバス描画
- パレット図表示
- 層別表示
- 側面図表示
- カラーマッピング

#### 🔧 utils.js
- ヘルパー関数
- ファイル操作
- エラーハンドリング
- 数学的計算
- データ変換

#### 🚀 main.js
- アプリケーション初期化
- モジュール統合
- エラーハンドリング
- パフォーマンス監視
- ヘルスチェック

## 💻 技術要件

### 対応ブラウザ
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

### 必要機能
- ES6 Modules サポート
- Canvas API
- File API
- Local Storage

## 🛠️ 開発情報

### ファイル構成
```
palletizar/
├── index.html              # メインHTML
├── styles.css              # スタイルシート
├── script.js.backup        # 元のモノリシックJS（バックアップ）
├── js/                     # モジュラーJavaScript
│   ├── main.js
│   ├── data.js
│   ├── ui.js
│   ├── algorithms.js
│   ├── visualization.js
│   └── utils.js
└── README.md              # このファイル
```

### 互換性

ES6モジュールをサポートしていない古いブラウザの場合：
```bash
# バックアップファイルを復元
mv script.js.backup script.js
```

そして index.html の script タグを以下に変更：
```html
<script src="script.js"></script>
```

## 🔄 マイグレーション

### 元のモノリシック構造からの変更点

1. **関数の分散**: 2300行の単一ファイルから6つのモジュールに分割
2. **名前空間の整理**: モジュール境界での責任分離
3. **依存関係の明確化**: import/export による明示的な依存関係
4. **エラーハンドリングの強化**: try-catch とエラー境界の追加
5. **パフォーマンス監視**: 計算時間の測定機能
6. **自動保存機能**: ローカルストレージへの定期保存

### 破壊的変更
- グローバル変数の削減
- 一部の内部関数のスコープ変更
- 初期化フローの変更

### 後方互換性
- HTMLから直接呼び出される関数は window オブジェクトに保持
- 既存のデータ構造は保持
- UI の動作は同一

## 🚀 パフォーマンス改善

### モジュール化の利点
- **コードの分離**: 関心の分離による可読性向上
- **メンテナンス性**: 機能別の修正が容易
- **テスト性**: 単体テストの実装が可能
- **キャッシュ効率**: ブラウザによるモジュール別キャッシュ
- **並列読み込み**: モジュールの並列ダウンロード

### 今後の改善予定
- Web Workers による重い計算の並列処理
- Service Worker によるオフライン対応
- IndexedDB による大容量データストレージ
- WebAssembly による計算高速化

## 🧪 デバッグ機能

ブラウザコンソールで利用可能なデバッグ機能：

```javascript
// アプリケーション健全性チェック
palletizerDebug.healthCheck()

// データの手動保存
palletizerDebug.saveToLocalStorage()

// データの手動読み込み
palletizerDebug.loadFromLocalStorage()

// アプリケーションの再初期化
palletizerDebug.reinitialize()
```

## 📝 ライセンス

このプロジェクトは元の Palletizar アプリケーションのモジュラー化版です。