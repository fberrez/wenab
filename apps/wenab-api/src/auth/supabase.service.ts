import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseAnonKey = this.configService.get<string>("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      this.logger.error(
        "Supabase URL and/or Anon Key are missing from environment variables. Supabase client will not be initialized."
      );
      return;
    }

    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      this.logger.log("Supabase client initialized successfully.");
    } catch (error) {
      this.logger.error("Failed to initialize Supabase client:", error);
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.logger.error(
        "Supabase client is not initialized. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly and the module initialized."
      );
      throw new Error("Supabase client is not available.");
    }
    return this.supabaseClient;
  }
}
