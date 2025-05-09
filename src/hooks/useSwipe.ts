/**
 * シンプルなドラッグ処理のためのカスタムフック
 * 外部ライブラリを使わず、純粋なタッチ/マウスイベントを使用して
 * ドラッグ操作を実装します
 */
import { useRef, useCallback } from 'react';

// スワイプ方向の型定義
export type SwipeDirection = 'up' | 'down' | 'left' | 'right' | null;

// 戻り値の型定義
interface DragHandlers {
  onTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

export const useSwipe = (
  onDragStart?: () => void,
  onDragging?: (deltaX: number, deltaY: number) => void,
  onDragEnd?: (direction: SwipeDirection, finalDelta: { x: number, y: number }) => void,
  threshold: number = 50  // スワイプと判定する閾値
): DragHandlers => {
  // ドラッグの開始位置を記録
  const startPos = useRef<{ x: number; y: number } | null>(null);
  
  // 現在のドラッグ状態を管理
  const isDragging = useRef<boolean>(false);
  
  // 現在の変位量を記録
  const currentDelta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // スワイプ方向を検出する関数
  const getSwipeDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection => {
    // 閾値より小さい移動量の場合はスワイプとみなさない
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return null;
    }
    
    // X方向とY方向の移動量を比較して主要な方向を決定
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // X方向の移動が主要
      return deltaX > 0 ? 'right' : 'left';
    } else {
      // Y方向の移動が主要
      return deltaY > 0 ? 'down' : 'up';
    }
  }, [threshold]);

  // タッチ/マウスの開始位置を取得する関数
  const getClientPosition = useCallback((e: React.TouchEvent | React.MouseEvent): { x: number, y: number } | null => {
    if ('touches' in e) {
      // タッチイベントの場合
      if (e.touches.length === 0) {
        return null;
      }
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      // マウスイベントの場合
      return {
        x: e.clientX,
        y: e.clientY
      };
    }
  }, []);

  // タッチ/ドラッグ開始時のハンドラ
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const pos = getClientPosition(e);
    if (!pos) return;
    
    startPos.current = pos;
    isDragging.current = true;
    currentDelta.current = { x: 0, y: 0 };
    
    if (onDragStart) {
      onDragStart();
    }
  }, [getClientPosition, onDragStart]);
  
  // タッチ/ドラッグ移動時のハンドラ
  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || !startPos.current) return;
    
    const pos = getClientPosition(e);
    if (!pos) return;
    
    const deltaX = pos.x - startPos.current.x;
    const deltaY = pos.y - startPos.current.y;
    
    currentDelta.current = { x: deltaX, y: deltaY };
    
    if (onDragging) {
      onDragging(deltaX, deltaY);
    }
  }, [getClientPosition, onDragging]);
  
  // タッチ/ドラッグ終了時のハンドラ
  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    const direction = getSwipeDirection(currentDelta.current.x, currentDelta.current.y);
    
    if (onDragEnd && direction) {
      onDragEnd(direction, currentDelta.current);
    }
    
    // 状態をリセット
    isDragging.current = false;
    startPos.current = null;
  }, [onDragEnd, threshold, getSwipeDirection]);
  
  return {
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
    onMouseDown: handleStart,
    onMouseMove: handleMove,
    onMouseUp: handleEnd
  };
};
