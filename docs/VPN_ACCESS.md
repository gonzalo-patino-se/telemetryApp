# VPN Access Guide - saturnvpnconfig

This document provides instructions for connecting to the `saturnvpnconfig` VPN, which is required to access the Telemetry Dashboard application.

## Overview

The Telemetry Dashboard is deployed on a private AWS infrastructure and is not accessible from the public internet. All users must connect to the corporate VPN before accessing the application.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACCESS FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [Your Computer] ──VPN Tunnel──▶ [saturnvpnconfig] ──▶ [AWS VPC]   │
│                                                                      │
│   Without VPN: ❌ Access Denied                                      │
│   With VPN:    ✅ Full Access to Dashboard                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## VPN Configuration: saturnvpnconfig

| Property | Value |
|----------|-------|
| VPN Name | `saturnvpnconfig` |
| Protocol | OpenVPN / IKEv2 |
| Authentication | Certificate + Credentials |

## Getting VPN Access

### Step 1: Request Access

1. Contact your project administrator or team lead
2. Provide your:
   - Full name
   - Email address
   - Team/Department
   - Reason for access

### Step 2: Receive Configuration

You will receive either:
- An `.ovpn` configuration file, OR
- VPN server address + username + password

### Step 3: Install VPN Client

#### Windows

**Option A: OpenVPN Connect (Recommended)**
1. Download from: https://openvpn.net/vpn-client/
2. Install and run OpenVPN Connect
3. Import the `.ovpn` file
4. Click Connect

**Option B: Built-in Windows VPN**
1. Settings → Network & Internet → VPN
2. Add VPN connection
3. Enter server details provided by admin

#### macOS

**Option A: Tunnelblick (Recommended for OpenVPN)**
1. Download from: https://tunnelblick.net/
2. Install Tunnelblick
3. Double-click the `.ovpn` file to import
4. Click Connect

**Option B: OpenVPN Connect**
1. Download from Mac App Store or https://openvpn.net/vpn-client/
2. Import configuration file
3. Connect

#### Linux (Ubuntu/Debian)

```bash
# Install OpenVPN
sudo apt update
sudo apt install openvpn network-manager-openvpn-gnome

# Connect via command line
sudo openvpn --config /path/to/saturnvpnconfig.ovpn

# Or use NetworkManager GUI
# Settings → Network → VPN → Import from file
```

## Connecting to VPN

### Before Accessing the Dashboard

1. **Start VPN Connection**
   - Open your VPN client
   - Select `saturnvpnconfig` profile
   - Enter credentials if prompted
   - Wait for "Connected" status

2. **Verify Connection**
   ```bash
   # Test connectivity to internal resources
   ping <internal-server-ip>
   
   # Should respond if VPN is working
   ```

3. **Access Dashboard**
   - Open browser
   - Navigate to the dashboard URL (provided by admin)
   - Login with your credentials

### Connection Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 Connected | VPN tunnel established, ready to access |
| 🟡 Connecting | Establishing tunnel, please wait |
| 🔴 Disconnected | No VPN connection, cannot access dashboard |

## Troubleshooting

### Cannot Connect to VPN

| Issue | Solution |
|-------|----------|
| Connection timeout | Check internet connection, try different network |
| Authentication failed | Verify username/password, check certificate expiry |
| Server unreachable | VPN server may be down, contact admin |
| Certificate error | Re-import .ovpn file, check system date/time |

### VPN Connected but Dashboard Not Loading

| Issue | Solution |
|-------|----------|
| DNS resolution failed | Try using IP address directly |
| Page timeout | Check if VPN is still connected |
| 502 Bad Gateway | Server may be restarting, wait 1-2 minutes |
| SSL certificate error | Clear browser cache, try incognito mode |

### VPN Disconnects Frequently

1. Check your internet stability
2. Disable sleep/hibernate while working
3. Some routers block VPN - try mobile hotspot
4. Update VPN client to latest version

## For Developers (India Team)

### Development Environment Setup

1. **VPN Connection Required** for:
   - Accessing AWS EC2 instances
   - Connecting to Azure Data Explorer
   - Testing API endpoints
   - Deploying updates

2. **Environment Configuration**
   ```bash
   # After connecting to VPN, verify Azure ADX access
   curl -X POST http://<server-ip>/api/health/
   
   # Expected response: {"status": "ok", ...}
   ```

3. **SSH Access to AWS**
   ```bash
   # Requires VPN connection
   ssh -i your-key.pem ubuntu@<ec2-private-ip>
   ```

### Common Developer Tasks

```bash
# Deploy updates (requires VPN)
ssh -i key.pem ubuntu@<ec2-ip> "cd /opt/mysite && git pull && sudo supervisorctl restart all"

# View logs (requires VPN)
ssh -i key.pem ubuntu@<ec2-ip> "tail -f /opt/mysite/backend/logs/gunicorn.log"

# Database access (requires VPN)
ssh -i key.pem ubuntu@<ec2-ip> "cd /opt/mysite/backend && source venv/bin/activate && python manage.py shell"
```

## Security Reminders

⚠️ **Important Security Guidelines:**

1. **Never share VPN credentials** with unauthorized users
2. **Disconnect VPN** when not actively using the application
3. **Report immediately** if you suspect credential compromise
4. **Keep VPN client updated** to latest version
5. **Use strong passwords** for your VPN account

## Contact & Support

For VPN access issues or new access requests:

- **IT Support**: [Contact your IT department]
- **Project Admin**: [Contact project administrator]
- **Emergency**: [Emergency contact if critical system access needed]

---

*Last Updated: February 2026*
