# Setup script for OFICRI server directory structure
# ISO/IEC 27001 compliant architecture

# Create main server directory
New-Item -Path "server" -ItemType Directory -Force

# Create config directory
New-Item -Path "server\config" -ItemType Directory -Force

# Create middleware directories
New-Item -Path "server\middleware" -ItemType Directory -Force
New-Item -Path "server\middleware\auth" -ItemType Directory -Force
New-Item -Path "server\middleware\security" -ItemType Directory -Force
New-Item -Path "server\middleware\validation" -ItemType Directory -Force

# Create models directories
New-Item -Path "server\models" -ItemType Directory -Force
New-Item -Path "server\models\user" -ItemType Directory -Force
New-Item -Path "server\models\document" -ItemType Directory -Force
New-Item -Path "server\models\security" -ItemType Directory -Force

# Create services directories
New-Item -Path "server\services" -ItemType Directory -Force
New-Item -Path "server\services\auth" -ItemType Directory -Force
New-Item -Path "server\services\user" -ItemType Directory -Force
New-Item -Path "server\services\document" -ItemType Directory -Force
New-Item -Path "server\services\security" -ItemType Directory -Force

# Create controllers directory
New-Item -Path "server\controllers" -ItemType Directory -Force

# Create routes directory
New-Item -Path "server\routes" -ItemType Directory -Force

# Create utils directories
New-Item -Path "server\utils" -ItemType Directory -Force
New-Item -Path "server\utils\logger" -ItemType Directory -Force
New-Item -Path "server\utils\validation" -ItemType Directory -Force

# Create scripts directories
New-Item -Path "server\scripts" -ItemType Directory -Force
New-Item -Path "server\scripts\backup" -ItemType Directory -Force

# Create tests directories
New-Item -Path "server\tests" -ItemType Directory -Force
New-Item -Path "server\tests\unit" -ItemType Directory -Force
New-Item -Path "server\tests\integration" -ItemType Directory -Force
New-Item -Path "server\tests\security" -ItemType Directory -Force
New-Item -Path "server\tests\mocks" -ItemType Directory -Force

# Create docs directories
New-Item -Path "server\docs" -ItemType Directory -Force
New-Item -Path "server\docs\security" -ItemType Directory -Force
New-Item -Path "server\docs\api" -ItemType Directory -Force
New-Item -Path "server\docs\maintenance" -ItemType Directory -Force

Write-Output "Server directory structure created successfully!" 