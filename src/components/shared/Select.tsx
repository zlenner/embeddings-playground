import { ComponentChildren } from 'preact';

interface SelectProps {
  value?: string;
  onChange?: (newValue: string) => void;
  className?: string;
  children?: ComponentChildren;
  disabled?: boolean;
}

function Select({ value, onChange, className, children, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        if (onChange) {
          onChange(e.currentTarget.value);
        }
      }}
      className={`
        bg-white text-gray-500 hover:bg-gray-200 hover:text-gray-800
        ${className}
        ${(disabled) ? 'opacity-50 pointer-events-none' : ''}
        py-1.5 px-3
        border-transparent border-r-8
        font-medium
        cursor-pointer
        font-sans
        focus:outline-none
        outline-none
        transition duration-300
        ease-in-out
        select-none
        items-center
        relative
        group
        justify-center
        rounded-md
        cursor-point
        whitespace-nowrap
        inline-flex
        text-sm
        h-8
      `}
      disabled={disabled}
    >
      {children}
    </select>
  );
}

export default Select;
