# Firewall Configuration Guide

## ✅ Server Configuration Complete

The application is now configured to listen on all interfaces (0.0.0.0:3000).

**Server Status:**
- ✅ Listening on: 0.0.0.0:3000
- ✅ Local firewall: Inactive (no blocking)
- ✅ Application: Running and responding

## 🔥 Cloud Provider Firewall Configuration

The timeout error is likely due to your **cloud provider's firewall** blocking port 3000.

### For AWS EC2:
1. Go to EC2 Dashboard → Security Groups
2. Select your instance's security group
3. Click "Edit inbound rules"
4. Add rule:
   - Type: Custom TCP
   - Port: 3000
   - Source: 0.0.0.0/0 (or your specific IP)
   - Description: Next.js Application
5. Save rules

### For DigitalOcean:
1. Go to Networking → Firewalls
2. Select your firewall (or create one)
3. Add inbound rule:
   - Type: Custom
   - Protocol: TCP
   - Port Range: 3000
   - Sources: All IPv4, All IPv6 (or specific IPs)
4. Apply to your droplet

### For Google Cloud Platform:
1. Go to VPC Network → Firewall
2. Create firewall rule:
   - Name: allow-nextjs-3000
   - Direction: Ingress
   - Targets: All instances in the network
   - Source IP ranges: 0.0.0.0/0
   - Protocols and ports: TCP: 3000
3. Create rule

### For Azure:
1. Go to Network Security Groups
2. Select your NSG
3. Add inbound security rule:
   - Priority: 1000
   - Name: Allow-Port-3000
   - Port: 3000
   - Protocol: TCP
   - Source: Any
   - Destination: Any
   - Action: Allow
4. Save

### For Linode:
1. Go to Firewalls
2. Select your firewall
3. Add inbound rule:
   - Label: Next.js App
   - Protocol: TCP
   - Ports: 3000
   - Sources: 0.0.0.0/0
4. Save

## 🔍 Quick Test

After configuring the firewall, test from your local machine:

```bash
curl http://168.231.77.80:3000
```

Or open in browser: `http://168.231.77.80:3000`

## 📝 Alternative: Use Port 80/443 with Reverse Proxy

For production, consider:
1. Using Nginx as reverse proxy on port 80/443
2. Forwarding to your Next.js app on port 3000
3. This is more secure and standard for web traffic

See DEPLOYMENT.md for Nginx configuration.

## ⚠️ Security Note

Opening port 3000 to the internet is fine for testing, but for production:
- Use HTTPS (port 443) with SSL certificate
- Set up a reverse proxy (Nginx/Apache)
- Consider restricting source IPs if possible
