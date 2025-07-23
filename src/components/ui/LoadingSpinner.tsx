import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', color = 'blue-500', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full`}
        style={{
          borderTopColor: `var(--${color})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};