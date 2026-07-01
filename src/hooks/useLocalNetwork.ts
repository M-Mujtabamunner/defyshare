import { useEffect, useState } from 'react';

function deriveNetworkLabel(ip: string): string {
  const parts = ip.split('.');

  // 192.168.x.x — most common home/office WiFi routers
  if (parts[0] === '192' && parts[1] === '168') {
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  // 10.x.x.x — corporate / enterprise LANs and some ISPs
  if (parts[0] === '10') {
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  // 172.16–31.x.x — private networks (VPN, Docker, etc.)
  const p1 = parseInt(parts[1], 10);
  if (parts[0] === '172' && p1 >= 16 && p1 <= 31) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }

  return ip;
}

function getConnectionType(): string {
  // Network Information API (Chrome/Android only, not in Firefox/Safari)
  const nav = navigator as Navigator & {
    connection?: { type?: string; effectiveType?: string };
    mozConnection?: { type?: string };
    webkitConnection?: { type?: string };
  };
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn?.type) {
    switch (conn.type) {
      case 'wifi': return 'Wi-Fi';
      case 'ethernet': return 'Ethernet';
      case 'cellular': return 'Cellular';
      case 'bluetooth': return 'Bluetooth';
      default: break;
    }
  }
  return '';
}

interface LocalNetworkState {
  localIP: string | null;
  networkName: string;
  connectionType: string;
}

export const useLocalNetwork = (): LocalNetworkState => {
  const [state, setState] = useState<LocalNetworkState>({
    localIP: null,
    networkName: 'detecting...',
    connectionType: '',
  });

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      const connType = getConnectionType();

      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const timeoutId = setTimeout(() => {
          pc.close();
          if (!cancelled) {
            setState({
              localIP: null,
              networkName: connType ? `${connType} Network` : 'Local Network',
              connectionType: connType,
            });
          }
        }, 3000);

        pc.onicecandidate = (evt) => {
          if (cancelled || !evt.candidate) return;
          const match = evt.candidate.candidate.match(
            /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
          );
          if (!match) return;
          const ip = match[1];
          // Skip loopback and link-local addresses
          if (ip.startsWith('127.') || ip.startsWith('0.') || ip.startsWith('169.254.')) return;

          clearTimeout(timeoutId);
          pc.close();
          const subnet = deriveNetworkLabel(ip);
          const label = connType ? `${connType} · ${subnet}` : subnet;
          setState({ localIP: ip, networkName: label, connectionType: connType });
        };
      } catch {
        if (!cancelled) {
          setState({
            localIP: null,
            networkName: connType ? `${connType} Network` : 'Local Network',
            connectionType: connType,
          });
        }
      }
    };

    detect();
    return () => { cancelled = true; };
  }, []);

  return state;
};
