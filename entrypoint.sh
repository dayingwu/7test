
#!/bin/sh

# 检查环境变量是否存在
if [ -z "$API_KEY" ]; then
  echo "Warning: API_KEY is not set. The app may not function correctly."
else
  echo "Injecting API_KEY into index.html..."
  # 将 index.html 中的 <!-- ENV_INJECTION --> 替换为实际的脚本内容
  sed -i "s|<!-- ENV_INJECTION -->|<script>window.process = { env: { API_KEY: '$API_KEY' } };</script>|g" /usr/share/nginx/html/index.html
fi

# 启动 Nginx
exec nginx -g "daemon off;"
