'use client';

import * as SelectPrimitive from '@radix-ui/react-select';

import { SelectTrigger } from './select-trigger';
import { SelectContent } from './select-content';
import { SelectLabel } from './select-label';
import { SelectItem } from './select-item';
import { SelectSeparator } from './select-separator';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};

