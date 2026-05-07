@echo off
cd /d E:\Projects\jobie\frontend\app\candidate\dashboard
copy page.tsx page.tsx.backup
copy new-page.tsx page.tsx
del new-page.tsx
echo Dashboard replacement complete!
