# 🔐 SSH Key Setup for Hostinger VPS

This guide will help you set up SSH key authentication to securely access your Hostinger VPS.

## 📋 Prerequisites

- Access to your local machine (Linux/Mac/Windows)
- Hostinger VPS credentials (IP address, username, password)
- Terminal/Command Prompt access

---

## 🔑 Step 1: Generate SSH Key Pair (Local Machine)

### On Linux/Mac:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "your_email@example.com"

# Or if ed25519 is not supported, use RSA:
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**During key generation:**
- Press Enter to accept default file location (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`)
- Optionally set a passphrase for extra security (recommended)
- Your public key will be saved as `~/.ssh/id_ed25519.pub` (or `~/.ssh/id_rsa.pub`)

### On Windows (PowerShell or Git Bash):

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Or use RSA:
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

---

## 📤 Step 2: Copy Your Public Key

### Display your public key:

**Linux/Mac:**
```bash
cat ~/.ssh/id_ed25519.pub
# or
cat ~/.ssh/id_rsa.pub
```

**Windows (PowerShell):**
```powershell
Get-Content ~\.ssh\id_ed25519.pub
# or
Get-Content ~\.ssh\id_rsa.pub
```

**Copy the entire output** - it should look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... your_email@example.com
```

---

## 🖥️ Step 3: Add Public Key to Hostinger VPS

### Method 1: Using ssh-copy-id (Easiest - Linux/Mac only)

```bash
# Replace with your VPS details
ssh-copy-id username@your-vps-ip

# Example:
ssh-copy-id root@123.456.789.0
```

You'll be prompted for your password once, then the key will be automatically added.

### Method 2: Manual Method (All Platforms)

**3.1. Connect to your VPS with password:**
```bash
ssh username@your-vps-ip
# Example: ssh root@123.456.789.0
```

**3.2. Create .ssh directory (if it doesn't exist):**
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

**3.3. Add your public key to authorized_keys:**
```bash
# Open authorized_keys file
nano ~/.ssh/authorized_keys

# Paste your public key (the one you copied in Step 2)
# Save and exit (Ctrl+X, then Y, then Enter)
```

**3.4. Set correct permissions:**
```bash
chmod 600 ~/.ssh/authorized_keys
```

**3.5. Exit the VPS:**
```bash
exit
```

### Method 3: Using Hostinger Control Panel (If Available)

1. Log in to your Hostinger control panel
2. Navigate to VPS management
3. Look for "SSH Keys" or "Security" section
4. Add your public key there

---

## ✅ Step 4: Test SSH Key Authentication

**Try connecting without password:**
```bash
ssh username@your-vps-ip
# Example: ssh root@123.456.789.0
```

If set up correctly, you should connect **without being prompted for a password**.

---

## 🔧 Step 5: Configure SSH Client (Optional but Recommended)

Create or edit `~/.ssh/config` on your local machine for easier connections:

**Linux/Mac:**
```bash
nano ~/.ssh/config
```

**Windows:**
```powershell
notepad ~\.ssh\config
```

**Add this configuration:**
```
Host hostinger-vps
    HostName your-vps-ip
    User username
    IdentityFile ~/.ssh/id_ed25519
    Port 22
```

**Now you can connect simply with:**
```bash
ssh hostinger-vps
```

---

## 🔒 Step 6: Disable Password Authentication (Optional - More Secure)

**⚠️ WARNING:** Only do this AFTER confirming SSH key authentication works!

**On your VPS, edit SSH config:**
```bash
sudo nano /etc/ssh/sshd_config
```

**Find and modify these lines:**
```
PasswordAuthentication no
PubkeyAuthentication yes
```

**Restart SSH service:**
```bash
sudo systemctl restart sshd
# or on some systems:
sudo service ssh restart
```

---

## 🛠️ Troubleshooting

### Issue: "Permission denied (publickey)"

**Solutions:**
1. Verify public key is in `~/.ssh/authorized_keys` on VPS
2. Check file permissions:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
3. Check SSH server logs on VPS:
   ```bash
   sudo tail -f /var/log/auth.log
   ```

### Issue: "Too many authentication failures"

**Solution:** Specify the key explicitly:
```bash
ssh -i ~/.ssh/id_ed25519 username@your-vps-ip
```

### Issue: Connection timeout

**Solutions:**
1. Verify VPS IP address is correct
2. Check if port 22 is open in firewall
3. Verify VPS is running and accessible

### Issue: SSH key not found

**Solution:** Specify the key path:
```bash
ssh -i ~/.ssh/id_ed25519 username@your-vps-ip
```

---

## 📝 Quick Reference Commands

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to clipboard (Linux)
cat ~/.ssh/id_ed25519.pub | xclip -sel clip

# Copy public key to clipboard (Mac)
cat ~/.ssh/id_ed25519.pub | pbcopy

# Connect to VPS
ssh username@your-vps-ip

# Connect with specific key
ssh -i ~/.ssh/id_ed25519 username@your-vps-ip

# Test SSH connection
ssh -v username@your-vps-ip
```

---

## 🔐 Security Best Practices

1. **Use strong passphrases** for your SSH keys
2. **Never share your private key** (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`)
3. **Use different keys** for different servers
4. **Regularly rotate keys** (every 6-12 months)
5. **Disable root login** if possible (use sudo instead)
6. **Change default SSH port** (optional, but adds security)
7. **Use fail2ban** to prevent brute force attacks

---

## 📚 Additional Resources

- [Hostinger VPS Documentation](https://www.hostinger.com/tutorials/vps)
- [OpenSSH Manual](https://www.openssh.com/manual.html)
- [SSH Key Best Practices](https://www.ssh.com/academy/ssh/key)

---

## ✅ Verification Checklist

- [ ] SSH key pair generated on local machine
- [ ] Public key copied to VPS `~/.ssh/authorized_keys`
- [ ] Correct permissions set (700 for .ssh, 600 for authorized_keys)
- [ ] SSH connection tested without password
- [ ] SSH config file created (optional)
- [ ] Password authentication disabled (optional, after testing)

---

**Need Help?** If you encounter issues, check the troubleshooting section or contact Hostinger support.

