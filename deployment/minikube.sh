#!/bin/bash
set -e

sudo apt-get -qq update -y 1>/dev/null && sudo apt-get -qq upgrade -y 1>/dev/null
sudo apt-get -qq install -y htop curl 1>/dev/null

# Install docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
sudo usermod -aG docker $USER && newgrp docker
sudo systemctl enable docker

# Install atlas
curl -sSf https://atlasgo.sh > atlasgo.sh
sh atlasgo.sh -y
rm atlasgo.sh

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Install minikube
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64

# Configure minikube
echo 'alias kubectl="minikube kubectl --"' >> ~/.bashrc
minikube config set driver docker
minikube config set memory 3200
minikube addons enable ingress
minikube addons enable metrics-server
minikube start --memory=3200mb
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

kubectl config view

echo "Done. Run 'minikube dashboard' to get a visual dashboard."
