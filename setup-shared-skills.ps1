# 共享 Skill 映射说明
#
# 本脚本用于创建：
# .agents\skills -> D:\project3\skills\agents-skills
#
# 使用方式：
# 1. 新 clone 项目后，在仓库根目录运行：
#    .\setup-shared-skills.ps1
# 2. 如果共享 Skill 目录不在默认位置，运行：
#    .\setup-shared-skills.ps1 -SharedSkillsPath '实际的共享 Skill 目录'
#
# 说明：
# - 当前电脑已有正确映射时，脚本会自动跳过，不需要重复创建。
# - 脚本不会删除或覆盖已有的普通文件夹或其他映射。
# - .gitignore 只忽略映射目录里的 Skill 内容，不上传共享 Skill 文件。
# - GitHub 不保存 Windows Junction；重新 clone 后只需运行本脚本一次。

[CmdletBinding()]
param(
    [Parameter()]
    [string]$SharedSkillsPath
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$linkPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot '.agents\skills'))

if ([string]::IsNullOrWhiteSpace($SharedSkillsPath)) {
    # Default layout:
    # D:\project3\shipany-2\bananapro-org
    # -> D:\project3\skills\agents-skills
    $SharedSkillsPath = Join-Path $repoRoot '..\..\skills\agents-skills'
}

if (-not [System.IO.Path]::IsPathRooted($SharedSkillsPath)) {
    $SharedSkillsPath = Join-Path $repoRoot $SharedSkillsPath
}

$sharedSkillsPath = [System.IO.Path]::GetFullPath($SharedSkillsPath)

if (-not (Test-Path -LiteralPath $sharedSkillsPath -PathType Container)) {
    throw "Shared skills directory not found: $sharedSkillsPath`nUse -SharedSkillsPath to specify the actual directory."
}

$existingLink = Get-Item -LiteralPath $linkPath -Force -ErrorAction SilentlyContinue

if ($null -ne $existingLink) {
    if (($existingLink.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0) {
        throw "Target exists but is not a link: $linkPath`nNo existing files were changed."
    }

    $existingTarget = [System.IO.Path]::GetFullPath([string]$existingLink.Target)
    if ($existingTarget.TrimEnd('\') -ieq $sharedSkillsPath.TrimEnd('\')) {
        Write-Host 'Shared skills link already exists; no action needed.'
        Write-Host "$linkPath -> $sharedSkillsPath"
        exit 0
    }

    throw "A link already exists with a different target: $linkPath -> $existingTarget`nNo existing links were changed."
}

New-Item -ItemType Directory -Path (Split-Path -Parent $linkPath) -Force | Out-Null
New-Item -ItemType Junction -Path $linkPath -Target $sharedSkillsPath | Out-Null

Write-Host 'Shared skills link created:'
Write-Host "$linkPath -> $sharedSkillsPath"
