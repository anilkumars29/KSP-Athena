$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot

# Start the local Catalyst environment without terminating unrelated
# Node.js, Java, or Python processes on the developer's machine.
catalyst serve
