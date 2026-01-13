Write-Output "Deploying handle-checkout function..."
npx supabase functions deploy handle-checkout --no-verify-jwt

Write-Output "Deploying notify function..."
npx supabase functions deploy notify --no-verify-jwt

Write-Output "Functions deployed successfully!"
