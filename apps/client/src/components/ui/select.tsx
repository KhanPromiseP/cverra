import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/client/libs/utils";

// Context for select
interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
};

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, disabled = false, children }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange, disabled }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value, disabled } = useSelect();
    
    return (
      <button
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400",
          className
        )}
        disabled={disabled}
        {...props}
      >
        <span className="truncate">{children}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = useSelect();
  
  return (
    <span className="truncate">
      {value || placeholder || "Select an option"}
    </span>
  );
};
SelectValue.displayName = "SelectValue";

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { value, onValueChange, disabled } = useSelect();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setIsOpen(false)}
          />
        )}
        
        <div className="relative">
          <div
            ref={ref}
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700",
              className
            )}
            {...props}
          >
            {React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child as React.ReactElement<any>, {
                    onSelect: (value: string) => {
                      onValueChange(value);
                      setIsOpen(false);
                    },
                    isSelected: value === (child as any).props.value,
                    disabled
                  })
                : child
            )}
          </div>
        </div>
      </>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, onSelect, isSelected, disabled, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-gray-600 dark:focus:bg-gray-600",
          isSelected && "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100",
          className
        )}
        onClick={() => !disabled && onSelect?.(value)}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};