
# This script is used to create an LightSail instance using Terraform.

sudo apt update
##################################################################
# Install NVM
##################################################################
sudo apt install -y curl build-essential
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# Install Node.js
nvm install v18.10

# Alias for NVM
nvm alias default v18.10

##################################################################
# git clone (Read only ssh)
##################################################################
# This is a read-only clone of the repository. You can use this to get the latest code.
# If you want to make changes to the code, you need to fork the repository and clone your fork.
# If you want to clone the repository using HTTPS, use the following command:
cd /home/ubuntu/.ssh

# Update the ssh config file to use the correct key
cat <<EOT >> config
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes
EOT

# Copy id_ed25519.pub to the clipboard
# This is the public key that you need to add to your GitHub account
# You can use the following command to copy the public key to the clipboard
cat ~/.ssh/id_ed25519.pub | xclip -selection clipboard

# Clone the repository
git clone {REPO_URL} /home/ubuntu/mclose

##################################################################
# Nginx Installation and Configuration
##################################################################
sudo apt install nginx -y

# Create a new Nginx configuration file
sudo tee /etc/nginx/sites-available/mclose <<EOF
# https://mclose.net
server {
    listen 80;
    server_name mclose.net www.mclose.net;

    client_max_body_size 100M;  # 요청 본문 크기 제한 설정

    location / {
        proxy_pass http://127.0.0.1:3000;  # 3000번 포트로 프록시
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# https://admin.mclose.net에 대한 설정
server {
# https://mclose.net
server {
    listen 80;
server_name mclose.net www.mclose.net;

client_max_body_size 100M;  # 요청 본문 크기 제한 설정

location / {
proxy_pass http://127.0.0.1:3000;  # 3000번 포트로 프록시
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
    }
}

# https://admin.mclose.net에 대한 설정
server {
    listen 80;
    server_name admin.mclose.net;

root /var/www/admin;
    index index.html;

location / {
proxy_pass http://127.0.0.1:4500;  # 4000번 포트로 프록시
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_cache_bypass $http_upgrade;
proxy_set_header X-Real-IP $remote_addr;
    }
}
ubuntu@ip-172-26-13-149:~$ cat /etc/nginx/sites-available/mclose
# https://mclose.net
server {
    listen 80;
    server_name mclose.net www.mclose.net;

    client_max_body_size 100M;  # 요청 본문 크기 제한 설정

    location / {
        proxy_pass http://127.0.0.1:3000;  # 3000번 포트로 프록시
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# https://admin.mclose.net에 대한 설정
server {
    listen 80;
    server_name admin.mclose.net;

    root /var/www/admin;
    index index.html;

    location / {
        proxy_pass http://127.0.0.1:4500;  # 4000번 포트로 프록시
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}


# https://app-api.mclose.net에 대한 설정
server {
    listen 80;
    server_name app-api.mclose.net;

    client_max_body_size 100M;  # 요청 본문 크기 제한 설정

    location / {
        proxy_pass http://127.0.0.1:4000;  # 4000번 포트로 프록시
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the new configuration
sudo ln -s /etc/nginx/sites-available/mclose /etc/nginx/sites-enabled/

# create health check file
sudo touch /var/www/html/health-check.html
sudo tee /var/www/html/health-check.html <<EOF
PING
EOF

# Test the Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

##################################################################
# Install s3fs(Deorecated)
##################################################################
sudo apt install s3fs -y

# Create a directory to mount the S3 bucket
mkdir -p /home/ubuntu/mclose-s3