/**
 * LLM Framework - Provider Selector Component
 * 
 * A reusable component for selecting an LLM provider.
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
import type { ProviderInfo } from '@/types/model';

interface ProviderSelectorProps {
  providers: ProviderInfo[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  isLoading?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function ProviderSelector({
  providers,
  selectedProvider,
  onProviderChange,
  isLoading = false,
  error = '',
  label = 'AI Provider',
  placeholder = 'Select a provider',
  className = ''
}: ProviderSelectorProps) {
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
        value={selectedProvider}
        onValueChange={onProviderChange}
        disabled={isLoading || providers.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{label}</SelectLabel>
            {providers.map((provider) => (
              <SelectItem 
                key={provider.name} 
                value={provider.name}
              >
                {provider.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
