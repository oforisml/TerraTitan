#!/bin/bash
# source: https://github.com/SigNoz/signoz/blob/main/deploy/install.sh
set -o errexit

wait_for_containers_start() {
  local timeout=$1

  # The while loop is important because for-loops don't work for dynamic values
  while [[ $timeout -gt 0 ]]; do
    status_code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/v1/health?live=1" || true)"
    if [[ status_code -eq 200 ]]; then
      break
    else
      echo -ne "Waiting for all containers to start. This check will timeout in $timeout seconds ...\r\c"
    fi
    ((timeout--))
    sleep 1
  done

  echo ""
}

pushd docker || true
{
  echo "🟡 Pulling the latest container images for SigNoz."
  docker compose pull
  echo "🟡 Starting the SigNoz containers. It may take a few minutes ..."
  docker compose up --detach --remove-orphans || true
}
wait_for_containers_start 60
echo ""

if [[ $status_code -ne 200 ]]; then
  echo "+++++++++++ ERROR ++++++++++++++++++++++"
  echo "🔴 The containers didn't seem to start correctly. Please run the following command to check containers that may have errored out:"
  echo ""

  echo "cd docker"
  echo "docker compose ps -a"
  echo ""

  echo "Try bringing down the containers and retrying the installation"
  echo "cd docker"
  echo "docker compose down -v"
  echo ""

  echo "Please read our troubleshooting guide https://signoz.io/docs/install/troubleshooting/"
  echo "or reach us on SigNoz for support https://signoz.io/slack"
  echo "++++++++++++++++++++++++++++++++++++++++"

  exit 1

else
  echo "++++++++++++++++++ SUCCESS ++++++++++++++++++++++"
  echo ""
  echo "🟢 Your installation is complete!"
  echo ""
  echo -e "🟢 SigNoz is running on http://localhost:8080"
  echo ""
  echo "ℹ️  By default, retention period is set to 15 days for logs and traces, and 30 days for metrics."
  echo -e "To change this, navigate to the General tab on the Settings page of SigNoz UI. For more details, refer to https://signoz.io/docs/userguide/retention-period \n"

  echo "ℹ️  To bring down SigNoz and clean volumes:"
  echo ""
  echo "cd docker"
  echo "docker compose down -v"
fi

echo -e "\n🙏 Thank you!\n"
