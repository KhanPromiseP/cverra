import { Check } from 'lucide-react';
import { Button } from '@reactive-resume/ui';
import { DropdownMenu } from '../ui/dropdown-menu';

const styles = [
  { value: 'Modern', description: 'Clean, contemporary design with professional language' },
  { value: 'Traditional', description: 'Classic, formal structure with conservative language' },
  { value: 'Executive', description: 'Sophisticated, strategic language for leadership roles' },
  { value: 'Creative', description: 'Innovative, personal approach for creative industries' },
  { value: 'Minimalist', description: 'Concise, direct language with clean structure' },
  { value: 'Professional', description: 'Balanced approach emphasizing skills and value' }
];

interface StyleSelectorProps {
  value: string;
  onChange: (style: string) => void;
}

export const StyleSelector = ({ value, onChange }: StyleSelectorProps) => {
  const currentStyle = styles.find(style => style.value === value) || styles[0];

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" className="capitalize">
          {currentStyle.value.toLowerCase()}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="w-64">
        {styles.map((style) => (
          <DropdownMenu.Item
            key={style.value}
            onClick={() => onChange(style.value)}
            className="flex flex-col items-start p-3"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium capitalize">{style.value.toLowerCase()}</span>
              {value === style.value && <Check className="w-4 h-4" />}
            </div>
            <p className="text-xs text-gray-600 text-left mt-1">
              {style.description}
            </p>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};