#!/bin/bash
# install-wine
# Script to install wine to run Windows batch file.

# wineHQ repo
sudo mkdir -pm755 /etc/apt/keyrings
wget -O - https://dl.winehq.org/wine-builds/winehq.key | sudo gpg --dearmor -o /etc/apt/keyrings/winehq-archive.key -

# distribution noble - assuming codespaces
sudo dpkg --add-architecture i386
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/noble/winehq-noble.sources

# update and install wine
sudo apt update
sudo apt install --install-recommends winehq-stable

echo INSTALL COMPLETE
echo ----------------
echo
echo Run \`wine cmd\` to start a DOS shell.
echo
