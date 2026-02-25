FROM node:trixie

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @adonisjs/cli

WORKDIR /workspaces/project

CMD ["bash"]


