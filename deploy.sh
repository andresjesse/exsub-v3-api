# RUN ON SERVER

# 1-A First Run
cd ~
mkdir apps
mkdir apps/exsub-v3-api
cd ~/apps/exsub-v3-api
git clone https://github.com/andresjesse/exsub-v3-api.git

# 1-B To Update production
cd ~/apps/exsub-v3-api/exsub-v3-api
git pull
yarn
node ace build --production --ignore-ts-errors

# 2 Copy built code
cp -rT ../production_base ../production
cp -rT build ../production
cd ../production
yarn install --production
node ace migration:run --force

# 3 (First Run Only) Init (in production directory):
mkdir tmp
mkdir tmp/compilation
node ace migration:run
node ace create:admin <email> <password> admin

# 4 (First Run Only) PM2 config (in production directory)
pm2 start ecosystem.config.js
pm2 startup # if not already configured to start at boot)
pm2 save