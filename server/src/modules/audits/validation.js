import { z } from 'zod';
import { INDUSTRY_IDS } from './industries.js';

export const createAuditSchema = z.object({
  url: z.string().trim().min(1, 'Enter a website URL').url('Enter a valid URL including https://'),
  industry: z.enum(INDUSTRY_IDS).default('generic'),
});

export const fixSchema = z.object({
  checkId: z.string().min(1),
});
