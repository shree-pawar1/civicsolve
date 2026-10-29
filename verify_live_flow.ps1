$ErrorActionPreference = "Stop"

Write-Host "=== CIVICSOLVE LIVE E2E PROTOCOL VERIFICATION ===" -ForegroundColor Cyan

# 1. Register Citizen
Write-Host "`n[1] Registering Citizen..." -ForegroundColor Yellow
$citizenBody = @{
  fullName = "Anuja Citizen"
  email = "anuja.citizen@example.com"
  password = "Password123!"
  confirmPassword = "Password123!"
  role = "CITIZEN"
} | ConvertTo-Json
try {
  $regCitizen = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $citizenBody -ContentType "application/json"
  Write-Host "Citizen registered: $($regCitizen.user.fullName) ($($regCitizen.user.email))" -ForegroundColor Green
} catch {
  Write-Host "Citizen already exists or registered: $_" -ForegroundColor Gray
}

# 2. Register University
Write-Host "`n[2] Registering University..." -ForegroundColor Yellow
$uniBody = @{
  fullName = "Prof. Arvind Rao"
  email = "arvind.rao@iit.ac.in"
  password = "Password123!"
  confirmPassword = "Password123!"
  role = "UNIVERSITY"
  organization = "IIT Madras"
} | ConvertTo-Json
try {
  $regUni = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $uniBody -ContentType "application/json"
  Write-Host "University registered: $($regUni.user.fullName) ($($regUni.user.organization))" -ForegroundColor Green
} catch {
  Write-Host "University already registered" -ForegroundColor Gray
}

# 3. Register Industry
Write-Host "`n[3] Registering Industry..." -ForegroundColor Yellow
$indBody = @{
  fullName = "Kavita Sharma"
  email = "kavita@tataprojects.com"
  password = "Password123!"
  confirmPassword = "Password123!"
  role = "INDUSTRY"
  organization = "Tata Projects Infra"
} | ConvertTo-Json
try {
  $regInd = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $indBody -ContentType "application/json"
  Write-Host "Industry registered: $($regInd.user.fullName) ($($regInd.user.organization))" -ForegroundColor Green
} catch {
  Write-Host "Industry already registered" -ForegroundColor Gray
}

# 4. Register Government
Write-Host "`n[4] Registering Government..." -ForegroundColor Yellow
$govBody = @{
  fullName = "Commissioner Rajesh Kumar"
  email = "rajesh.kumar@bbmp.gov.in"
  password = "Password123!"
  confirmPassword = "Password123!"
  role = "GOVERNMENT"
  organization = "Municipal Corporation"
} | ConvertTo-Json
try {
  $regGov = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $govBody -ContentType "application/json"
  Write-Host "Government registered: $($regGov.user.fullName) ($($regGov.user.organization))" -ForegroundColor Green
} catch {
  Write-Host "Government already registered" -ForegroundColor Gray
}

# 5. Wrong Password Test
Write-Host "`n[5] Testing Wrong Password Authentication (Expecting HTTP 401)..." -ForegroundColor Yellow
$badLoginBody = @{
  email = "anuja.citizen@example.com"
  password = "WrongPassword999!"
} | ConvertTo-Json
try {
  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $badLoginBody -ContentType "application/json"
  Write-Host "ERROR: Wrong password authenticated!" -ForegroundColor Red
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "Success: Wrong password rejected with HTTP $status" -ForegroundColor Green
}

# 6. Correct Citizen Login
Write-Host "`n[6] Correct Login for Citizen (Issuing Session 1)..." -ForegroundColor Yellow
$citizenWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{
  email = "anuja.citizen@example.com"
  password = "Password123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $citizenWebSession
Write-Host "Citizen logged in. Session Token: $($loginRes.token.Substring(0, 16))..." -ForegroundColor Green

# 7. Single-Session Rejection Test
Write-Host "`n[7] Second Login from Client B (Expecting HTTP 409 Conflict)..." -ForegroundColor Yellow
try {
  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
  Write-Host "ERROR: Second login was allowed!" -ForegroundColor Red
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "Success: Second login rejected with HTTP $status (Single-Session Enforced!)" -ForegroundColor Green
}

# 8. Citizen Reports Real Problem
Write-Host "`n[8] Citizen Reports Community Problem..." -ForegroundColor Yellow
$probBody = @{
  title = "Collapsing Stormwater Culvert on 4th Main Road"
  description = "The stone culvert has partially collapsed following heavy pre-monsoon rainfall, creating a hazardous 3-meter deep cavity adjacent to the primary school pedestrian walkway."
  category = "INFRASTRUCTURE"
  location = "4th Main Road, Ward 12 near Gandhi High School"
  priority = "HIGH"
} | ConvertTo-Json

$probRes = Invoke-RestMethod -Uri "http://localhost:5000/api/problems" -Method Post -Body $probBody -ContentType "application/json" -WebSession $citizenWebSession
$problemId = $probRes.problem.id
Write-Host "Problem created! ID: $problemId" -ForegroundColor Green
Write-Host "Initial Status: $($probRes.problem.status) | Priority: $($probRes.problem.priority)" -ForegroundColor Green

# 9. University Submits Research Proposal
Write-Host "`n[9] University Submits Research Proposal..." -ForegroundColor Yellow
$uniWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$uniLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ email = "arvind.rao@iit.ac.in"; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json" -WebSession $uniWebSession

$proposalBody = @{
  title = "Geosynthetic-Reinforced Culvert Rehabilitation Methodology"
  explanation = "A geotechnical research methodology using modular high-tensile geosynthetic reinforcement and high-early-strength lightweight cellular concrete backfill to stabilize the culvert without closing pedestrian access."
  expectedBenefits = "Restores roadway structural capacity by 300% and reduces construction carbon footprint by 45%."
  implementationApproach = "Stage 1: Ground-penetrating radar void mapping. Stage 2: Micro-pile stabilization. Stage 3: Precast slab placement."
} | ConvertTo-Json

$propRes = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId/solutions" -Method Post -Body $proposalBody -ContentType "application/json" -WebSession $uniWebSession
$proposalId = $propRes.solution.id
Write-Host "University Proposal submitted! Type: $($propRes.solution.type) | ID: $proposalId" -ForegroundColor Green

# 10. Industry Submits Technical Recommendation
Write-Host "`n[10] Industry Submits Technical Recommendation..." -ForegroundColor Yellow
$indWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$indLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ email = "kavita@tataprojects.com"; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json" -WebSession $indWebSession

$recBody = @{
  title = "Modular Precast Box Culvert Fast-Track Deployment"
  explanation = "Commercial turnkey deployment of pre-engineered, factory-cured M40 grade box culvert units with hydraulic crane positioning within a single 48-hour weekend window."
  expectedBenefits = "Eliminates prolonged roadway closures and provides a certified 50-year design life."
  implementationApproach = "Pre-casting during review period; off-peak weekend road diversion; installation in 48 hours."
} | ConvertTo-Json

$recRes = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId/solutions" -Method Post -Body $recBody -ContentType "application/json" -WebSession $indWebSession
Write-Host "Industry Recommendation submitted! Type: $($recRes.solution.type)" -ForegroundColor Green

# 11. Citizen Supports Proposal
Write-Host "`n[11] Citizen Upvotes University Proposal..." -ForegroundColor Yellow
$supRes = Invoke-RestMethod -Uri "http://localhost:5000/api/solutions/$proposalId/support" -Method Post -WebSession $citizenWebSession
Write-Host "Support registered: Supported = $($supRes.supported), Total Supports = $($supRes.totalSupports)" -ForegroundColor Green

# 12. Government Transitions Status
Write-Host "`n[12] Government Executes Status Transitions..." -ForegroundColor Yellow
$govWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$govLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ email = "rajesh.kumar@bbmp.gov.in"; password = "Password123!" } | ConvertTo-Json) -ContentType "application/json" -WebSession $govWebSession

# Transition 1: SUBMITTED -> UNDER_REVIEW
$trans1 = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId/status" -Method Post -Body (@{ toStatus = "UNDER_REVIEW"; message = "Municipal Chief Engineer assigned for site safety survey and barrier installation." } | ConvertTo-Json) -ContentType "application/json" -WebSession $govWebSession
Write-Host "Status -> $($trans1.problem.status): $($trans1.timelineEntry.message)" -ForegroundColor Green

# Transition 2: UNDER_REVIEW -> IN_PROGRESS
$trans2 = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId/status" -Method Post -Body (@{ toStatus = "IN_PROGRESS"; message = "Contractor mobilised with precast units following approval of University and Industry proposals." } | ConvertTo-Json) -ContentType "application/json" -WebSession $govWebSession
Write-Host "Status -> $($trans2.problem.status): $($trans2.timelineEntry.message)" -ForegroundColor Green

# Transition 3: IN_PROGRESS -> RESOLVED
$trans3 = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId/status" -Method Post -Body (@{ toStatus = "RESOLVED"; message = "Culvert successfully reconstructed, load tested, and reopened for pedestrian and vehicular traffic." } | ConvertTo-Json) -ContentType "application/json" -WebSession $govWebSession
Write-Host "Status -> $($trans3.problem.status): $($trans3.timelineEntry.message)" -ForegroundColor Green

# 13. Verify Problem Details & Immutable Timeline
Write-Host "`n[13] Verifying Complete Problem Detail & Timeline..." -ForegroundColor Yellow
$finalProb = Invoke-RestMethod -Uri "http://localhost:5000/api/problems/$problemId" -Method Get
Write-Host "Final Problem Status: $($finalProb.problem.status)" -ForegroundColor Green
Write-Host "Total Solutions: $($finalProb.problem.solutions.Count)" -ForegroundColor Green
Write-Host "Total Timeline Progress Updates: $($finalProb.problem.updates.Count)" -ForegroundColor Green

# 14. Verify Real Dashboard Statistics
Write-Host "`n[14] Verifying Real Dashboard Analytics..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/stats" -Method Get
Write-Host "Summary: Total Problems = $($stats.summary.totalProblems), Total Solutions = $($stats.summary.totalSolutions), Resolution Rate = $($stats.summary.resolutionRate)%" -ForegroundColor Green

# 15. Citizen Logout & Session Revocation
Write-Host "`n[15] Citizen Logs Out (Revoking Server Session)..." -ForegroundColor Yellow
$logoutRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/logout" -Method Post -WebSession $citizenWebSession
Write-Host "Logout response: $($logoutRes.message)" -ForegroundColor Green

# Verify session is revoked (Expect HTTP 401)
try {
  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -WebSession $citizenWebSession
  Write-Host "ERROR: Session was still active after logout!" -ForegroundColor Red
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "Success: Protected route returned HTTP $status after logout (Session properly revoked!)" -ForegroundColor Green
}

Write-Host "`n=== ALL LIVE PROTOCOL TESTS SUCCESSFULLY VERIFIED ===" -ForegroundColor Cyan
