# 🚀 Quick Start Guide - Admin System Deployment

## 1. แก้ไขการตั้งค่า

### แก้ไข `deploy/inventory/hosts.ini`:
```ini
[prod]
192.168.1.100 ansible_user=deploy
# หรือใช้ domain
# myserver.example.com ansible_user=deploy
```

### แก้ไข `deploy/group_vars/prod.yml`:
```yaml
# เปลี่ยนตามโปรเจคของคุณ
app_name: "admin"                    # ชื่อแอป
app_user: "root"                       # user บนเซิร์ฟเวอร์
app_group: "root"                      # group บนเซิร์ฟเวอร์
app_root: "/opt/admin"               # path ฝั่ง backend
web_root: "/var/www/admin"           # path ฝั่ง frontend
api_service: "admin"             # ชื่อ systemd API service
worker_service: "admin-worker"       # ชื่อ systemd Worker service
api_port: 3003                         # พอร์ต API (Worker จะเป็น 3004)

# domains สำหรับ nginx
api_domain: "admin.example.com"      # Main domain (serves both API and frontend)

# SSL settings
ssl_email: "admin@example.com"     # Email สำหรับ Let's Encrypt
ssl_country: "LA"
ssl_state: "Vientiane"
ssl_organization: "Admin"
```

## 2. เตรียมเซิร์ฟเวอร์

### สร้าง directories:
```bash
# บนเซิร์ฟเวอร์
sudo mkdir -p /opt/admin
sudo mkdir -p /var/www/admin
```

### ติดตั้ง dependencies:
```bash
# ติดตั้ง Bun
curl -fsSL https://bun.sh/install | bash

# ติดตั้ง PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# ติดตั้ง Nginx และ dependencies สำหรับ SSL
sudo apt install nginx certbot python3-certbot-nginx

# ติดตั้ง rsync
sudo apt install rsync
```

### สร้าง database:
```bash
sudo -u postgres psql
CREATE DATABASE admin_db;
CREATE USER admin_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE admin_db TO admin_user;
\q
```

## 3. สร้าง Environment File

```bash
# บนเซิร์ฟเวอร์
sudo cp /path/to/deploy/templates/env.example /etc/admin.env
sudo nano /etc/admin.env
```

แก้ไขค่าตามจริง:
```bash
NODE_ENV=production
PORT=3003
WORKER_PORT=3004
DATABASE_URL=postgresql://admin_user:your_password@localhost:5432/admin_db
BETTER_AUTH_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://admin.example.com
```

ตั้งค่า permissions:
```bash
sudo chmod 600 /etc/admin.env
sudo chown root:root /etc/admin.env
```

## 4. Deploy

### Setup ครั้งแรก:
```bash
# ตรวจสอบ requirements
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/setup.yml --check

# Setup services และ nginx
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/setup.yml
```

### Deploy แอป:
```bash
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/deploy.yml
```

## 5. ตรวจสอบ

### ตรวจสอบ services:
```bash
sudo systemctl status admin admin-worker
sudo systemctl status nginx
```

### ตรวจสอบ logs:
```bash
sudo journalctl -u admin -f
sudo journalctl -u admin-worker -f
```

### ตรวจสอบ website:
```bash
# ตรวจสอบ API
curl https://admin.example.com/health

# ตรวจสอบ Frontend (ควร return HTML)
curl https://admin.example.com/
```

## 6. Rollback (ถ้าจำเป็น)

```bash
# ใช้ script
export APP_NAME=admin
export SERVER_ROOT=/opt/admin
export API_SERVICE=admin
export WORKER_SERVICE=admin-worker

./deploy/scripts/rollback.sh
```

## 7. SSL Certificate Management

### Renew SSL certificates:
```bash
ansible-playbook -i deploy/inventory/hosts.ini deploy/playbooks/renew-ssl.yml
```

### Manual SSL renewal:
```bash
# บนเซิร์ฟเวอร์
sudo certbot renew --nginx

# ตรวจสอบสถานะ
sudo certbot certificates
```

## 8. Troubleshooting

### ถ้า API ไม่รัน:
```bash
sudo journalctl -u admin -n 50
sudo systemctl restart admin
```

### ถ้า Worker ไม่รัน:
```bash
sudo journalctl -u admin-worker -n 50
sudo systemctl restart admin-worker
```

### ถ้า Nginx ไม่ทำงาน:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### ตรวจสอบ ports:
```bash
sudo netstat -tlnp | grep :3003
sudo netstat -tlnp | grep :3004
```

## 📁 Directory Structure หลัง Deploy

```
/opt/admin/
├── current -> releases/20241201130000/
├── releases/
│   └── 20241201130000/
│       └── server/
│           ├── dist/
│           └── public/uploads -> ../../shared/uploads
└── shared/
    └── uploads/
        ├── uploads/
        ├── banners/
        └── products/

/var/www/admin/
├── current -> releases/20241201130000/
└── releases/
    └── 20241201130000/
        ├── index.html
        └── assets/
```

## 🎯 สรุป

1. แก้ไข `inventory/hosts.ini` และ `group_vars/prod.yml`
2. เตรียมเซิร์ฟเวอร์ (directories, dependencies, database)
3. สร้าง `/etc/admin.env`
4. รัน `setup.yml` แล้ว `deploy.yml`
5. ตรวจสอบ services และ website

เสร็จแล้ว! 🎉
