'use client';

import { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

const CustomEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const status = (data as { status?: string })?.status || 'pending';

  let strokeClass = 'stroke-gray-300 dark:stroke-gray-600';
  let strokeWidth = 2;
  let dashArray = '8 5';
  let dashOffset: string | undefined = undefined;

  if (status === 'active') {
    strokeClass = 'stroke-amber-500 dark:stroke-amber-400';
    strokeWidth = 2.5;
    dashArray = '8 5';
    dashOffset = '0';
  } else if (status === 'completed') {
    strokeClass = 'stroke-emerald-500 dark:stroke-emerald-400';
    strokeWidth = 2.5;
    dashArray = '';
    dashOffset = undefined;
  } else if (status === 'blocked') {
    strokeClass = 'stroke-rose-400 dark:stroke-rose-500';
    strokeWidth = 2;
    dashArray = '4 6';
  }

  return (
    <>
      {/* Wide glow effect for active/completed */}
      {(status === 'active' || status === 'completed') && (
        <path
          d={edgePath}
          fill="none"
          className={status === 'active' ? 'stroke-amber-400' : 'stroke-emerald-400'}
          strokeWidth={8}
          strokeOpacity={0.1}
        />
      )}

      {/* Medium glow */}
      {(status === 'active' || status === 'completed') && (
        <path
          d={edgePath}
          fill="none"
          className={status === 'active' ? 'stroke-amber-400' : 'stroke-emerald-400'}
          strokeWidth={5}
          strokeOpacity={0.2}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        className={strokeClass}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray || undefined}
        strokeLinecap="round"
        style={
          status === 'active'
            ? {
                animation: 'flow-dash 0.8s linear infinite',
              }
            : undefined
        }
      />

      {/* Arrow dot at target */}
      <circle
        cx={targetX}
        cy={targetY}
        r={4}
        fill="currentColor"
        className={
          status === 'completed'
            ? 'fill-emerald-500 dark:fill-emerald-400'
            : status === 'active'
              ? 'fill-amber-500 dark:fill-amber-400'
              : status === 'blocked'
                ? 'fill-rose-400 dark:fill-rose-500'
                : 'fill-gray-300 dark:fill-gray-600'
        }
      />

      {/* Small pulse circle for active edges */}
      {status === 'active' && (
        <circle
          cx={targetX}
          cy={targetY}
          r={6}
          fill="none"
          className="stroke-amber-400"
          strokeWidth={1.5}
          strokeOpacity={0.5}
        >
          <animate
            attributeName="r"
            values="4;10;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.6;0;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </>
  );
};

export const CustomEdge = memo(CustomEdgeComponent);
