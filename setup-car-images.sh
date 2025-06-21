#!/bin/bash

# 車種画像追加スクリプト
# 新しい車種画像を追加するためのプレースホルダーファイルを作成します

echo "🚗 車種画像管理スクリプト"
echo "==========================="

# 現在の車種画像ディレクトリ
CARS_DIR="public/images/cars"

# 既存のファイル数を確認
existing_files=$(ls -1 $CARS_DIR/*.png 2>/dev/null | wc -l)
echo "📊 現在の画像ファイル数: $existing_files 枚"

# 新しい画像ファイルのリスト（car10.png から car52.png まで）
new_files=(
    "car10.png" "car11.png" "car12.png" "car13.png" "car14.png"  # クロスカントリー追加
    "car15.png" "car16.png" "car17.png" "car18.png" "car19.png"  # SUV追加
    "car20.png" "car21.png" "car22.png" "car23.png" "car24.png"  # 軽自動車追加
    "car25.png" "car26.png" "car27.png" "car28.png" "car29.png"  # ミニバン追加
    "car30.png" "car31.png" "car32.png" "car33.png" "car34.png"  # ワンボックス追加
    "car35.png" "car36.png" "car37.png" "car38.png" "car39.png"  # コンパクト追加
    "car40.png" "car41.png" "car42.png" "car43.png" "car44.png"  # セダン追加
    "car45.png" "car46.png" "car47.png" "car48.png"             # ステーションワゴン追加
    "car49.png" "car50.png" "car51.png" "car52.png"             # クーペ追加
)

# カテゴリ取得関数
get_category() {
    local file=$1
    case $file in
        car10.png|car11.png|car12.png|car13.png|car14.png) echo "クロスカントリー" ;;
        car15.png|car16.png|car17.png|car18.png|car19.png) echo "SUV" ;;
        car20.png|car21.png|car22.png|car23.png|car24.png) echo "軽自動車" ;;
        car25.png|car26.png|car27.png|car28.png|car29.png) echo "ミニバン" ;;
        car30.png|car31.png|car32.png|car33.png|car34.png) echo "ワンボックス" ;;
        car35.png|car36.png|car37.png|car38.png|car39.png) echo "コンパクト" ;;
        car40.png|car41.png|car42.png|car43.png|car44.png) echo "セダン" ;;
        car45.png|car46.png|car47.png|car48.png) echo "ステーションワゴン" ;;
        car49.png|car50.png|car51.png|car52.png) echo "クーペ" ;;
        *) echo "不明" ;;
    esac
}

echo ""
echo "🔄 新しい画像ファイルの作成を開始します..."

# プレースホルダー画像ファイルを作成
created_count=0
for file in "${new_files[@]}"; do
    filepath="$CARS_DIR/$file"
    
    if [ ! -f "$filepath" ]; then
        # car1.pngをコピーしてプレースホルダーとして使用
        if [ -f "$CARS_DIR/car1.png" ]; then
            cp "$CARS_DIR/car1.png" "$filepath"
            category=$(get_category "$file")
            echo "✅ 作成: $file ($category)"
            ((created_count++))
        else
            echo "❌ エラー: car1.png が見つかりません"
        fi
    else
        echo "⏭️  スキップ: $file (既に存在)"
    fi
done

echo ""
echo "📈 作成完了統計:"
echo "   - 新規作成: $created_count 枚"
echo "   - 合計画像数: $(ls -1 $CARS_DIR/*.png 2>/dev/null | wc -l) 枚"

echo ""
echo "📝 次のステップ:"
echo "   1. 作成されたプレースホルダー画像を実際の車種画像に置き換えてください"
echo "   2. 各カテゴリごとの画像配布:"
echo ""
echo "   📋 カテゴリ別画像リスト:"
echo "   ・クロスカントリー: car1.png, car10.png-car14.png (計6枚)"
echo "   ・SUV: car2.png, car15.png-car19.png (計6枚)"
echo "   ・軽自動車: car3.png, car20.png-car24.png (計6枚)"
echo "   ・ミニバン: car4.png, car25.png-car29.png (計6枚)"
echo "   ・ワンボックス: car5.png, car30.png-car34.png (計6枚)"
echo "   ・コンパクト: car6.png, car35.png-car39.png (計6枚)"
echo "   ・セダン: car7.png, car40.png-car44.png (計6枚)"
echo "   ・ステーションワゴン: car8.png, car45.png-car48.png (計5枚)"
echo "   ・クーペ: car9.png, car49.png-car52.png (計5枚)"

echo ""
echo "✨ 車種画像管理スクリプト完了！"
