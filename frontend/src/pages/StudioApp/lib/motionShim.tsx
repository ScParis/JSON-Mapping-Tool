import React from 'react';

export const AnimatePresence: React.FC<{ children?: React.ReactNode; mode?: string; initial?: boolean }> = ({ children }) => <>{children}</>;

const createMotionComponent = (Tag: string) => {
  const MotionComp = React.forwardRef<any, any>(({
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    whileFocus,
    whileDrag,
    whileInView,
    viewport,
    variants,
    layout,
    layoutId,
    ...props
  }, ref) => {
    return React.createElement(Tag, { ...props, ref });
  });
  MotionComp.displayName = `motion.${Tag}`;
  return MotionComp;
};

export const motion = new Proxy({} as Record<string, React.FC<any>>, {
  get: (_, prop: string) => createMotionComponent(prop)
}) as any;
