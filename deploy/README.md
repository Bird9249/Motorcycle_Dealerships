# Ansible Deployment for Admin System

This Ansible setup deploys a unified API service with:
- **Frontend**: React + Vite (served by API server)
- **Backend**: Hono + Bun (API + static file serving)
- **Workers**: Background workers (runs on separate port)
- **Database**: PostgreSQL with migrations
- **Static Files**: API server serves both frontend assets and API endpoints

## Prerequisites

### Local Machine
- Ansible installed
- Bun installed and in PATH
- rsync installed

### Server
- Ubuntu/Debian server
- Bun installed (or Node.js if using compiled JS)
- PostgreSQL installed
- Nginx installed
- rsync installed

## Setup (First Time)

### 1. Check Requirements

Run the setup playbook to check if all requirements are met:
```bash
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/setup.yml --check
```

### 2. Configure Placeholders

Edit these files and replace placeholders:

```bash
# Replace these placeholders in all files:
[[app_name]]           → admin (default: admin)
[[api_service]]        → admin (default: admin)
[[worker_service]]     → admin-worker (default: admin-worker)
[[server_name]]        → admin.example.com (default: admin.example.com)
[[api_port]]           → 3003 (default: 3003)
[[deploy_user]]        → root (default: root)
[[deploy_group]]       → root (default: root)
[[server_root]]        → /opt/admin (default: /opt/admin)
[[web_root]]           → /var/www/admin (default: /var/www/admin)
```

### 2. Update Inventory

Edit `inventory/hosts.ini`:
```ini
[prod]
your-server-ip-or-dns ansible_user=deploy
```

### 3. Create Environment File

Copy the example environment file:
```bash
# On the server
sudo cp /path/to/deploy/templates/env.example /etc/your-app-name.env
sudo nano /etc/your-app-name.env
```

Update the values in the file:
```bash
NODE_ENV=production
PORT=3000
WORKER_PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://your-domain.com,http://localhost:3001
```

Set proper permissions:
```bash
sudo chmod 600 /etc/your-app-name.env
sudo chown deploy:deploy /etc/your-app-name.env
```

### 4. Setup Systemd Services and Nginx

Run the setup playbook to create systemd services and nginx configuration:
```bash
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/setup.yml
```

This will:
- Create systemd service files for API and Worker
- Create nginx site configuration
- Enable the nginx site
- Test nginx configuration

### 5. Manual Setup (Alternative)

Create nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/your-app-name
```

Copy the nginx template content and update placeholders.

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/your-app-name /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment

### Deploy (Build + Upload + Switch)

From the monorepo root directory:
```bash
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/deploy.yml
```

This will:
1. Check requirements (bun, rsync, env file, PostgreSQL)
2. Build frontend and backend locally
3. Upload artifacts to server
4. Create new release directory
5. Update symlinks atomically
6. Run database migrations
7. Restart services and verify they're running
8. Clean up old releases

### Rollback

#### Option 1: Using Rollback Script (Recommended)
```bash
# On the server
export APP_NAME=your-app-name
export SERVER_ROOT=/home/deploy/myapp
export API_SERVICE=your-app-api
export WORKER_SERVICE=your-app-worker

./deploy/scripts/rollback.sh
```

#### Option 2: Manual Rollback
```bash
# SSH to server
ssh deploy@your-server

# List available releases
ls -la /home/deploy/myapp/releases/

# Update symlink to previous release
sudo ln -sfn /home/deploy/myapp/releases/20241201120000 /home/deploy/myapp/current

# Restart services
sudo systemctl restart your-app-api your-app-worker

# Check service status
sudo systemctl status your-app-api your-app-worker
```

## Project Structure

```
deploy/
├── inventory/
│   └── hosts.ini              # Server inventory
├── group_vars/
│   └── prod.yml               # Production variables
├── playbooks/
│   └── deploy.yml             # Main deployment playbook
└── roles/
    └── app/
        ├── tasks/
        │   ├── main.yml       # Main task orchestrator
        │   ├── build_local.yml # Local build tasks
        │   ├── release_server.yml # Server release tasks
        │   ├── migrate.yml    # Database migration tasks
        │   └── cleanup.yml    # Cleanup old releases
        ├── handlers/
        │   └── main.yml       # Service restart handlers
        └── templates/
            ├── app-api.service.j2      # API systemd service
            ├── app-worker.service.j2   # Worker systemd service
            └── nginx-app.conf.j2       # Nginx configuration
```

## Server Directory Structure

```
/opt/admin/
├── releases/
│   ├── 20241201120000/
│   │   └── server/
│   │       ├── dist/          # Built server code
│   │       ├── public/        # Static files (symlinked)
│   │       ├── index.ts       # Server entry point
│   │       └── worker.ts      # Worker entry point
│   └── 20241201130000/        # Previous release
├── current -> releases/20241201120000/  # Current release symlink
└── shared/
    ├── migrations/            # SQL migration files
    └── uploads/               # User uploads (persistent)
```

## Environment Variables

Required environment variables in `/etc/admin.env`:

- `NODE_ENV=production`
- `PORT=3003` (API port)
- `WORKER_PORT=3004` (Worker port)
- `DATABASE_URL=postgresql://admin_user:password@localhost:5432/admin_db`
- `BETTER_AUTH_SECRET=your-secret-key`
- `CORS_ORIGIN=https://admin.example.com`

## Troubleshooting

### Check Service Status
```bash
sudo systemctl status admin
sudo systemctl status admin-worker
```

### View Logs
```bash
sudo journalctl -u admin -f
sudo journalctl -u admin-worker -f
```

### Check Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Manual Migration
```bash
# SSH to server
ssh deploy@your-server

# Run migrations manually
cd /home/deploy/myapp/current/server
sudo -u postgres psql -d "$(grep DATABASE_URL /etc/your-app-name.env | cut -d= -f2)" -f /home/deploy/myapp/shared/migrations/your-migration.sql
```

## Notes

- The deployment is atomic - symlinks are updated after successful upload
- Old releases are automatically cleaned up (keeps last 5)
- Migrations are idempotent - only new files are applied
- Static files are served by Nginx for better performance
- API and Worker run as separate systemd services
- All services restart automatically after deployment
