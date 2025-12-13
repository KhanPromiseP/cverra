import * as React from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

// Create the main component
const DropdownMenuRoot: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div className="dropdown">{children}</div>
}

// Create subcomponents
const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children }) => {
  return <div className="dropdown-trigger">{children}</div>
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, className }) => {
  return <div className={`dropdown-content ${className}`}>{children}</div>
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className }) => {
  return (
    <div 
      className={`dropdown-item ${className}`}
      onClick={onClick}
      role="button"
    >
      {children}
    </div>
  )
}

// Assign subcomponents to main component
const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem
})

// Export only once
export { DropdownMenu }