/**
 * LLM Framework - API Key Input Component
 * 
 * A reusable component for inputting and managing API keys for LLM providers.
 * Includes functionality for masking/unmasking the key and validation.
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Key } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
    error?: string;
  label?: string;
  className?: string;
  placeholder?: string;
}

export function ApiKeyInput({
  apiKey,
  onApiKeyChange,
  error = '',
  label = 'API Key',
  className = '',
  placeholder = 'Enter your API key'
}: ApiKeyInputProps) {
  const [masked, setMasked] = useState(true);

  // Toggle visibility of the API key
  const toggleMask = () => setMasked(!masked);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      <div className="flex w-full items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type={masked ? 'password' : 'text'}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
            onClick={toggleMask}
            tabIndex={-1}
          >
            {masked ? (
              <Eye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {masked ? 'Show API key' : 'Hide API key'}
            </span>
          </Button>
        </div>
        <Key className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
