#!/usr/bin/env python3
"""
Orbit one-shot deployer.

Run this on a fresh Linux server (Ubuntu/Debian or Amazon Linux/RHEL) from
inside the project directory:

    sudo python3 deploy.py

It will:
  1. add swap if the box is small (helps the frontend build on 2 GB)
  2. install build tools + nginx (via apt / dnf / yum)
  3. install Node.js 20 LTS (official tarball, no distro repo needed; x64 + arm64)
  4. build the backend (Fastify + SQLite) and frontend (Vite)
  5. run the backend as a systemd service on 127.0.0.1:3000
  6. configure nginx to serve the built frontend and proxy /api -> backend
  7. start everything

Re-running is safe. Options:
    sudo python3 deploy.py --port 3000 --node 20.18.0
    sudo python3 deploy.py --server-name orbit.example.com
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
import urllib.request

NODE_DEFAULT = "20.18.0"
PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))
SERVICE = "orbit"

# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------
class C:
    G = "\033[92m"; Y = "\033[93m"; R = "\033[91m"; B = "\033[94m"; X = "\033[0m"

def say(msg):  print(f"{C.B}==>{C.X} {msg}")
def ok(msg):   print(f"{C.G} ✓{C.X} {msg}")
def warn(msg): print(f"{C.Y} !{C.X} {msg}")
def die(msg):  print(f"{C.R} ✗ {msg}{C.X}"); sys.exit(1)

def run(cmd, check=True, env=None, cwd=None):
    """Run a shell command, streaming output."""
    if isinstance(cmd, str):
        printable = cmd
        shell = True
    else:
        printable = " ".join(cmd)
        shell = False
    print(f"   $ {printable}")
    r = subprocess.run(cmd, shell=shell, env=env, cwd=cwd)
    if check and r.returncode != 0:
        die(f"command failed ({r.returncode}): {printable}")
    return r.returncode

def out(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True).strip()
    except Exception:
        return ""

def have(binary):
    return shutil.which(binary) is not None

# ----------------------------------------------------------------------------
# environment detection
# ----------------------------------------------------------------------------
def detect_pkg_manager():
    for pm in ("apt-get", "dnf", "yum"):
        if have(pm):
            return pm
    die("No supported package manager found (need apt-get, dnf, or yum).")

def node_arch():
    m = platform.machine().lower()
    if m in ("x86_64", "amd64"):
        return "x64"
    if m in ("aarch64", "arm64"):
        return "arm64"
    die(f"Unsupported CPU architecture: {m}")

def run_user():
    # The non-root user who invoked sudo — the service runs as them.
    u = os.environ.get("SUDO_USER")
    if u and u != "root":
        return u
    # Fall back to the owner of the project directory.
    try:
        import pwd
        return pwd.getpwuid(os.stat(PROJECT_DIR).st_uid).pw_name
    except Exception:
        return "root"

# ----------------------------------------------------------------------------
# steps
# ----------------------------------------------------------------------------
def ensure_root():
    if os.geteuid() != 0:
        die("Please run with sudo:  sudo python3 deploy.py")

def ensure_project():
    if not os.path.exists(os.path.join(PROJECT_DIR, "package.json")) or \
       not os.path.isdir(os.path.join(PROJECT_DIR, "server")):
        die(f"This script must sit in the Orbit project root.\n"
            f"   Expected package.json and server/ next to it in: {PROJECT_DIR}")
    ok(f"project: {PROJECT_DIR}")

def ensure_swap():
    mem_kb = int(out("grep MemTotal /proc/meminfo | awk '{print $2}'") or "0")
    mem_mb = mem_kb // 1024
    swap_kb = int(out("grep SwapTotal /proc/meminfo | awk '{print $2}'") or "0")
    if mem_mb == 0:
        return
    if mem_mb >= 3000:
        ok(f"RAM {mem_mb} MB — no swap needed")
        return
    if swap_kb > 0:
        ok(f"swap already present ({swap_kb // 1024} MB)")
        return
    say(f"RAM {mem_mb} MB — creating a 2 GB swap file")
    if not os.path.exists("/swapfile"):
        if run("fallocate -l 2G /swapfile", check=False) != 0:
            run("dd if=/dev/zero of=/swapfile bs=1M count=2048")
        run("chmod 600 /swapfile")
        run("mkswap /swapfile")
    run("swapon /swapfile", check=False)
    with open("/etc/fstab") as f:
        fstab = f.read()
    if "/swapfile" not in fstab:
        with open("/etc/fstab", "a") as f:
            f.write("/swapfile none swap sw 0 0\n")
    ok("swap enabled")

def install_packages(pm):
    say("installing build tools + nginx")
    if pm == "apt-get":
        env = {**os.environ, "DEBIAN_FRONTEND": "noninteractive"}
        run("apt-get update -y", env=env)
        run("apt-get install -y curl ca-certificates tar gzip xz-utils "
            "build-essential python3 nginx", env=env)
    else:
        # dnf (AL2023/RHEL9/Fedora) or yum (AL2/RHEL7)
        run(f"{pm} install -y curl ca-certificates tar gzip gcc gcc-c++ make python3", check=False)
        run(f'{pm} groupinstall -y "Development Tools"', check=False)
        if run(f"{pm} install -y nginx", check=False) != 0:
            # Amazon Linux 2 keeps nginx in an "extra"
            run("amazon-linux-extras install -y nginx1", check=False)
    ok("system packages ready")

def ensure_node(version):
    if have("node"):
        cur = out("node --version").lstrip("v")
        major = int(cur.split(".")[0]) if cur else 0
        if major >= 18:
            ok(f"node {cur} already installed")
            return
        warn(f"node {cur} is too old — installing {version}")
    arch = node_arch()
    tarball = f"node-v{version}-linux-{arch}.tar.gz"
    url = f"https://nodejs.org/dist/v{version}/{tarball}"
    dest = "/usr/local/lib/nodejs"
    say(f"downloading Node.js {version} ({arch})")
    tmp = f"/tmp/{tarball}"
    try:
        urllib.request.urlretrieve(url, tmp)
    except Exception as e:
        die(f"failed to download Node from {url}: {e}")
    os.makedirs(dest, exist_ok=True)
    run(f"tar -xzf {tmp} -C {dest} --strip-components=1")
    for b in ("node", "npm", "npx"):
        link = f"/usr/local/bin/{b}"
        target = f"{dest}/bin/{b}"
        if os.path.islink(link) or os.path.exists(link):
            os.remove(link)
        os.symlink(target, link)
    os.remove(tmp)
    ok(f"node {out('node --version')} installed")

def as_user(user, cmd, cwd):
    """Run a build command as the unprivileged user."""
    if user == "root":
        return run(cmd, cwd=cwd)
    # Preserve PATH so /usr/local/bin/node is visible.
    full = f'sudo -u {user} env PATH="$PATH" bash -lc {shlex_quote(cmd)}'
    return run(full, cwd=cwd)

def shlex_quote(s):
    import shlex
    return shlex.quote(s)

def npm_install_cmd(dir_):
    lock = os.path.join(dir_, "package-lock.json")
    return "npm ci" if os.path.exists(lock) else "npm install"

def build_frontend(user):
    say("building frontend (Vite)")
    as_user(user, npm_install_cmd(PROJECT_DIR), cwd=PROJECT_DIR)
    # Cap Node's heap so the build survives on a small box.
    as_user(user, "NODE_OPTIONS=--max-old-space-size=1024 npm run build", cwd=PROJECT_DIR)
    dist = os.path.join(PROJECT_DIR, "dist")
    if not os.path.isdir(dist):
        die("frontend build did not produce dist/")
    ok("frontend built -> dist/")

def build_backend(user):
    say("building backend (Fastify + SQLite)")
    server = os.path.join(PROJECT_DIR, "server")
    as_user(user, npm_install_cmd(server), cwd=server)
    as_user(user, "npm run build", cwd=server)
    data = os.path.join(server, "data")
    os.makedirs(data, exist_ok=True)
    if user != "root":
        run(f"chown -R {user}:{user} {shlex_quote(server)}", check=False)
    ok("backend built -> server/dist/")

def write_service(user, port):
    say("configuring systemd service")
    server = os.path.join(PROJECT_DIR, "server")
    db_path = os.path.join(server, "data", "orbit.db")
    node_bin = shutil.which("node") or "/usr/local/bin/node"
    unit = f"""[Unit]
Description=Orbit API server
After=network.target

[Service]
Type=simple
User={user}
WorkingDirectory={server}
Environment=NODE_ENV=production
Environment=PORT={port}
Environment=HOST=127.0.0.1
Environment=DATABASE_PATH={db_path}
Environment=COOKIE_SECURE=false
ExecStart={node_bin} {server}/dist/server.js
Restart=always
RestartSec=3
# Modest memory guard
MemoryMax=512M

[Install]
WantedBy=multi-user.target
"""
    path = f"/etc/systemd/system/{SERVICE}.service"
    with open(path, "w") as f:
        f.write(unit)
    run("systemctl daemon-reload")
    run(f"systemctl enable {SERVICE}", check=False)
    run(f"systemctl restart {SERVICE}")
    ok(f"service '{SERVICE}' running on 127.0.0.1:{port}")
    warn("COOKIE_SECURE=false (plain HTTP). After adding HTTPS, set it to true "
         f"in /etc/systemd/system/{SERVICE}.service and restart.")

def configure_nginx(port, server_name):
    say("configuring nginx")
    dist = os.path.join(PROJECT_DIR, "dist")
    conf = f"""server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name {server_name};

    root {dist};
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 512;

    # Cache hashed assets aggressively.
    location /assets/ {{
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }}

    # API -> backend
    location /api/ {{
        proxy_pass http://127.0.0.1:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    # SPA fallback
    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""
    # Debian/Ubuntu use sites-available; RHEL family use conf.d.
    if os.path.isdir("/etc/nginx/sites-available"):
        with open("/etc/nginx/sites-available/orbit", "w") as f:
            f.write(conf)
        link = "/etc/nginx/sites-enabled/orbit"
        if not os.path.exists(link):
            os.symlink("/etc/nginx/sites-available/orbit", link)
        default = "/etc/nginx/sites-enabled/default"
        if os.path.exists(default):
            os.remove(default)
    else:
        os.makedirs("/etc/nginx/conf.d", exist_ok=True)
        with open("/etc/nginx/conf.d/orbit.conf", "w") as f:
            f.write(conf)
        # Neutralise the stock default server if present.
        stock = "/etc/nginx/nginx.conf"
        if os.path.exists(stock):
            txt = open(stock).read()
            if "default_server" in txt:
                warn("a default server may exist in nginx.conf; orbit.conf also "
                     "declares default_server. If nginx -t complains, remove the "
                     "stock 'server {}' block from /etc/nginx/nginx.conf.")

    # nginx must be able to traverse into the project dir to read dist/.
    run(f"chmod o+x {shlex_quote(PROJECT_DIR)}", check=False)
    if run("nginx -t", check=False) != 0:
        die("nginx config test failed — see the message above.")
    run("systemctl enable nginx", check=False)
    run("systemctl restart nginx")
    ok("nginx serving the app on port 80")

def public_hint():
    ip = out("curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4") \
        or out("hostname -I | awk '{print $1}'") or "<server-ip>"
    return ip

# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Deploy Orbit on this Linux server.")
    ap.add_argument("--port", type=int, default=3000, help="backend port (default 3000)")
    ap.add_argument("--node", default=NODE_DEFAULT, help=f"Node.js version (default {NODE_DEFAULT})")
    ap.add_argument("--server-name", default="_", help="nginx server_name (default: _ / any host)")
    args = ap.parse_args()

    print(f"{C.B}Orbit deployer{C.X}\n")
    ensure_root()
    ensure_project()
    user = run_user()
    pm = detect_pkg_manager()
    ok(f"user={user}  pkg={pm}  arch={platform.machine()}")

    ensure_swap()
    install_packages(pm)
    ensure_node(args.node)
    build_frontend(user)
    build_backend(user)
    write_service(user, args.port)
    configure_nginx(args.port, args.server_name)

    ip = public_hint()
    print()
    ok("Deploy complete.")
    print(f"""
{C.G}Open:{C.X}   http://{ip}/
{C.G}Login:{C.X}  aditya@orbit.dev  /  changeme123   (change it!)

Manage:
  sudo systemctl status {SERVICE}      # backend status
  sudo journalctl -u {SERVICE} -f      # backend logs
  sudo systemctl restart {SERVICE}     # restart backend
  sudo nginx -t && sudo systemctl reload nginx

Change a password:
  cd {os.path.join(PROJECT_DIR, 'server')} && npm run set-password -- <email> '<newpass>'

Next: put HTTPS in front (e.g. certbot), then set COOKIE_SECURE=true in
/etc/systemd/system/{SERVICE}.service and `sudo systemctl restart {SERVICE}`.
Make sure your EC2 security group allows inbound port 80 (and 443 for HTTPS).
""")

if __name__ == "__main__":
    main()
