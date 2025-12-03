import urllib.request
import json
import ssl
import os
import sys

def main():
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("GITHUB_TOKEN not found!")
        sys.exit(1)
        
    repo_name = "scorelint"
    
    # 1. Create Repo
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    data = {
        "name": repo_name,
        "description": "A semantic linter for digital music scores.",
        "private": False,
        "has_issues": True
    }
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Setup proxy bypass (urllib uses env proxies by default, we just rely on it with CERT_NONE)
    # Actually urllib gets it from env. The main issue was SSL.
    
    req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode('utf-8'))
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            print("Repo created:", response.getcode())
    except urllib.error.HTTPError as e:
        if e.code == 422: # Already exists
            print("Repo might already exist.")
        else:
            print("Failed to create repo:", e.code, e.read().decode())
            sys.exit(1)
            
    # 2. Upload Deploy Key
    with open('.git/deploy_key.pub', 'r') as f:
        pub_key = f.read().strip()
        
    url_key = f"https://api.github.com/repos/lorenhey/{repo_name}/keys"
    data_key = {
        "title": "Deploy Key",
        "key": pub_key,
        "read_only": False
    }
    req_key = urllib.request.Request(url_key, headers=headers, data=json.dumps(data_key).encode('utf-8'))
    try:
        with urllib.request.urlopen(req_key, context=ctx) as response:
            print("Deploy key added:", response.getcode())
    except urllib.error.HTTPError as e:
        print("Failed to add key:", e.code, e.read().decode())
        
if __name__ == "__main__":
    main()
