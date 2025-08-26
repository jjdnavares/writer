/**
 * LLM Framework - Model Selector Component
 * 
 * A reusable component for selecting an LLM model based on the chosen provider.
 */

import { 
  Select, 
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Loader, AlertCircle } from 'lucide-react';
import type { ModelInfo } from '@/types/provider';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoading?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  isLoading = false,
  error = '',
  label = 'AI Model',
  placeholder = 'Select a model',
  className = '',
  disabled = false
}: ModelSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {isLoading && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Loader className="mr-1 h-3 w-3 animate-spin" />
            Loading...
          </div>
        )}
        {error && (
          <div className="flex items-center text-xs text-destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            {error}
          </div>
        )}
      </div>
      
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled || isLoading || models.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {models.map((model) => (
              <SelectItem 
                key={model.name} 
                value={model.name}
                title={model.label}
              >
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
