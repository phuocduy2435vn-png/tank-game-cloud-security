#!/bin/bash
# 1. Cập nhật hệ thống và cài đặt Node.js + NPM
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. Cài đặt PM2 toàn cục (Global) để quản lý tiến trình
sudo npm install pm2 -g

# 3. Tạo user game-runner để chạy ứng dụng (Đảm bảo bảo mật Least Privilege)
sudo useradd -m game-runner

# 4. Clone mã nguồn Game từ GitHub của bạn về thư mục Demo
cd /home/azureuser
# Thay URL GitHub của bạn vào dòng dưới đây
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git Demo
cd Demo

# 5. Cài đặt các thư viện (Dependencies) của dự án
npm install --save-dev gulp@4.0.0
npm install

# 6. Cấp quyền sở hữu thư mục cho user game-runner và chạy ứng dụng bằng PM2
sudo chown -R game-runner:game-runner /home/azureuser/Demo
sudo -u game-runner pm2 start bin/server/server.js --name "tank-game" --cwd /home/azureuser/Demo

# 7. Cấu hình PM2 tự động bật lại cùng hệ thống nếu máy ảo bị restart
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u game-runner --hp /home/game-runner
sudo -u game-runner pm2 save