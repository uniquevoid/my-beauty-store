import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  adminClient!: SupabaseClient;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials are missing from environment variables.');
    }

    this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
}

