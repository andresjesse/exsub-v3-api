# RUN ON SERVER

cd ~/apps/exsub-v3-api
git clone https://github.com/andresjesse/exsub-v3-api.git
cd exsub-v3-api/
yarn
node ace build --production --ignore-ts-errors

cp -rT ../production_base ../production
cp -rT build ../production
cd ../production
yarn install --production
node ace migration:run --force

# First Run Init (in production directory):
mkdir tmp
node ace migration:run
node ace create:admin <email> <password> admin