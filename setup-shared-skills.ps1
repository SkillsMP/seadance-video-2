# 共享 Skill 映射与凭据硬链接初始化脚本
#
# 本脚本用于创建：
# 1. .agents\skills -> D:\project3\skills\agents-skills (Junction 软链接)
# 2. .env.domain.local -> .env.domain.a.local 或 .env.domain.b.local (HardLink 硬链接)
#
# 使用方式：
# 1. 新 clone 或复制项目后，在仓库根目录运行：
#    .\setup-shared-skills.ps1
# 2. 如果共享 Skill 目录不在默认位置，运行：
#    .\setup-shared-skills.ps1 -SharedSkillsPath '实际的共享 Skill 目录'
#
# 说明：
# - 依据当前项目所在目录（project2 或 project3）自动绑定 A/B 套系凭据，杜绝串号。
# - 本地已建立链接时自动跳过，保证幂等。

[CmdletBinding()]
param(
    [Parameter()]
    [string]$SharedSkillsPath
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$linkPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.agents\skills'))

if ([string]::IsNullOrWhiteSpace($SharedSkillsPath)) {
    $candidate = Join-Path $repoRoot '..\..\skills\agents-skills'
    if (Test-Path -LiteralPath $candidate -PathType Container) {
        $SharedSkillsPath = $candidate
    } elseif (Test-Path -LiteralPath 'D:\project3\skills\agents-skills' -PathType Container) {
        $SharedSkillsPath = 'D:\project3\skills\agents-skills'
    } else {
        $SharedSkillsPath = $candidate
    }
}

if (-not [System.IO.Path]::IsPathRooted($SharedSkillsPath)) {
    $SharedSkillsPath = Join-Path $repoRoot $SharedSkillsPath
}

$sharedSkillsPath = [System.IO.Path]::GetFullPath($SharedSkillsPath)

if (-not (Test-Path -LiteralPath $sharedSkillsPath -PathType Container)) {
    throw "Shared skills directory not found: $sharedSkillsPath`nUse -SharedSkillsPath to specify the actual directory."
}

# 1. 建立或验证 .agents\skills Junction 映射
$existingLink = Get-Item -LiteralPath $linkPath -Force -ErrorAction SilentlyContinue

if ($null -ne $existingLink) {
    if (($existingLink.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) {
        throw "Target exists but is not a link: $linkPath`nNo existing files were changed."
    }

    $existingTarget = [System.IO.Path]::GetFullPath([string]$existingLink.Target)
    if ($existingTarget.TrimEnd('\') -ieq $sharedSkillsPath.TrimEnd('\')) {
        Write-Host "Shared skills link already exists:"
        Write-Host "$linkPath -> $sharedSkillsPath"
    } else {
        throw "A link already exists with a different target: $linkPath -> $existingTarget`nNo existing links were changed."
    }
} else {
    New-Item -ItemType Directory -Path (Split-Path -Parent $linkPath) -Force | Out-Null
    New-Item -ItemType Junction -Path $linkPath -Target $sharedSkillsPath | Out-Null
    Write-Host "Shared skills link created:"
    Write-Host "$linkPath -> $sharedSkillsPath"
}

# 2. 建立或更新当前项目根目录 .env.domain.local 硬链接 (依据路径自动分流 A/B 套系)
$normalizedPath = $repoRoot.Replace('/', '\')
$isProject2 = $normalizedPath -like '*\project2\*'
$isProject3 = $normalizedPath -like '*\project3\*'

$profileFile = $null
$profileDesc = $null

if ($isProject2) {
    $profileFile = '.env.domain.a.local'
    $profileDesc = 'Profile A (Aggressive SEO, GitHub: SkillsMP)'
} elseif ($isProject3) {
    $profileFile = '.env.domain.b.local'
    $profileDesc = 'Profile B (Clean Brand, GitHub: maxcoder11)'
} else {
    Write-Warning "Project path does not contain \project2\ or \project3\, skipping credentials mapping."
}

if ($profileFile) {
    $sourceEnv = Join-Path $sharedSkillsPath $profileFile
    $targetEnv = Join-Path $repoRoot '.env.domain.local'

    if (-not (Test-Path -LiteralPath $sourceEnv -PathType Leaf)) {
        Write-Warning "Source credentials file not found in central repo: $sourceEnv"
    } else {
        if (Test-Path -LiteralPath $targetEnv -PathType Leaf) {
            Remove-Item -LiteralPath $targetEnv -Force
        }
        
        if ((Get-Command New-Item).Parameters.ContainsKey('Target')) {
            New-Item -ItemType HardLink -Path $targetEnv -Target $sourceEnv -Force | Out-Null
        } else {
            New-Item -ItemType HardLink -Path $targetEnv -Value $sourceEnv -Force | Out-Null
        }

        Write-Host "Credentials HardLink linked ($profileDesc):"
        Write-Host "$targetEnv -> $profileFile"
    }
}
