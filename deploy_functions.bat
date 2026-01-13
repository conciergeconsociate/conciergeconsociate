@echo off
echo Deploying handle-checkout function...
call npx supabase functions deploy handle-checkout --no-verify-jwt

echo Deploying notify function...
call npx supabase functions deploy notify --no-verify-jwt

echo Functions deployed successfully!
pause
