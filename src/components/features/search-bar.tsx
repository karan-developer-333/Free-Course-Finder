'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Search for courses...',
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-12"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !value.trim()}>
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
