import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, plan_id, end_date, full_name, email } = await req.json();

    if (!user_id || !plan_id || !end_date) {
      throw new Error("Missing required fields: user_id, plan_id, end_date");
    }

    console.log(`Processing checkout for User: ${user_id}, Plan: ${plan_id}`);

    // 0. Ensure Profile Exists (Critical for Guest Flow)
    // If the user was just created, they might not have a profile row yet.
    // We try to upsert it to ensure foreign key constraints for user_memberships are met.
    const { error: profileError } = await supabase.from("profiles").upsert({
        id: user_id,
        full_name: full_name,
        email: email,
        role: 'member' // Default role for paying users
    }, { onConflict: "id" }); // Update if exists to ensure name/email are fresh

    if (profileError) {
        console.error("Error ensuring profile exists:", profileError);
    }

    // 1. Deactivate old memberships
    const { error: updateError } = await supabase.from("user_memberships")
        .update({ active: false, status: 'inactive' })
        .eq("user_id", user_id);
    
    if (updateError) {
        console.error("Error deactivating old memberships:", updateError);
        throw updateError;
    }

    // 2. Insert new membership
    const { error: insertError } = await supabase.from("user_memberships").insert({
        user_id: user_id,
        plan_id: plan_id,
        start_date: new Date().toISOString(),
        end_date: end_date,
        active: true,
        status: 'active'
    });

    if (insertError) {
        console.error("Error inserting new membership:", insertError);
        throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Handle-checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
