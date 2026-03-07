# job-queue-manager


# Kubernetes Connection Setup (temporary)
1. export KUBECONFIG=$(pwd)/discovery.yaml
2. kubectl port-forward svc/postgres 5432:5432 -n 22012-job-queue-manager
3. cd backend && node ace migration:run
