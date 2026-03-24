# 通过 Supabase REST API 执行迁移
$supabaseUrl = "https://nyiozcmzdehybowlnyvh.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aW96Y216ZGVoeWJvd2xueXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU3NTU5NiwiZXhwIjoyMDQ5MTUxNTk2fQ.UnKnUP5UW9-8SLN4xcqYUw_2icLtL55"

# 读取迁移 SQL
$sql = Get-Content "supabase\migrations\MANUAL_MIGRATION.sql" -Raw

Write-Host "📝 准备执行迁移..." -ForegroundColor Yellow

# 分割 SQL 语句
$statements = $sql -split ";" | Where-Object { $_.Trim() -and $_ -notmatch "^--" }

$successCount = 0
$skipCount = 0
$errorCount = 0

foreach ($stmt in $statements) {
    $stmt = $stmt.Trim()
    if (-not $stmt) { continue }
    
    Write-Host "`n执行: $($stmt.Substring(0, [Math]::Min(50, $stmt.Length)))..." -ForegroundColor Cyan
    
    try {
        $body = @{ query = $stmt } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/query" `
            -Method Post `
            -Headers @{
                "apikey" = $serviceKey
                "Authorization" = "Bearer $serviceKey"
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✅ 成功" -ForegroundColor Green
        $successCount++
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "already exists|duplicate") {
            Write-Host "  ⚠️  已存在，跳过" -ForegroundColor Yellow
            $skipCount++
        }
        else {
            Write-Host "  ❌ 失败: $errorMsg" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "迁移完成！" -ForegroundColor Green
Write-Host "成功: $successCount | 跳过: $skipCount | 失败: $errorCount" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
