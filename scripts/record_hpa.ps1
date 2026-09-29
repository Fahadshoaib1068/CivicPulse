param(
    [int]$DurationSeconds = 780,
    [int]$IntervalSeconds = 5,
    [string]$OutputPath = "evidence/hpa-samples.csv"
)

$output = Resolve-Path (Split-Path $OutputPath -Parent) -ErrorAction SilentlyContinue
if (-not $output) {
    New-Item -ItemType Directory -Path (Split-Path $OutputPath -Parent) -Force | Out-Null
}

$start = Get-Date
$rows = [System.Collections.Generic.List[object]]::new()

while (((Get-Date) - $start).TotalSeconds -lt $DurationSeconds) {
    $sampledAt = Get-Date
    $hpa = kubectl get hpa backend-hpa -n civicpulse -o json | ConvertFrom-Json
    $rows.Add([pscustomobject]@{
        observed_at_utc = $sampledAt.ToUniversalTime().ToString("o")
        elapsed_seconds = [math]::Round(($sampledAt - $start).TotalSeconds, 1)
        current_replicas = $hpa.status.currentReplicas
        desired_replicas = $hpa.status.desiredReplicas
        current_cpu_utilization = $hpa.status.currentMetrics[0].resource.current.averageUtilization
        target_cpu_utilization = $hpa.spec.metrics[0].resource.target.averageUtilization
    })
    $rows | Export-Csv -Path $OutputPath -NoTypeInformation
    Start-Sleep -Seconds $IntervalSeconds
}

Write-Host "Recorded $($rows.Count) HPA samples to $OutputPath"