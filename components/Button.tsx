import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "transition-all duration-200 font-bold active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-pop-yellow text-pop-black border-2 border-black shadow-hard rounded-xl hover:bg-yellow-300 py-3 px-6",
    secondary: "bg-white text-pop-black border-2 border-black shadow-hard-sm rounded-xl hover:bg-gray-50 py-2 px-4",
    ghost: "bg-transparent text-pop-black hover:bg-gray-100 rounded-lg py-2 px-4",
    icon: "p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors flex items-center justify-center",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};