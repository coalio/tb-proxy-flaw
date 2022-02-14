sysctl net.ipv4.ip_forward=1 # to enable redirecting to localhost
EXTERNAL_IP="5.9.123.158"
DUMMY_IP="5.9.123.159"
sudo iptables -t nat -A OUTPUT -p tcp --dport 20100:20499 -d ${DUMMY_IP} -j DNAT --to-destination ${EXTERNAL_IP}
sudo iptables -t nat -A OUTPUT -p tcp --dport 20100:20499 -d ${EXTERNAL_IP} -j DNAT --to-destination 127.0.0.1
