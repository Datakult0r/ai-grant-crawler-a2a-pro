# Auto-Accept Gemini VS Code prompts
# Sends Alt+E (Accept shortcut) to VS Code every 5 seconds
# Run: powershell -ExecutionPolicy Bypass -File auto-accept-gemini.ps1
# Stop: Ctrl+C

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class User32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll", SetLastError=true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
"@

Add-Type -AssemblyName System.Windows.Forms

function Get-VSCodeWindow {
    $found = $null
    $callback = [User32+EnumWindowsProc]{
        param($hWnd, $lParam)
        $sb = New-Object System.Text.StringBuilder 256
        [User32]::GetWindowText($hWnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        if ($title -like "*Visual Studio Code*") {
            $script:found = $hWnd
            return $false
        }
        return $true
    }
    [User32]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
    return $found
}

Write-Host "Auto-Accept Gemini running. Press Ctrl+C to stop."
Write-Host "Sending Alt+E to VS Code every 5 seconds..."

while ($true) {
    $vsCodeWnd = Get-VSCodeWindow
    if ($vsCodeWnd) {
        $currentWnd = [User32]::GetForegroundWindow()
        [User32]::SetForegroundWindow($vsCodeWnd) | Out-Null
        Start-Sleep -Milliseconds 200
        [System.Windows.Forms.SendKeys]::SendWait("%e")  # Alt+E
        Start-Sleep -Milliseconds 200
        # Restore previous window
        if ($currentWnd -ne $vsCodeWnd) {
            [User32]::SetForegroundWindow($currentWnd) | Out-Null
        }
    }
    Start-Sleep -Seconds 5
}
