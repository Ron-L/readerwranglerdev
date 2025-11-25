"""
Timestamp Update Service for Claude Code
Updates .claude-timestamp file every 60 seconds with current local time.
Run this in the background: python update-timestamp.py
"""
import time

while True:
    with open('.claude-timestamp', 'w') as f:
        f.write(time.strftime('%Y-%m-%d %H:%M:%S'))
    time.sleep(60)
