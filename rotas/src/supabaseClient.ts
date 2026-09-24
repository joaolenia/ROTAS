import { createClient } from '@supabase/supabase-js';

// Substitua pelos seus dados reais do Supabase (Project Settings > API)
const supabaseUrl = 'https://xpwjgudhyxhlxorrpvti.supabase.co'
const supabaseKey = 'sb_publishable_FM7I5ZNOpnq-jFFKtyds6Q_gMsTGusF';

export const supabase = createClient(supabaseUrl, supabaseKey);