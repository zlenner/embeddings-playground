interface ButtonProps {
  onClick?: (event: MouseEvent) => void;
  type?: "primary" | "secondary";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
}

function Button({ onClick, type = "secondary", className, children, disabled, selected }: ButtonProps) {
  const buttonColors = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white',
    secondary:
      'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-800',
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${buttonColors[type]}
        ${className}
        ${(disabled) ? 'opacity-50 pointer-events-none' : ''}
        ${(selected) ? 'pointer-events-none !bg-emerald-500 !text-white' : ''}
        py-1.5 px-3
        font-medium
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
        active:scale-95
        origin-center
        whitespace-nowrap
        inline-flex
        text-sm
        h-8
      `}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;