# 倉庫スペース計算機 - モジュール構成

このプロジェクトは、元の大きな `script.js` ファイルを機能別に分離したモジュール構成にリファクタリングしました。

## モジュール構成

### 1. `input.js` - 入力管理モジュール
- **責任**: パレット管理、フォーム処理、入力検証
- **主要機能**:
  - パレットの追加・編集・削除
  - 倉庫設定の管理
  - フォーム入力の検証
  - イベントリスナーの設定

### 2. `layout.js` - レイアウト管理モジュール
- **責任**: キャンバス描画、レイアウト生成、視覚的表示
- **主要機能**:
  - 2Dレイアウトの描画
  - キャンバス操作
  - レジェンドの生成
  - レイアウトタブの更新

### 3. `summary.js` - サマリー管理モジュール
- **責任**: サマリータブの更新、詳細パレット情報の表示
- **主要機能**:
  - 計算結果のサマリー表示
  - パレット詳細情報の表示
  - 倉庫情報の表示
  - 設定情報の表示

### 4. `layout-generator.js` - レイアウト生成モジュール
- **責任**: パッキングアルゴリズム、レイアウト計算ロジック
- **主要機能**:
  - 統合計算・個別計算
  - パッキングアルゴリズム
  - 効率計算
  - レイアウト生成ロジック

### 5. `main.js` - メイン計算機クラス
- **責任**: 全モジュールの調整、メイン計算機機能の維持
- **主要機能**:
  - モジュール間の連携
  - タブ切り替え
  - メッセージ表示
  - 全体の状態管理

## ファイル読み込み順序

HTMLファイルでは以下の順序でモジュールを読み込みます：

```html
<script src="input.js"></script>
<script src="layout.js"></script>
<script src="summary.js"></script>
<script src="layout-generator.js"></script>
<script src="main.js"></script>
```

## 利点

1. **保守性の向上**: 各モジュールが単一の責任を持つ
2. **可読性の向上**: コードが機能別に整理されている
3. **再利用性**: 各モジュールを独立して使用可能
4. **デバッグの容易さ**: 問題の特定が簡単
5. **チーム開発**: 複数人での並行開発が可能

## 元ファイル

元の `script.js` ファイルは `script.js.backup` としてバックアップされています。

## 使用方法

各モジュールは独立したクラスとして実装されており、メインの `SimpleWarehouseCalculator` クラスが各モジュールを統合して使用します。

```javascript
// 各モジュールは calculator インスタンスを通じてアクセス
calculator.inputManager.addPallet();
calculator.layoutManager.clearLayout();
calculator.summaryManager.updateSummaryTab();
calculator.layoutGenerator.calculateCombined(pallets, aisleWidth);
```
